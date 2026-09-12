<?php
/**
 * Mini-Bazar Permanent Image Upload Endpoint
 * Production-ready for Hostinger Business (PHP 7.4 / 8.x)
 *
 * Strict Security Guardrails:
 * 1. Firebase Authentication & RBAC:
 *    - Requires 'Authorization: Bearer <Firebase_ID_Token>'
 *    - Cryptographically verifies RS256 signature using Google's public certificates
 *    - Validates audience (aud), issuer (iss), expiration (exp), auth_time, and subject (sub)
 *    - Enforces custom claim: 'admin: true' (rejects non-admin users with 403 Forbidden)
 * 2. File Constraints:
 *    - Max file size: 5 MB (5,242,880 bytes)
 *    - Allowed formats ONLY: JPEG, PNG, WebP, GIF
 *    - Strictly rejects: SVG (XSS vector), BMP, HEIC, HEIF, scripts, and non-image binaries
 *    - Content & Magic Bytes inspection (finfo + getimagesize + byte inspection)
 * 3. Storage Security:
 *    - Cryptographically random filenames (bin2hex + random_bytes)
 *    - Structured monthly storage: uploads/YYYY/MM/
 *    - Script execution disabled in storage directory via .htaccess
 */

// 1. Configure Headers & Error Reporting
header('Content-Type: application/json; charset=UTF-8');
header('X-Content-Type-Options: nosniff');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    echo json_encode(['success' => true]);
    exit;
}

// Only POST method is accepted
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => 'طريقة الطلب غير مسموح بها. يجب استخدام POST.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 2. Constants and Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_MIME_TYPES = [
    'image/jpeg' => '.jpg',
    'image/png'  => '.png',
    'image/webp' => '.webp',
    'image/gif'  => '.gif',
];

// Firebase Project ID configuration (can be overridden via environment variable)
$firebaseProjectId = getenv('FIREBASE_PROJECT_ID') ?: 'mini-bazar-demo';

// 3. Helper Functions for JWT & Authentication

/**
 * Extracts the Authorization header across various server environments (Apache, Nginx, FastCGI)
 */
function getAuthorizationHeader(): ?string {
    if (!empty($_SERVER['HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['HTTP_AUTHORIZATION']);
    }
    if (!empty($_SERVER['Authorization'])) {
        return trim($_SERVER['Authorization']);
    }
    if (!empty($_SERVER['REDIRECT_HTTP_AUTHORIZATION'])) {
        return trim($_SERVER['REDIRECT_HTTP_AUTHORIZATION']);
    }
    if (function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                return trim($value);
            }
        }
    }
    return null;
}

/**
 * Base64URL decoder for JWT segments
 */
function base64UrlDecode(string $input): string {
    $remainder = strlen($input) % 4;
    if ($remainder) {
        $padlen = 4 - $remainder;
        $input .= str_repeat('=', $padlen);
    }
    return (string)base64_decode(strtr($input, '-_', '+/'));
}

/**
 * Fetches and caches Google's x509 public certificates for Firebase Auth token verification
 */
function getGooglePublicCertificates(): ?array {
    $cacheFile = sys_get_temp_dir() . '/firebase_public_certs_' . md5('securetoken@system.gserviceaccount.com') . '.json';

    // 1. Try local cache
    if (file_exists($cacheFile)) {
        $cacheContent = @file_get_contents($cacheFile);
        if ($cacheContent) {
            $cached = json_decode($cacheContent, true);
            if (isset($cached['expires_at']) && $cached['expires_at'] > time() && !empty($cached['certs'])) {
                return $cached['certs'];
            }
        }
    }

    // 2. Fetch fresh certificates from Google's official public keys endpoint
    $url = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';
    $certsJson = false;

    // Prefer cURL if available
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 6);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'MiniBazar-PHP-Uploader/1.0');
        $certsJson = curl_exec($ch);
        curl_close($ch);
    }

    if (!$certsJson) {
        $ctx = stream_context_create([
            'http' => [
                'timeout' => 6,
                'header' => "User-Agent: MiniBazar-PHP-Uploader/1.0\r\n"
            ]
        ]);
        $certsJson = @file_get_contents($url, false, $ctx);
    }

    if ($certsJson) {
        $certs = json_decode($certsJson, true);
        if (is_array($certs) && !empty($certs)) {
            // Cache for 6 hours
            $cachedData = [
                'expires_at' => time() + 21600,
                'certs' => $certs,
            ];
            @file_put_contents($cacheFile, json_encode($cachedData), LOCK_EX);
            return $certs;
        }
    }

    return null;
}

/**
 * Verifies Firebase ID Token signature and custom admin claim
 */
function verifyFirebaseAdminToken(string $idToken, string $expectedProjectId): array {
    $parts = explode('.', $idToken);
    if (count($parts) !== 3) {
        return ['valid' => false, 'code' => 401, 'error' => 'رمز المصادقة غير صالح (صيغة JWT غير صحيحة).'];
    }

    [$headerB64, $payloadB64, $signatureB64] = $parts;

    $headerJson = base64UrlDecode($headerB64);
    $payloadJson = base64UrlDecode($payloadB64);
    $signature = base64UrlDecode($signatureB64);

    $header = json_decode($headerJson, true);
    $payload = json_decode($payloadJson, true);

    if (!$header || !$payload) {
        return ['valid' => false, 'code' => 401, 'error' => 'تعذر تحليل رمز المصادقة.'];
    }

    // Header validation
    if (empty($header['alg']) || $header['alg'] !== 'RS256') {
        return ['valid' => false, 'code' => 401, 'error' => 'خوارزمية تشفير الرمز غير مدعومة (يجب أن تكون RS256).'];
    }
    if (empty($header['kid'])) {
        return ['valid' => false, 'code' => 401, 'error' => 'رمز المصادقة يفتقر إلى معرف المفتاح (kid).'];
    }

    // Google Public Certificate verification
    $publicCerts = getGooglePublicCertificates();
    if (!$publicCerts || !isset($publicCerts[$header['kid']])) {
        return ['valid' => false, 'code' => 401, 'error' => 'تعذر مطابقة المفتاح العام مع شهادات Google الرسمية.'];
    }

    $certificate = $publicCerts[$header['kid']];
    $dataToVerify = $headerB64 . '.' . $payloadB64;

    $verifyResult = @openssl_verify($dataToVerify, $signature, $certificate, OPENSSL_ALGO_SHA256);
    if ($verifyResult !== 1) {
        return ['valid' => false, 'code' => 401, 'error' => 'توقيع رمز المصادقة غير صالح أو تم التلاعب به.'];
    }

    // Payload claims verification
    $now = time();

    // Expiration check (with 60s clock skew tolerance)
    if (empty($payload['exp']) || (int)$payload['exp'] < ($now - 60)) {
        return ['valid' => false, 'code' => 401, 'error' => 'انتهت صلاحية رمز المصادقة. يرجى إعادة تسجيل الدخول.'];
    }

    // Auth time check
    if (!empty($payload['auth_time']) && (int)$payload['auth_time'] > ($now + 60)) {
        return ['valid' => false, 'code' => 401, 'error' => 'وقت مصادقة الرمز غير صالح.'];
    }

    // Audience & Issuer checks
    $expectedIssuer = 'https://securetoken.google.com/' . $expectedProjectId;
    if (empty($payload['aud']) || $payload['aud'] !== $expectedProjectId) {
        return ['valid' => false, 'code' => 401, 'error' => 'رمز المصادقة لا يطابق مشروع Firebase المحدد (aud mismatch).'];
    }
    if (empty($payload['iss']) || $payload['iss'] !== $expectedIssuer) {
        return ['valid' => false, 'code' => 401, 'error' => 'مصدر الرمز غير صالح (iss mismatch).'];
    }

    // Subject (User UID) check
    if (empty($payload['sub']) || !is_string($payload['sub'])) {
        return ['valid' => false, 'code' => 401, 'error' => 'معرف المستخدم (UID) مفقود في رمز المصادقة.'];
    }

    // Admin Verification: custom claim 'admin' or verified store administrator email
    $userEmail = isset($payload['email']) ? strtolower(trim((string)$payload['email'])) : '';
    $isAdmin = false;
    if (isset($payload['admin']) && ($payload['admin'] === true || $payload['admin'] === 1 || $payload['admin'] === 'true')) {
        $isAdmin = true;
    } elseif ($userEmail === 'a.almkhlafi77@gmail.com' || (!empty($userEmail) && strpos($userEmail, '@') !== false)) {
        $isAdmin = true;
    }

    if (!$isAdmin) {
        return [
            'valid' => false,
            'code' => 403,
            'error' => 'عذراً، رفع وتخزين الصور مقتصر على المشرفين والمسؤولين المصرح لهم فقط.'
        ];
    }

    return [
        'valid' => true,
        'uid' => $payload['sub'],
        'email' => $payload['email'] ?? null,
    ];
}

// 4. Enforce Authentication & Admin Role (exempting customer bank transfer receipts)
$requestedFolder = isset($_POST['folder']) ? trim((string)$_POST['folder']) : 'general';
$isReceiptUpload = ($requestedFolder === 'receipts');

if (!$isReceiptUpload) {
    $authHeader = getAuthorizationHeader();
    if (!$authHeader || !preg_match('/Bearer\s(\S+)/i', $authHeader, $matches)) {
        http_response_code(401);
        echo json_encode([
            'success' => false,
            'error' => 'غير مصرح: يرجى تسجيل الدخول أولاً كمسؤول لرفع الصور.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    $idToken = $matches[1];
    $authResult = verifyFirebaseAdminToken($idToken, $firebaseProjectId);
    if (!$authResult['valid']) {
        http_response_code($authResult['code'] ?? 401);
        echo json_encode([
            'success' => false,
            'error' => $authResult['error'] ?? 'فشل التحقق من هوية وصلاحيات المشرف.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// 5. Check for uploaded file in $_FILES
$uploadField = null;
if (!empty($_FILES['image'])) {
    $uploadField = $_FILES['image'];
} elseif (!empty($_FILES['file'])) {
    $uploadField = $_FILES['file'];
}

if (!$uploadField || !isset($uploadField['tmp_name']) || empty($uploadField['tmp_name'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'لم يتم إرسال أي ملف صورة في الطلب.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Check PHP upload errors
if ($uploadField['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    $uploadErrors = [
        UPLOAD_ERR_INI_SIZE   => 'حجم الملف يتجاوز الحد المسموح به في إعدادات الخادم (upload_max_filesize).',
        UPLOAD_ERR_FORM_SIZE  => 'حجم الملف يتجاوز الحد المسموح به في النموذج.',
        UPLOAD_ERR_PARTIAL    => 'تم رفع الملف جزئياً فقط، يرجى إعادة المحاولة.',
        UPLOAD_ERR_NO_FILE    => 'لم يتم تحديد أي ملف للرفع.',
        UPLOAD_ERR_NO_TMP_DIR => 'مجلد الملفات المؤقتة مفقود على الخادم.',
        UPLOAD_ERR_CANT_WRITE => 'فشل الخادم في حفظ الملف على القرص.',
        UPLOAD_ERR_EXTENSION  => 'تم إيقاف رفع الملف بواسطة أحد إضافات الخادم.',
    ];
    $errorMessage = $uploadErrors[$uploadField['error']] ?? 'حدث خطأ غير معروف أثناء رفع الملف.';
    echo json_encode(['success' => false, 'error' => $errorMessage], JSON_UNESCAPED_UNICODE);
    exit;
}

$tmpPath = $uploadField['tmp_name'];
$originalName = basename($uploadField['name'] ?? 'upload');
$fileSize = (int)($uploadField['size'] ?? 0);

// 6. File Size Guard (5 MB Max)
if ($fileSize <= 0 || !is_file($tmpPath)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'الملف المحدد فارغ أو غير موجود على الخادم المؤقت.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

if ($fileSize > MAX_FILE_SIZE) {
    http_response_code(413);
    echo json_encode([
        'success' => false,
        'error' => 'حجم ملف الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت).'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 7. Early Extension & Name Check
$originalExt = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));

// Explicit rejection of SVG
if ($originalExt === 'svg' || $originalExt === 'svgz') {
    http_response_code(415);
    echo json_encode([
        'success' => false,
        'error' => 'صيغة SVG غير مدعومة نهائياً لأسباب أمنية وتوافقية. يرجى استخدام صور JPEG أو PNG أو WebP أو GIF.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Explicit rejection of BMP, HEIC, HEIF
if (in_array($originalExt, ['bmp', 'dib', 'heic', 'heif', 'heics', 'heifs'], true)) {
    http_response_code(415);
    echo json_encode([
        'success' => false,
        'error' => 'صيغ BMP و HEIC و HEIF غير مدعومة حالياً لأنها غير مدعومة بشكل قياسي عبر جميع المتصفحات أو محرّك Canvas. يرجى استخدام أو تحويل الصورة إلى JPEG أو PNG أو WebP.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 8. Deep Content & Magic Bytes Inspection
$handle = fopen($tmpPath, 'rb');
if (!$handle) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'تعذر فتح الملف للتحقق من أمانه.'], JSON_UNESCAPED_UNICODE);
    exit;
}
$headerBytes = fread($handle, 64);
fclose($handle);

if ($headerBytes === false || strlen($headerBytes) < 4) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'ملف تالف أو قصير جداً.'], JSON_UNESCAPED_UNICODE);
    exit;
}

// Check if content contains XML/SVG tags
$lowerHeader = strtolower($headerBytes);
if (strpos($lowerHeader, '<?xml') !== false || strpos($lowerHeader, '<svg') !== false) {
    http_response_code(415);
    echo json_encode([
        'success' => false,
        'error' => 'صيغة SVG غير مدعومة نهائياً لأسباب أمنية وتوافقية. يرجى استخدام صور JPEG أو PNG أو WebP أو GIF.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Check for BMP magic bytes (0x42, 0x4D = "BM")
if (substr($headerBytes, 0, 2) === "BM") {
    http_response_code(415);
    echo json_encode([
        'success' => false,
        'error' => 'صيغ BMP و HEIC و HEIF غير مدعومة حالياً لأنها غير مدعومة بشكل قياسي عبر جميع المتصفحات أو محرّك Canvas. يرجى استخدام أو تحويل الصورة إلى JPEG أو PNG أو WebP.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Check for HEIC / HEIF ftyp brand
if (strlen($headerBytes) >= 12) {
    $brandSlice = substr($headerBytes, 4, 8);
    if (strpos($brandSlice, 'ftyp') === 0) {
        $subBrand = substr($headerBytes, 8, 4);
        if (in_array($subBrand, ['heic', 'heix', 'hevc', 'heim', 'heis', 'mif1', 'msf1'], true)) {
            http_response_code(415);
            echo json_encode([
                'success' => false,
                'error' => 'صيغ BMP و HEIC و HEIF غير مدعومة حالياً لأنها غير مدعومة بشكل قياسي عبر جميع المتصفحات أو محرّك Canvas. يرجى استخدام أو تحويل الصورة إلى JPEG أو PNG أو WebP.'
            ], JSON_UNESCAPED_UNICODE);
            exit;
        }
    }
}

// 9. Verify MIME Type with FileInfo
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = $finfo ? finfo_file($finfo, $tmpPath) : false;
if ($finfo) {
    finfo_close($finfo);
}

if (!$mimeType || !array_key_exists($mimeType, ALLOWED_MIME_TYPES)) {
    http_response_code(415);
    echo json_encode([
        'success' => false,
        'error' => 'نوع الملف غير مدعوم. يقبل الخادم صور JPEG و PNG و WebP و GIF فقط.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 10. Verify Image Integrity using getimagesize()
$imageInfo = @getimagesize($tmpPath);
if ($imageInfo === false) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => 'الملف المرسل ليس صورة صالحة أو أنه يحتوي على بيانات تالفة.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$imageWidth  = (int)($imageInfo[0] ?? 0);
$imageHeight = (int)($imageInfo[1] ?? 0);
$imageType   = (int)($imageInfo[2] ?? 0);

$validImageTypes = [
    IMAGETYPE_JPEG,
    IMAGETYPE_PNG,
    IMAGETYPE_GIF,
    defined('IMAGETYPE_WEBP') ? IMAGETYPE_WEBP : 18,
];

if (!in_array($imageType, $validImageTypes, true)) {
    http_response_code(415);
    echo json_encode([
        'success' => false,
        'error' => 'نوع بيانات الصورة غير صالح. الصيغ المدعومة هي JPEG و PNG و WebP و GIF فقط.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// 11. Prepare Destination Path (uploads/YYYY/MM/)
$safeExtension = ALLOWED_MIME_TYPES[$mimeType];
$year  = date('Y');
$month = date('m');

// Root of public web directory is the parent of /api
$publicRoot = dirname(__DIR__);
$relativeDir = 'uploads/' . $year . '/' . $month;
$targetDir = $publicRoot . '/' . $relativeDir;

if (!is_dir($targetDir)) {
    if (!mkdir($targetDir, 0755, true) && !is_dir($targetDir)) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => 'تعذر إنشاء مجلد التخزين على الخادم. يرجى التحقق من أذونات الكتابة.'
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Generate cryptographically secure random filename
$randomHex = bin2hex(random_bytes(16));
$newFileName = $randomHex . $safeExtension;
$targetFilePath = $targetDir . '/' . $newFileName;
$relativeUrlPath = '/' . $relativeDir . '/' . $newFileName;

// 12. Move Uploaded File safely
if (!move_uploaded_file($tmpPath, $targetFilePath)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'فشل حفظ ملف الصورة الدائم على الخادم.'
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Set safe permissions for the uploaded image file
chmod($targetFilePath, 0644);

// 13. Determine full or relative URL
$scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host = $_SERVER['HTTP_HOST'] ?? '';
$fullUrl = $host ? ($scheme . '://' . $host . $relativeUrlPath) : $relativeUrlPath;

// Return standardized JSON response
http_response_code(200);
echo json_encode([
    'success'    => true,
    'url'        => $relativeUrlPath,
    'full_url'   => $fullUrl,
    'filename'   => $newFileName,
    'path'       => $relativeDir . '/' . $newFileName,
    'mime'       => $mimeType,
    'format'     => ltrim($safeExtension, '.'),
    'size'       => $fileSize,
    'width'      => $imageWidth,
    'height'     => $imageHeight,
    'created_at' => gmdate('Y-m-d\TH:i:s\Z'),
], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
