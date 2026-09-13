import React, { useState, useEffect } from 'react';
import {
  Search,
  Package,
  Clock,
  MapPin,
  CreditCard,
  Truck,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  FileText,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Order, OrderStatus } from '../types';
import { OrderProgressTimeline } from './OrderProgressTimeline';
import { MiniBazaarLogo } from './MiniBazaarLogo';
import { safeStorage } from '../utils/safeStorage';

interface OrderTrackingViewProps {
  initialOrderNumber?: string;
  initialPhone?: string;
}

export const OrderTrackingView: React.FC<OrderTrackingViewProps> = ({
  initialOrderNumber = '',
  initialPhone = '',
}) => {
  const { orders, currentOrder, setActiveView, storeSettings } = useStore();

  const [orderNumberInput, setOrderNumberInput] = useState(initialOrderNumber);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Normalize digits (e.g., Arabic-Indic ٠١٢٣ to 0123) and strip whitespace/special characters
  const normalizeDigits = (str: string): string => {
    return str
      .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
      .replace(/[\s\-_+()]/g, '')
      .toLowerCase();
  };

  // Extract last 9 digits of a phone number to compare reliably across formatting (+966, 05, etc.)
  const extractPhoneSuffix = (rawPhone: string): string => {
    const clean = normalizeDigits(rawPhone);
    return clean.slice(-9);
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage(null);
    setHasSearched(true);

    const cleanOrderNum = orderNumberInput.trim().toUpperCase();
    const cleanPhone = phoneInput.trim();

    if (!cleanOrderNum) {
      setErrorMessage('يرجى إدخال رقم الطلب (مثال: MB-2026-9401)');
      return;
    }

    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMessage('يرجى إدخال رقم الجوال المسجل في الطلب للتحقق');
      return;
    }

    const searchPhoneSuffix = extractPhoneSuffix(cleanPhone);

    // 1. Check local orders in StoreContext
    let found = orders.find((ord) => {
      const matchNum = ord.order_number?.trim().toUpperCase() === cleanOrderNum || ord.id === cleanOrderNum;
      const matchPhone = extractPhoneSuffix(ord.customer_phone_snapshot || '') === searchPhoneSuffix;
      return matchNum && matchPhone;
    });

    // 2. Check currentOrder if not found in orders array
    if (!found && currentOrder) {
      const matchNum = currentOrder.order_number?.trim().toUpperCase() === cleanOrderNum || currentOrder.id === cleanOrderNum;
      const matchPhone = extractPhoneSuffix(currentOrder.customer_phone_snapshot || '') === searchPhoneSuffix;
      if (matchNum && matchPhone) {
        found = currentOrder;
      }
    }

    // 3. Check persistent safeStorage ('mb_orders' or 'mb_customer_orders')
    if (!found) {
      try {
        const storedStr = safeStorage.getItem('mb_orders');
        if (storedStr) {
          const storedList: Order[] = JSON.parse(storedStr);
          if (Array.isArray(storedList)) {
            found = storedList.find((ord) => {
              const matchNum = ord.order_number?.trim().toUpperCase() === cleanOrderNum || ord.id === cleanOrderNum;
              const matchPhone = extractPhoneSuffix(ord.customer_phone_snapshot || '') === searchPhoneSuffix;
              return matchNum && matchPhone;
            });
          }
        }
      } catch (err) {
        console.warn('Tracking safeStorage parse note:', err);
      }
    }

    if (found) {
      setSearchedOrder(found);
      setErrorMessage(null);
    } else {
      setSearchedOrder(null);
      setErrorMessage(
        'لم يتم العثور على أي طلب يطابق رقم الطلب ورقم الجوال المدخلين. يرجى مراجعة البيانات والتأكد من مطابقتها لما تم إدخاله عند الشراء.'
      );
    }
  };

  // Quick lookup button for recently placed order
  const handleQuickLoadRecent = (ord: Order) => {
    setOrderNumberInput(ord.order_number);
    setPhoneInput(ord.customer_phone_snapshot);
    setSearchedOrder(ord);
    setHasSearched(true);
    setErrorMessage(null);
  };

  // WhatsApp support action
  const handleContactSupport = () => {
    const phone = storeSettings.whatsapp_number.replace(/\D/g, '');
    const text = searchedOrder
      ? encodeURIComponent(
          `مرحباً ميني بازار،\nأستفسر عن طلبي رقم: ${searchedOrder.order_number}\nالمسجل باسم: ${searchedOrder.customer_name_snapshot}`
        )
      : encodeURIComponent('مرحباً ميني بازار، أود الاستفسار عن حالة طلبي');
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div className="py-10 px-4 sm:px-8 max-w-5xl mx-auto text-right">
      {/* Top Header / Breadcrumb */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
        <div>
          <button
            onClick={() => setActiveView('store')}
            className="inline-flex items-center gap-1.5 text-xs text-[#8A7465] hover:text-[#2F2B28] transition-colors mb-2"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            <span>العودة للمتجر</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#6F584A] font-heading flex items-center gap-2.5">
            <Package className="w-7 h-7 text-[#C6A36A]" />
            <span>استعراض ومتابعة حالة الطلب</span>
          </h1>
          <p className="text-xs text-[#7C736D] mt-1">
            أدخل رقم طلبك ورقم الجوال المسجل لمتابعة مرحلة التجهيز وملاحظات المشرف المعتمدة.
          </p>
        </div>

        {/* Support contact button */}
        <button
          onClick={handleContactSupport}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-[12px] bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#128C7E] text-xs font-semibold border border-[#25D366]/30 transition-colors"
        >
          <MessageCircle className="w-4 h-4 text-[#25D366]" />
          <span>مساعدة فورية عبر واتساب</span>
        </button>
      </div>

      {/* Lookup Card Form */}
      <div className="bg-white rounded-[24px] border border-[#E5D8C9] p-6 sm:p-8 shadow-xs mb-8">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#5F5751] mb-1.5">
                رقم الطلب <span className="text-[#B4574A]">*</span>
              </label>
              <input
                type="text"
                value={orderNumberInput}
                onChange={(e) => setOrderNumberInput(e.target.value)}
                placeholder="مثال: MB-2026-9401"
                className="w-full bg-[#FBF8F3] border border-[#D9C1A7] rounded-[12px] px-3.5 py-2.5 text-xs text-[#2F2B28] focus:outline-none focus:border-[#C6A36A]"
                dir="ltr"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#5F5751] mb-1.5">
                رقم الجوال المسجل <span className="text-[#B4574A]">*</span>
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="مثال: 05XXXXXXXX"
                className="w-full bg-[#FBF8F3] border border-[#D9C1A7] rounded-[12px] px-3.5 py-2.5 text-xs text-[#2F2B28] focus:outline-none focus:border-[#C6A36A]"
                dir="ltr"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-[14px] bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8] text-xs font-semibold shadow-xs transition-all active:scale-95"
            >
              <Search className="w-4 h-4 text-[#C6A36A]" />
              <span>استعراض بيانات الطلب</span>
            </button>

            {/* Quick autofill for recent active order if available */}
            {currentOrder && (
              <button
                type="button"
                onClick={() => handleQuickLoadRecent(currentOrder)}
                className="text-xs text-[#6F584A] hover:text-[#2F2B28] flex items-center gap-1.5 underline decoration-[#C6A36A] underline-offset-4"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C6A36A]" />
                <span>استعراض آخر طلب تم إتمامه ({currentOrder.order_number})</span>
              </button>
            )}
          </div>
        </form>

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-4 p-4 rounded-[16px] bg-[#B4574A]/10 border border-[#B4574A]/30 text-[#B4574A] text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}
      </div>

      {/* Order Details Display (STRICTLY READ-ONLY) */}
      {searchedOrder && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Header Summary Banner */}
          <div className="bg-gradient-to-l from-[#2F2B28] to-[#1A1715] text-[#F5E9D8] p-6 sm:p-8 rounded-[24px] shadow-sm flex flex-wrap items-center justify-between gap-4 border border-[#4A3E37]">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] font-semibold text-[#C6A36A] uppercase tracking-wider">
                  طلب معتمد في ميني بازار
                </span>
                <span className="text-white/40">•</span>
                <span className="text-[11px] text-white/70">
                  {new Date(searchedOrder.placed_at || searchedOrder.created_at || Date.now()).toLocaleDateString('ar-SA', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold font-mono text-white" dir="ltr">
                {searchedOrder.order_number}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-white/80">عرض مخصص للعميل</span>
              <div className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-[#C6A36A]">
                قراءة فقط (محمي)
              </div>
            </div>
          </div>

          {/* Progress Timeline Section */}
          <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-[#E5D8C9] shadow-2xs">
            <h3 className="text-sm font-bold text-[#6F584A] font-heading mb-6 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C6A36A]" />
              <span>مراحل مسار وتجهيز الشحنة</span>
            </h3>
            <OrderProgressTimeline status={searchedOrder.status} logs={searchedOrder.logs} />
          </div>

          {/* Admin / Supervisor Notes Box (Crucial user request requirement) */}
          <div className="bg-[#FBF8F3] p-6 sm:p-8 rounded-[24px] border border-[#D9C1A7] shadow-2xs">
            <h3 className="text-sm font-bold text-[#6F584A] font-heading mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#C6A36A]" />
              <span>ملاحظات المشرف وفريق المتابعة</span>
            </h3>

            {searchedOrder.admin_notes ? (
              <div className="p-4 rounded-[16px] bg-white border border-[#C6A36A]/40 text-[#2F2B28] text-xs leading-relaxed">
                <div className="font-bold text-[#6F584A] mb-1">تحديث صادر من المشرف المسؤول:</div>
                <p className="whitespace-pre-line">{searchedOrder.admin_notes}</p>
              </div>
            ) : (
              <div className="p-4 rounded-[16px] bg-white border border-[#E5D8C9] text-xs text-[#7C736D] leading-relaxed flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#8A7465] shrink-0" />
                <span>
                  طلبك مسجل في النظام ويخضع للإشراف الدوري. لم تُسجل أي ملاحظات خاصة حتى الآن، وسيتم تحديث هذه الخانة فور صدور أي توجيه أو رقم تتبع من المشرف.
                </span>
              </div>
            )}

            {/* Recent status logs history notes if available */}
            {searchedOrder.logs && searchedOrder.logs.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#E5D8C9]/80 space-y-2">
                <span className="text-[11px] font-bold text-[#8A7465] block">سجل الإجراءات والتحديثات:</span>
                <div className="space-y-1.5">
                  {searchedOrder.logs.map((log) => (
                    <div key={log.id} className="text-[11px] text-[#5F5751] flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C6A36A] shrink-0 mt-1.5" />
                      <div>
                        <span className="font-semibold text-[#2F2B28]">{log.note}</span>
                        <span className="text-[10px] text-[#8A7465] mr-2">
                          ({new Date(log.created_at).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Delivery & Customer Snapshot Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer & Address Details */}
            <div className="bg-white p-6 rounded-[24px] border border-[#E5D8C9] shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#6F584A] font-heading flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#C6A36A]" />
                <span>بيانات المستلم وموقع التوصيل</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F4ECE2]">
                  <span className="text-[#7C736D]">الاسم:</span>
                  <span className="font-semibold text-[#2F2B28]">{searchedOrder.customer_name_snapshot}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F4ECE2]">
                  <span className="text-[#7C736D]">الهاتف:</span>
                  <span className="font-semibold text-[#2F2B28]" dir="ltr">{searchedOrder.customer_phone_snapshot}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F4ECE2]">
                  <span className="text-[#7C736D]">المدينة:</span>
                  <span className="font-semibold text-[#2F2B28]">{searchedOrder.address_snapshot?.city || '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F4ECE2]">
                  <span className="text-[#7C736D]">الحي والشارع:</span>
                  <span className="font-semibold text-[#2F2B28]">
                    {searchedOrder.address_snapshot?.district} — {searchedOrder.address_snapshot?.street}
                  </span>
                </div>
                {searchedOrder.address_snapshot?.building && (
                  <div className="flex justify-between py-1 border-b border-[#F4ECE2]">
                    <span className="text-[#7C736D]">المبنى:</span>
                    <span className="font-semibold text-[#2F2B28]">{searchedOrder.address_snapshot.building}</span>
                  </div>
                )}
              </div>

              {/* Map Location Link if available */}
              {(searchedOrder.address_snapshot?.latitude || searchedOrder.address_snapshot?.map_url) && (
                <div className="pt-2">
                  <a
                    href={
                      searchedOrder.address_snapshot.map_url ||
                      `https://www.google.com/maps?q=${searchedOrder.address_snapshot.latitude},${searchedOrder.address_snapshot.longitude}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-[12px] bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#6F584A] text-xs font-semibold transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-[#C6A36A]" />
                    <span>عرض إحداثيات الموقع على الخريطة</span>
                    <ExternalLink className="w-3 h-3 text-[#8A7465]" />
                  </a>
                </div>
              )}
            </div>

            {/* Payment & Delivery Summary */}
            <div className="bg-white p-6 rounded-[24px] border border-[#E5D8C9] shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-[#6F584A] font-heading flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-[#C6A36A]" />
                <span>ملخص الدفع والتوصيل</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-[#F4ECE2]">
                  <span className="text-[#7C736D]">طريقة الدفع:</span>
                  <span className="font-semibold text-[#2F2B28]">
                    {searchedOrder.payment_method_snapshot?.name_ar || 'دفع إلكتروني'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F4ECE2]">
                  <span className="text-[#7C736D]">طريقة التوصيل:</span>
                  <span className="font-semibold text-[#2F2B28]">
                    {searchedOrder.delivery_method_snapshot?.name_ar || 'توصيل قياسي'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F4ECE2]">
                  <span className="text-[#7C736D]">المجموع الفرعي:</span>
                  <span className="font-semibold text-[#2F2B28]" dir="ltr">{searchedOrder.subtotal} ر.س</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#F4ECE2]">
                  <span className="text-[#7C736D]">رسوم التوصيل:</span>
                  <span className="font-semibold text-[#2F2B28]" dir="ltr">
                    {searchedOrder.delivery_fee === 0 ? 'مجاني' : `${searchedOrder.delivery_fee} ر.س`}
                  </span>
                </div>
                <div className="flex justify-between py-2 text-sm font-bold text-[#6F584A]">
                  <span>الإجمالي الكلي:</span>
                  <span className="text-[#C6A36A] font-mono text-base" dir="ltr">
                    {searchedOrder.grand_total} ر.س
                  </span>
                </div>
              </div>

              {searchedOrder.bank_transfer_confirmed && (
                <div className="p-3 rounded-[12px] bg-[#25D366]/10 border border-[#25D366]/30 text-xs text-[#128C7E] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-[#25D366]" />
                  <span>
                    {searchedOrder.bank_transfer_verified
                      ? 'تم التحقق من الحوالة البنكية واعتمادها من الإدارة المالية'
                      : 'تم استلام إشعار التحويل البنكي وجارٍ مطابقته من الإدارة المالية'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Purchased Items List */}
          <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-[#E5D8C9] shadow-2xs">
            <h3 className="text-sm font-bold text-[#6F584A] font-heading mb-4 flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C6A36A]" />
              <span>المنتجات المشمولة في الطلب ({searchedOrder.items.length})</span>
            </h3>

            <div className="divide-y divide-[#F4ECE2]">
              {searchedOrder.items.map((item, idx) => (
                <div key={idx} className="py-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {item.image_snapshot ? (
                      <img
                        src={item.image_snapshot}
                        alt={item.product_name_snapshot}
                        className="w-14 h-14 rounded-[12px] object-cover border border-[#E5D8C9]"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-[12px] bg-[#F4ECE2] flex items-center justify-center text-[#8A7465]">
                        <Package className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-[#2F2B28]">{item.product_name_snapshot}</h4>
                      {item.variant_name_snapshot && (
                        <p className="text-[11px] text-[#7C736D]">الخيار: {item.variant_name_snapshot}</p>
                      )}
                      <p className="text-[10px] text-[#8A7465]">
                        الكمية: {item.quantity} × {item.unit_price} ر.س
                      </p>
                    </div>
                  </div>

                  <div className="text-left font-bold text-xs text-[#6F584A]" dir="ltr">
                    {item.line_total} ر.س
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
