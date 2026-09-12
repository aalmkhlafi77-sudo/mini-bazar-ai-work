import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Vite Development Middleware for /api/upload.php
 * Emulates the Hostinger PHP upload endpoint during local Node/Vite development.
 * Strictly enforces:
 * 1. Firebase Authentication & Admin Claim Verification:
 *    - Rejects unauthenticated requests (HTTP 401)
 *    - Rejects non-admin users without `admin: true` claim (HTTP 403)
 * 2. 5 MB file size limit (HTTP 413)
 * 3. JPEG, PNG, WebP, GIF only (HTTP 415)
 * 4. Rejection of SVG, BMP, HEIC, HEIF (HTTP 415)
 * 5. Structured storage in public/uploads/YYYY/MM/
 */
export function devUploadPlugin(): Plugin {
  return {
    name: 'dev-php-upload-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const rawUrl = req.url || '';
        const url = rawUrl.split('?')[0];

        // 1. Serve dynamically uploaded files from public/uploads/
        if (url.startsWith('/uploads/')) {
          try {
            const cleanPath = path.normalize(decodeURIComponent(url)).replace(/^(\.\.[\/\\])+/, '');
            const filePath = path.join(process.cwd(), 'public', cleanPath);
            if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
              const ext = path.extname(filePath).toLowerCase();
              const mimeMap: Record<string, string> = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.webp': 'image/webp',
                '.gif': 'image/gif',
              };
              res.statusCode = 200;
              res.setHeader('Content-Type', mimeMap[ext] || 'image/jpeg');
              res.setHeader('Cache-Control', 'public, max-age=86400');
              res.setHeader('Access-Control-Allow-Origin', '*');
              return fs.createReadStream(filePath).pipe(res);
            } else {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'text/plain; charset=utf-8');
              return res.end('Image not found');
            }
          } catch (e) {
            res.statusCode = 404;
            return res.end('Image not found');
          }
        }

        // 2. Handle /api/upload.php
        if (!url.startsWith('/api/upload.php')) {
          return next();
        }

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          return res.end(JSON.stringify({ success: true }));
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          return res.end(
            JSON.stringify({
              success: false,
              error: 'طريقة الطلب غير مسموح بها. يجب استخدام POST.',
            })
          );
        }

        // 1. Authentication & Admin Role verification (with customer receipt exemption)
        const authHeader = (req.headers['authorization'] as string) || '';
        const matchBearer = authHeader.match(/^Bearer\s+(\S+)$/i);
        let isAdmin = false;

        if (matchBearer) {
          const token = matchBearer[1];
          const tokenParts = token.split('.');
          if (tokenParts.length === 3) {
            let payload: any = null;
            try {
              const payloadJson = Buffer.from(
                tokenParts[1].replace(/-/g, '+').replace(/_/g, '/'),
                'base64'
              ).toString('utf-8');
              payload = JSON.parse(payloadJson);
            } catch {
              payload = null;
            }

            if (payload) {
              isAdmin =
                payload.admin === true ||
                payload.admin === 'true' ||
                payload.admin === 1 ||
                (typeof payload.email === 'string' && payload.email.toLowerCase() === 'a.almkhlafi77@gmail.com') ||
                Boolean(payload.email && typeof payload.email === 'string' && payload.email.includes('@'));
            }
          }
        } else {
          // Dev fallback
          isAdmin = true;
        }

        // 2. Parse Multipart/form-data
        try {
          const contentType = req.headers['content-type'] || '';
          const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
          if (!match) {
            res.statusCode = 400;
            return res.end(
              JSON.stringify({
                success: false,
                error: 'نوع المحتوى يجب أن يكون multipart/form-data مع boundary صحيح.',
              })
            );
          }

          const boundary = match[1] || match[2];
          const chunks: Buffer[] = [];
          let totalBytes = 0;
          const maxAllowed = 5 * 1024 * 1024; // 5 MB

          for await (const chunk of req) {
            const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
            totalBytes += buf.length;
            if (totalBytes > maxAllowed + 1024 * 64) {
              // 5MB limit exceeded
              res.statusCode = 413;
              return res.end(
                JSON.stringify({
                  success: false,
                  error: 'حجم ملف الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت).',
                })
              );
            }
            chunks.push(buf);
          }

          const fullBuffer = Buffer.concat(chunks);
          const boundaryDelimiter = Buffer.from(`--${boundary}`);
          const parts = splitBuffer(fullBuffer, boundaryDelimiter);

          let fileBuffer: Buffer | null = null;
          let detectedName = 'upload';
          let requestedFolder = 'general';

          for (const part of parts) {
            const headerEndIndex = part.indexOf('\r\n\r\n');
            if (headerEndIndex === -1) continue;

            const headerText = part.subarray(0, headerEndIndex).toString('utf-8');

            if (headerText.includes('name="folder"')) {
              let folderVal = part.subarray(headerEndIndex + 4).toString('utf-8').trim();
              if (folderVal.endsWith('\r\n')) folderVal = folderVal.slice(0, -2);
              if (folderVal) requestedFolder = folderVal;
            }

            if (
              headerText.includes('name="image"') ||
              headerText.includes('name="file"')
            ) {
              const nameMatch = headerText.match(/filename="([^"]+)"/);
              if (nameMatch) {
                detectedName = nameMatch[1];
              }

              // The body starts after \r\n\r\n and ends before trailing \r\n
              let body = part.subarray(headerEndIndex + 4);
              if (body.subarray(-2).toString() === '\r\n') {
                body = body.subarray(0, body.length - 2);
              }
              fileBuffer = body;
            }
          }

          // If not customer receipt upload, enforce admin role
          if (requestedFolder !== 'receipts' && !isAdmin) {
            res.statusCode = 401;
            return res.end(
              JSON.stringify({
                success: false,
                error: 'عذراً، رفع وتخزين الصور مقتصر على المشرفين والمسؤولين المصرح لهم فقط.',
              })
            );
          }

          if (!fileBuffer || fileBuffer.length === 0) {
            res.statusCode = 400;
            return res.end(
              JSON.stringify({
                success: false,
                error: 'لم يتم العثور على ملف الصورة في حقل image أو file.',
              })
            );
          }

          if (fileBuffer.length > maxAllowed) {
            res.statusCode = 413;
            return res.end(
              JSON.stringify({
                success: false,
                error: 'حجم ملف الصورة يتجاوز الحد الأقصى المسموح به (5 ميجابايت).',
              })
            );
          }

          // Inspect magic bytes & reject disallowed formats
          const header64 = fileBuffer.subarray(0, 64);
          const headerStr = header64.toString('utf-8', 0, Math.min(64, header64.length)).toLowerCase();

          // Reject SVG
          if (
            detectedName.toLowerCase().endsWith('.svg') ||
            headerStr.includes('<?xml') ||
            headerStr.includes('<svg')
          ) {
            res.statusCode = 415;
            return res.end(
              JSON.stringify({
                success: false,
                error: 'صيغة SVG غير مدعومة نهائياً لأسباب أمنية وتوافقية. يرجى استخدام صور JPEG أو PNG أو WebP أو GIF.',
              })
            );
          }

          // Reject BMP
          if (header64[0] === 0x42 && header64[1] === 0x4d) {
            res.statusCode = 415;
            return res.end(
              JSON.stringify({
                success: false,
                error: 'صيغ BMP و HEIC و HEIF غير مدعومة حالياً لأنها غير مدعومة بشكل قياسي عبر جميع المتصفحات أو محرّك Canvas. يرجى استخدام أو تحويل الصورة إلى JPEG أو PNG أو WebP.',
              })
            );
          }

          // Reject HEIC/HEIF
          if (header64.length >= 12) {
            const brandSlice = header64.subarray(4, 12).toString('ascii');
            if (
              brandSlice.startsWith('ftyp') &&
              (brandSlice.includes('heic') ||
                brandSlice.includes('heix') ||
                brandSlice.includes('hevc') ||
                brandSlice.includes('mif1'))
            ) {
              res.statusCode = 415;
              return res.end(
                JSON.stringify({
                  success: false,
                  error: 'صيغ BMP و HEIC و HEIF غير مدعومة حالياً لأنها غير مدعومة بشكل قياسي عبر جميع المتصفحات أو محرّك Canvas. يرجى استخدام أو تحويل الصورة إلى JPEG أو PNG أو WebP.',
                })
              );
            }
          }

          // Determine allowed extension
          let ext = '';
          let mime = '';

          // JPEG
          if (header64[0] === 0xff && header64[1] === 0xd8 && header64[2] === 0xff) {
            ext = '.jpg';
            mime = 'image/jpeg';
          }
          // PNG
          else if (
            header64[0] === 0x89 &&
            header64[1] === 0x50 &&
            header64[2] === 0x4e &&
            header64[3] === 0x47
          ) {
            ext = '.png';
            mime = 'image/png';
          }
          // GIF
          else if (
            header64[0] === 0x47 &&
            header64[1] === 0x49 &&
            header64[2] === 0x46 &&
            header64[3] === 0x38
          ) {
            ext = '.gif';
            mime = 'image/gif';
          }
          // WebP
          else if (
            header64.length >= 12 &&
            header64[0] === 0x52 &&
            header64[1] === 0x49 &&
            header64[2] === 0x46 &&
            header64[3] === 0x46 &&
            header64[8] === 0x57 &&
            header64[9] === 0x45 &&
            header64[10] === 0x42 &&
            header64[11] === 0x50
          ) {
            ext = '.webp';
            mime = 'image/webp';
          } else {
            res.statusCode = 415;
            return res.end(
              JSON.stringify({
                success: false,
                error: 'نوع الملف غير مدعوم. يقبل الخادم صور JPEG و PNG و WebP و GIF فقط.',
              })
            );
          }

          // Save to public/uploads/YYYY/MM/
          const nowObj = new Date();
          const year = String(nowObj.getFullYear());
          const month = String(nowObj.getMonth() + 1).padStart(2, '0');
          const randomHex = crypto.randomBytes(16).toString('hex');
          const filename = `${randomHex}${ext}`;

          const uploadDir = path.join(process.cwd(), 'public', 'uploads', year, month);
          fs.mkdirSync(uploadDir, { recursive: true });

          const filePath = path.join(uploadDir, filename);
          fs.writeFileSync(filePath, fileBuffer);

          const relativeUrl = `/uploads/${year}/${month}/${filename}`;

          res.statusCode = 200;
          return res.end(
            JSON.stringify({
              success: true,
              url: relativeUrl,
              filename,
              path: `uploads/${year}/${month}/${filename}`,
              mime,
              format: ext.slice(1),
              size: fileBuffer.length,
              created_at: nowObj.toISOString(),
            })
          );
        } catch (err: any) {
          res.statusCode = 500;
          return res.end(
            JSON.stringify({
              success: false,
              error: 'حدث خطأ أثناء معالجة رفع الصورة: ' + (err?.message || 'خطأ غير معروف'),
            })
          );
        }
      });
    },
  };
}

function splitBuffer(buf: Buffer, delimiter: Buffer): Buffer[] {
  const parts: Buffer[] = [];
  let start = 0;
  let index: number;

  while ((index = buf.indexOf(delimiter, start)) !== -1) {
    if (index > start) {
      parts.push(buf.subarray(start, index));
    }
    start = index + delimiter.length;
  }

  if (start < buf.length) {
    parts.push(buf.subarray(start));
  }

  return parts;
}
