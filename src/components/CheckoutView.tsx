import React, { useState, useRef } from 'react';
import {
  ShieldCheck,
  Truck,
  CreditCard,
  MapPin,
  CheckCircle2,
  Copy,
  ArrowRight,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Camera,
  UploadCloud,
  X,
  Eye,
  FileCheck,
  Check,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { MiniBazaarLogo } from './MiniBazaarLogo';
import { imageUploadService } from '../services/imageUploadService';

export const CheckoutView: React.FC = () => {
  const {
    cart,
    cartSubtotal,
    deliveryMethods,
    paymentMethods,
    createOrder,
    setActiveView,
    storeSettings,
  } = useStore();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [city, setCity] = useState('الرياض');
  const [district, setDistrict] = useState('');
  const [street, setStreet] = useState('');
  const [building, setBuilding] = useState('');
  const [notes, setNotes] = useState('');

  const [selectedDeliveryId, setSelectedDeliveryId] = useState<string>(deliveryMethods[0]?.id || '');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>(paymentMethods[0]?.id || '');
  const [copiedIban, setCopiedIban] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Bank Transfer Receipt & Confirmation state
  const [bankReceiptImage, setBankReceiptImage] = useState<string | null>(null);
  const [bankReceiptFileName, setBankReceiptFileName] = useState<string>('');
  const [isBankTransferConfirmed, setIsBankTransferConfirmed] = useState<boolean>(false);
  const [isProcessingReceipt, setIsProcessingReceipt] = useState<boolean>(false);
  const [isReceiptPreviewOpen, setIsReceiptPreviewOpen] = useState<boolean>(false);
  const [isDraggingOver, setIsDraggingOver] = useState<boolean>(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  }, []);

  if (cart.length === 0) {
    return (
      <div className="py-20 px-4 text-center max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-[#6F584A] mb-3 font-heading">
          سلة التسوق فارغة
        </h2>
        <p className="text-xs text-[#7C736D] mb-6">
          يرجى إضافة منتجات إلى السلة قبل المتابعة لإتمام الطلب.
        </p>
        <button
          onClick={() => setActiveView('store')}
          className="px-6 py-3 rounded-[14px] bg-[#2F2B28] hover:bg-[#231F1D] text-white text-xs font-semibold shadow-xs"
        >
          العودة للتسوق
        </button>
      </div>
    );
  }

  const selectedDelivery = deliveryMethods.find((d) => d.id === selectedDeliveryId) || deliveryMethods[0];
  const selectedPayment = paymentMethods.find((p) => p.id === selectedPaymentId) || paymentMethods[0];

  // Free shipping check over 450 SAR
  const isFreeDelivery = cartSubtotal >= 450 && selectedDelivery.fee > 0;
  const deliveryFee = isFreeDelivery ? 0 : selectedDelivery.fee;
  const grandTotal = cartSubtotal + deliveryFee;

  const handleCopyIban = (iban: string) => {
    navigator.clipboard.writeText(iban);
    setCopiedIban(true);
    setTimeout(() => setCopiedIban(false), 2500);
  };

  const compressReceiptImage = (file: File): Promise<{ dataUrl: string; blob: Blob }> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const maxDim = 1200;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
              (blob) => {
                const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
                resolve({
                  dataUrl,
                  blob: blob || new Blob([dataUrl], { type: 'image/jpeg' }),
                });
              },
              'image/jpeg',
              0.82
            );
            return;
          }
          const rawData = (e.target?.result as string) || '';
          resolve({ dataUrl: rawData, blob: file });
        };
        img.onerror = () => {
          const rawData = (e.target?.result as string) || '';
          resolve({ dataUrl: rawData, blob: file });
        };
        img.src = (e.target?.result as string) || '';
      };
      reader.onerror = () => {
        resolve({ dataUrl: '', blob: file });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleProcessFile = async (file: File) => {
    if (!file) return;

    // Support mobile camera captures which may have generic or empty mime-types
    const isImage =
      !file.type ||
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|gif|bmp|heic|heif)$/i.test(file.name);

    if (!isImage) {
      setErrorMessage('يرجى اختيار ملف صورة صالح (JPG, PNG, WebP) لإشعار الحوالة');
      return;
    }

    try {
      setIsProcessingReceipt(true);
      setErrorMessage(null);

      // Step 1: Compress instantly on client for zero-lag mobile preview and reliable state retention
      const { dataUrl, blob } = await compressReceiptImage(file);
      if (dataUrl) {
        setBankReceiptImage(dataUrl);
        setBankReceiptFileName(file.name || 'bank_receipt.jpg');
        setIsBankTransferConfirmed(true);
      }

      // Step 2: Concurrently upload to server backend for permanent storage URL
      try {
        const uploadFile = new File([blob], file.name ? file.name.replace(/\.[^.]+$/, '.jpg') : 'receipt.jpg', {
          type: 'image/jpeg',
        });
        const res = await imageUploadService.upload(uploadFile, {
          folder: 'receipts',
          maxDimension: 1200,
          quality: 0.82,
        });

        if (res.success && res.url) {
          setBankReceiptImage(res.url);
        }
      } catch (uploadErr) {
        console.warn('Backend upload note for bank receipt (preserved compressed image):', uploadErr);
      }
    } catch (err: any) {
      console.error('Error processing receipt image:', err);
      // Fallback: direct FileReader
      try {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setBankReceiptImage(e.target.result as string);
            setBankReceiptFileName(file.name || 'bank_receipt.jpg');
            setIsBankTransferConfirmed(true);
          }
        };
        reader.readAsDataURL(file);
      } catch {
        setErrorMessage(err?.message || 'تعذر معالجة صورة الإشعار، يرجى المحاولة بصورة أخرى');
      }
    } finally {
      setIsProcessingReceipt(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleRemoveReceipt = () => {
    setBankReceiptImage(null);
    setBankReceiptFileName('');
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (!customerName.trim()) {
      setErrorMessage('يرجى كتابة الاسم الكريم للمستلم');
      return;
    }

    if (!customerPhone.trim() || customerPhone.length < 9) {
      setErrorMessage('يرجى إدخال رقم هاتف واتساب صحيح للتنسيق والتسليم');
      return;
    }

    if (!city.trim() || !district.trim() || !street.trim()) {
      setErrorMessage('يرجى استكمال تفاصيل العنوان (المدينة، الحي، والشارع)');
      return;
    }

    if (selectedPayment.type === 'bank_transfer' && !isBankTransferConfirmed && !bankReceiptImage) {
      setErrorMessage('يرجى تأكيد خيار "تم تحويل المبلغ" أو إرفاق إشعار الحوالة البنكية لإتمام الطلب.');
      return;
    }

    setIsSubmitting(true);

    try {
      await createOrder({
        customerName,
        customerPhone,
        customerEmail,
        address: {
          country: 'المملكة العربية السعودية',
          city,
          district,
          street,
          building,
        },
        deliveryMethodId: selectedDeliveryId,
        paymentMethodId: selectedPaymentId,
        customerNotes: notes,
        bankTransferReceipt: bankReceiptImage || undefined,
        bankTransferConfirmed: isBankTransferConfirmed || Boolean(bankReceiptImage),
      });
    } catch (err: any) {
      setErrorMessage('حدث خطأ أثناء معالجة الطلب، يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="py-10 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Top Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs text-[#8A7465] mb-6">
        <button onClick={() => setActiveView('store')} className="hover:text-[#6F584A]">
          المتجر
        </button>
        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
        <span className="font-bold text-[#6F584A]">إتمام الطلب المعتمد</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left/Form Column (7 cols) */}
        <form onSubmit={handleSubmitOrder} className="lg:col-span-7 space-y-6 text-right">
          {errorMessage && (
            <div className="bg-[#B4574A]/10 border border-[#B4574A]/30 text-[#B4574A] p-4 rounded-[16px] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 1. Customer Personal Information */}
          <div className="bg-white p-6 rounded-[24px] border border-[#E5D8C9] shadow-2xs">
            <h3 className="text-base font-bold text-[#6F584A] font-heading mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#F4ECE2] text-[#C6A36A] flex items-center justify-center text-xs">
                1
              </span>
              <span>بيانات المستلم والتواصل</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5F5751] mb-1.5">
                  الاسم الكامل <span className="text-[#B4574A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="مثال: نورة عبد الله"
                  className="w-full bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px] px-3.5 py-2.5 text-xs text-[#2F2B28] focus:outline-none focus:border-[#C6A36A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5F5751] mb-1.5">
                  رقم الواتساب / الجوال <span className="text-[#B4574A]">*</span>
                </label>
                <input
                  type="tel"
                  required
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="05XXXXXXXX"
                  className="w-full bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px] px-3.5 py-2.5 text-xs text-[#2F2B28] focus:outline-none focus:border-[#C6A36A]"
                  dir="ltr"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#5F5751] mb-1.5">
                  البريد الإلكتروني (اختياري لتأكيد الفاتورة)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px] px-3.5 py-2.5 text-xs text-[#2F2B28] focus:outline-none focus:border-[#C6A36A]"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* 2. Delivery Address */}
          <div className="bg-white p-6 rounded-[24px] border border-[#E5D8C9] shadow-2xs">
            <h3 className="text-base font-bold text-[#6F584A] font-heading mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#F4ECE2] text-[#C6A36A] flex items-center justify-center text-xs">
                2
              </span>
              <span>عنوان التوصيل</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#5F5751] mb-1.5">
                  المدينة <span className="text-[#B4574A]">*</span>
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px] px-3.5 py-2.5 text-xs text-[#2F2B28] focus:outline-none focus:border-[#C6A36A]"
                >
                  <option value="الرياض">الرياض</option>
                  <option value="جدة">جدة</option>
                  <option value="الدمام">الدمام</option>
                  <option value="مكة المكرمة">مكة المكرمة</option>
                  <option value="المدينة المنورة">المدينة المنورة</option>
                  <option value="الخبر">الخبر</option>
                  <option value="أبها">أبها</option>
                  <option value="تبوك">تبوك</option>
                  <option value="القصيم">القصيم</option>
                  <option value="مدينة أخرى">مدينة أخرى بالمملكة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5F5751] mb-1.5">
                  الحي <span className="text-[#B4574A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="مثال: حي النرجس / حي الروضة"
                  className="w-full bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px] px-3.5 py-2.5 text-xs text-[#2F2B28] focus:outline-none focus:border-[#C6A36A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5F5751] mb-1.5">
                  اسم الشارع <span className="text-[#B4574A]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  placeholder="مثال: طريق الملك فهد"
                  className="w-full bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px] px-3.5 py-2.5 text-xs text-[#2F2B28] focus:outline-none focus:border-[#C6A36A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5F5751] mb-1.5">
                  رقم المبنى / الفيلا
                </label>
                <input
                  type="text"
                  value={building}
                  onChange={(e) => setBuilding(e.target.value)}
                  placeholder="مثال: فيلا 22"
                  className="w-full bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px] px-3.5 py-2.5 text-xs text-[#2F2B28] focus:outline-none focus:border-[#C6A36A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-[#5F5751] mb-1.5">
                  ملاحظات الإهداء أو التوصيل
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="مثال: أرجو تغليف الحقيبة في علبة هدايا وكتابة إهداء خاص..."
                  className="w-full bg-[#FBF8F3] border border-[#D9C1A7] rounded-[10px] px-3.5 py-2 text-xs text-[#2F2B28] focus:outline-none focus:border-[#C6A36A]"
                />
              </div>
            </div>
          </div>

          {/* 3. Delivery Method Selection */}
          <div className="bg-white p-6 rounded-[24px] border border-[#E5D8C9] shadow-2xs">
            <h3 className="text-base font-bold text-[#6F584A] font-heading mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#F4ECE2] text-[#C6A36A] flex items-center justify-center text-xs">
                3
              </span>
              <span>خيار التوصيل والشحن</span>
            </h3>

            <div className="space-y-3">
              {deliveryMethods.map((method) => {
                const isSelected = selectedDeliveryId === method.id;
                const methodFee = isFreeDelivery && method.fee > 0 ? 0 : method.fee;

                return (
                  <label
                    key={method.id}
                    className={`flex items-start justify-between p-4 rounded-[16px] border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#F4ECE2] border-[#C6A36A] ring-1 ring-[#C6A36A]'
                        : 'bg-[#FBF8F3] border-[#E7D4BC] hover:border-[#8A7465]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="radio"
                        name="deliveryMethod"
                        value={method.id}
                        checked={isSelected}
                        onChange={() => setSelectedDeliveryId(method.id)}
                        className="mt-1 accent-[#6F584A]"
                      />
                      <div>
                        <span className="text-xs sm:text-sm font-bold text-[#2F2B28] block">
                          {method.name_ar}
                        </span>
                        <span className="text-[11px] text-[#7C736D] mt-0.5 block">
                          {method.description}
                        </span>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      {isFreeDelivery && method.fee > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="text-xs font-bold text-[#607866]">مجاناً</span>
                          <span className="text-[10px] text-[#7C736D] line-through">{method.fee} ر.س</span>
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm font-bold text-[#6F584A]">
                          {methodFee === 0 ? 'مجاناً' : `${methodFee} ر.س`}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* 4. Payment Method Selection */}
          <div className="bg-white p-6 rounded-[24px] border border-[#E5D8C9] shadow-2xs">
            <h3 className="text-base font-bold text-[#6F584A] font-heading mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#F4ECE2] text-[#C6A36A] flex items-center justify-center text-xs">
                4
              </span>
              <span>طريقة الدفع المعتمدة</span>
            </h3>

            <div className="space-y-3">
              {paymentMethods.map((method) => {
                const isSelected = selectedPaymentId === method.id;

                return (
                  <div
                    key={method.id}
                    className={`rounded-[16px] border transition-all overflow-hidden ${
                      isSelected
                        ? 'bg-[#F4ECE2]/80 border-[#C6A36A]'
                        : 'bg-[#FBF8F3] border-[#E7D4BC]'
                    }`}
                  >
                    <label className="flex items-center gap-3 p-4 cursor-pointer">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method.id}
                        checked={isSelected}
                        onChange={() => setSelectedPaymentId(method.id)}
                        className="accent-[#6F584A]"
                      />
                      <div className="flex-1">
                        <span className="text-xs sm:text-sm font-bold text-[#2F2B28]">
                          {method.name_ar}
                        </span>
                        <p className="text-[11px] text-[#7C736D] mt-0.5">
                          {method.instructions}
                        </p>
                      </div>
                    </label>

                    {/* Bank Details & Receipt Upload if selected */}
                    {isSelected && method.type === 'bank_transfer' && (
                      <div className="mx-4 mb-4 space-y-3">
                        {/* 1. Bank Account Details Card */}
                        {method.bank_details && (
                          <div className="p-4 rounded-[16px] bg-white border border-[#D9C1A7] text-xs space-y-2.5 shadow-2xs">
                            <div className="flex justify-between items-center text-[#5F5751]">
                              <span>البنك المعتمد:</span>
                              <span className="font-bold text-[#2F2B28]">{method.bank_details.bank_name}</span>
                            </div>
                            <div className="flex justify-between items-center text-[#5F5751]">
                              <span>اسم الحساب:</span>
                              <span className="font-bold text-[#2F2B28]">{method.bank_details.account_name}</span>
                            </div>
                            <div className="flex justify-between items-center text-[#5F5751] pt-1.5 border-t border-[#F4ECE2]">
                              <span>المبلغ المطلوب تحويله:</span>
                              <span className="font-bold text-[#6F584A] text-sm" dir="ltr">
                                {grandTotal} ر.س
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-[#5F5751] pt-1.5 border-t border-[#F4ECE2]">
                              <span>رقم الآيبان (IBAN):</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-[#6F584A] text-xs sm:text-sm tracking-wider" dir="ltr">
                                  {method.bank_details.iban}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyIban(method.bank_details!.iban)}
                                  className="p-1.5 rounded-lg bg-[#F4ECE2] text-[#8A7465] hover:text-[#6F584A] transition-colors"
                                  title="نسخ الآيبان"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            {copiedIban && (
                              <div className="flex items-center justify-center gap-1 text-[11px] text-[#25D366] font-bold pt-1">
                                <Check className="w-3.5 h-3.5" />
                                <span>تم نسخ رقم الآيبان إلى الحافظة بنجاح</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Receipt Upload & Mobile Camera Card */}
                        <div className="p-4 rounded-[16px] bg-white border border-[#D9C1A7] text-xs space-y-3 shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#2F2B28] flex items-center gap-1.5 text-xs sm:text-sm">
                              <Camera className="w-4 h-4 text-[#C6A36A]" />
                              <span>إرفاق إشعار / إيصال الحوالة البنكية</span>
                            </span>
                            {bankReceiptImage && (
                              <span className="text-[11px] font-bold text-[#25D366] bg-[#25D366]/10 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                <FileCheck className="w-3 h-3" />
                                <span>مرفق جاهز</span>
                              </span>
                            )}
                          </div>

                          <p className="text-[11px] text-[#7C736D] leading-relaxed">
                            ارفع صورة إشعار الحوالة من جهازك أو التقطها فوراً بكاميرا الجوال لتسريع المطابقة واعتماد الطلب.
                          </p>

                          {/* Hidden File and Camera Inputs */}
                          <input
                            ref={cameraInputRef}
                            type="file"
                            accept="image/*"
                            capture="environment"
                            className="hidden"
                            onChange={handleFileChange}
                          />
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileChange}
                          />

                          {/* Dual Action Buttons */}
                          <div className="grid grid-cols-2 gap-2.5 pt-1">
                            <button
                              type="button"
                              onClick={() => cameraInputRef.current?.click()}
                              disabled={isProcessingReceipt}
                              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-[12px] bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#2F2B28] font-bold text-xs transition-all active:scale-98 border border-[#D9C1A7]"
                            >
                              <Camera className="w-4 h-4 text-[#C6A36A]" />
                              <span>التقاط بالكاميرا</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={isProcessingReceipt}
                              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-[12px] bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#2F2B28] font-bold text-xs transition-all active:scale-98 border border-[#D9C1A7]"
                            >
                              <UploadCloud className="w-4 h-4 text-[#C6A36A]" />
                              <span>اختيار من الجهاز</span>
                            </button>
                          </div>

                          {/* Drag & Drop Box or Uploaded Preview */}
                          {!bankReceiptImage ? (
                            <div
                              onDrop={handleDrop}
                              onDragOver={handleDragOver}
                              onDragLeave={handleDragLeave}
                              onClick={() => fileInputRef.current?.click()}
                              className={`border-2 border-dashed rounded-[14px] p-4 text-center cursor-pointer transition-all ${
                                isDraggingOver
                                  ? 'border-[#C6A36A] bg-[#F4ECE2]/60'
                                  : 'border-[#E5D8C9] hover:border-[#C6A36A] bg-[#FBF8F3]'
                              }`}
                            >
                              {isProcessingReceipt ? (
                                <div className="py-2 text-[#C6A36A] font-bold flex items-center justify-center gap-2">
                                  <div className="w-4 h-4 border-2 border-[#C6A36A] border-t-transparent rounded-full animate-spin" />
                                  <span>جاري معالجة وضغط صورة الإشعار...</span>
                                </div>
                              ) : (
                                <div className="space-y-1">
                                  <UploadCloud className="w-6 h-6 text-[#8A7465] mx-auto opacity-70" />
                                  <p className="text-[11px] text-[#5F5751] font-semibold">
                                    اسحب صورة الإيصال وأفلتها هنا، أو اضغط للاختيار
                                  </p>
                                  <p className="text-[10px] text-[#8A7465]">
                                    صيغ مدعومة: JPG, PNG, WebP (يتم الضغط تلقائياً)
                                  </p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="p-3 rounded-[14px] bg-[#FAF6F0] border border-[#C6A36A]/60 flex items-center justify-between gap-3 animate-in fade-in">
                              <div className="flex items-center gap-3 min-w-0">
                                <div
                                  onClick={() => setIsReceiptPreviewOpen(true)}
                                  className="w-14 h-14 rounded-[10px] overflow-hidden bg-black/5 shrink-0 border border-[#D9C1A7] cursor-pointer relative group"
                                  title="انقر لتكبير ومعاينة الصورة"
                                >
                                  <img
                                    src={bankReceiptImage}
                                    alt="إشعار الحوالة البنكية"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Eye className="w-4 h-4 text-white" />
                                  </div>
                                </div>

                                <div className="min-w-0 text-right">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#2F2B28]">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366]" />
                                    <span className="truncate">{bankReceiptFileName || 'صورة إشعار الحوالة'}</span>
                                  </div>
                                  <span className="text-[10px] text-[#25D366] font-semibold block mt-0.5">
                                    تم حفظ الإيصال وسيتم إرفاقه مع الطلب
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => setIsReceiptPreviewOpen(true)}
                                  className="p-2 rounded-lg bg-[#F4ECE2] text-[#2F2B28] hover:bg-[#E7D4BC] transition-colors"
                                  title="معاينة بالحجم الكامل"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={handleRemoveReceipt}
                                  className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                                  title="حذف أو استبدال"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 3. Customer Transfer Confirmation Checkbox */}
                          <div className="pt-2 border-t border-[#F4ECE2]">
                            <label className="flex items-start gap-3 p-3 rounded-[12px] bg-[#FAF6F0] border border-[#D9C1A7] cursor-pointer hover:bg-[#F4ECE2]/50 transition-colors">
                              <input
                                type="checkbox"
                                checked={isBankTransferConfirmed}
                                onChange={(e) => setIsBankTransferConfirmed(e.target.checked)}
                                className="mt-1 w-4 h-4 accent-[#6F584A] rounded cursor-pointer"
                              />
                              <div className="text-right">
                                <span className="font-bold text-[#2F2B28] block text-xs">
                                  تم تحويل المبلغ ({grandTotal} ر.س) لحساب المتجر الرسمي
                                </span>
                                <span className="text-[11px] text-[#7C736D] block mt-0.5">
                                  أؤكد إتمام التحويل البنكي للمطابقة مع البنك تمهيداً لتجهيز وشحن الطلب فوراً.
                                </span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-[14px] bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8] font-bold text-sm shadow-md transition-all active:scale-98 disabled:opacity-50 border border-[#4A3E37]"
          >
            {isSubmitting ? (
              <span>جاري تسجيل وتثبيت الطلب...</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 text-[#C6A36A]" />
                <span>تأكيد الطلب الآن ({grandTotal} ر.س)</span>
              </>
            )}
          </button>
        </form>

        {/* Right/Order Summary Column (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-[24px] border border-[#E5D8C9] shadow-2xs text-right sticky top-28">
          <h3 className="text-base font-bold text-[#6F584A] font-heading mb-4 pb-3 border-b border-[#F4ECE2]">
            ملخص مقتنيات الطلب ({Array.isArray(cart) ? cart.reduce((a, b) => a + (b?.quantity || 1), 0) : 0})
          </h3>

          {/* Items Preview */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1 mb-4">
            {cart.map((item, idx) => {
              if (!item || !item.product) return null;
              const itemPrice =
                typeof item.variant?.price === 'number'
                  ? item.variant.price
                  : typeof item.product.price === 'number'
                  ? item.product.price
                  : 0;
              const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
              const imgSrc =
                (item.variant?.image_path && item.variant.image_path.trim() !== ''
                  ? item.variant.image_path
                  : null) ||
                (Array.isArray(item.product.images) &&
                item.product.images[0]?.path &&
                item.product.images[0].path.trim() !== ''
                  ? item.product.images[0].path
                  : null) ||
                'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80';
              const displayName = item.product.name_ar || item.product.name_en || 'منتج ميني بازار';

              return (
                <div
                  key={`${item.product.id || idx}-${item.variant?.id || 'd'}-${idx}`}
                  className="flex items-center gap-3 py-2 border-b border-[#F4ECE2] last:border-none"
                >
                  <img
                    src={imgSrc}
                    alt={displayName}
                    className="w-14 h-14 rounded-[10px] object-cover bg-[#F7F1E8] border border-[#E7D4BC] shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <div className="flex-1">
                    <h4 className="text-xs font-bold text-[#2F2B28] font-heading line-clamp-1">
                      {displayName}
                    </h4>
                    {item.variant && (
                      <span className="text-[10px] text-[#8A7465] block">{item.variant.name_ar || item.variant.name_en}</span>
                    )}
                    <span className="text-xs text-[#7C736D]">الكمية: {quantity}</span>
                  </div>
                  <span className="text-xs font-bold text-[#6F584A]" dir="ltr">
                    {itemPrice * quantity} ر.س
                  </span>
                </div>
              );
            })}
          </div>

          {/* Pricing Calculations */}
          <div className="space-y-2 pt-2 border-t border-[#F4ECE2] text-xs">
            <div className="flex justify-between text-[#7C736D]">
              <span>المجموع الفرعي للمنتجات:</span>
              <span className="font-bold text-[#2F2B28]" dir="ltr">
                {cartSubtotal} ر.س
              </span>
            </div>

            <div className="flex justify-between text-[#7C736D]">
              <span>رسوم التوصيل:</span>
              <span className="font-bold text-[#2F2B28]">
                {deliveryFee === 0 ? (
                  <span className="text-[#607866] font-bold">مجاناً (عرض البوتيك)</span>
                ) : (
                  <span dir="ltr">{deliveryFee} ر.س</span>
                )}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-3 border-t border-[#E5D8C9] text-base font-bold text-[#6F584A]">
              <span>المبلغ الإجمالي المعتمد:</span>
              <span className="text-xl text-[#6F584A]" dir="ltr">
                {grandTotal} <span className="text-xs text-[#8A7465]">ر.س</span>
              </span>
            </div>
          </div>

          {/* Reassurance Guarantee */}
          <div className="mt-6 p-4 rounded-[16px] bg-[#FBF8F3] border border-[#E7D4BC] space-y-2 text-[11px] text-[#5F5751]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C6A36A] shrink-0" />
              <span>فحص وتثبيت فوري للأسعار والتوفر على الخادم المركزي.</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C6A36A] shrink-0" />
              <span>تواصل ومتابعة مستمرة عبر واتساب حتى استلام شحنتكِ.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Receipt Image Full Preview Lightbox Modal */}
      {isReceiptPreviewOpen && bankReceiptImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setIsReceiptPreviewOpen(false)}
        >
          <div
            className="bg-white rounded-[24px] max-w-xl w-full p-5 text-right overflow-hidden shadow-2xl border border-[#D9C1A7]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#E5D8C9] mb-4">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-[#C6A36A]" />
                <h4 className="font-bold text-[#2F2B28] text-sm">
                  معاينة إشعار الحوالة البنكية المرفق
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setIsReceiptPreviewOpen(false)}
                className="p-1 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-auto rounded-[14px] bg-[#FBF8F3] p-2 flex items-center justify-center border border-[#E5D8C9]">
              <img
                src={bankReceiptImage}
                alt="إشعار الحوالة"
                className="max-w-full max-h-[65vh] object-contain rounded-[10px]"
              />
            </div>

            <div className="mt-4 flex items-center justify-between pt-2 border-t border-[#E5D8C9]">
              <span className="text-xs text-[#7C736D]">
                المبلغ المطلوب للطلب: <strong className="text-[#2F2B28]">{grandTotal} ر.س</strong>
              </span>
              <button
                type="button"
                onClick={() => setIsReceiptPreviewOpen(false)}
                className="px-4 py-2 bg-[#2F2B28] text-white rounded-[12px] text-xs font-bold hover:bg-[#231F1D]"
              >
                إغلاق المعاينة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
