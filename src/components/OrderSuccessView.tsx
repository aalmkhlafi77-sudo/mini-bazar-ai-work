import React from 'react';
import {
  CheckCircle,
  MessageCircle,
  Printer,
  ShoppingBag,
  ArrowRight,
  Package,
  Clock,
  MapPin,
  CreditCard,
  Sparkles,
  FileCheck,
  Eye,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { MiniBazaarLogo } from './MiniBazaarLogo';
import { OrderProgressTimeline } from './OrderProgressTimeline';

export const OrderSuccessView: React.FC = () => {
  const { currentOrder, setActiveView, storeSettings } = useStore();

  if (!currentOrder) {
    return (
      <div className="py-20 px-4 text-center max-w-md mx-auto">
        <h2 className="text-xl font-bold text-[#2F2B28] mb-3 font-heading">
          لا يوجد طلب نشط حالياً
        </h2>
        <button
          onClick={() => setActiveView('store')}
          className="px-6 py-2.5 rounded-[14px] bg-[#2F2B28] hover:bg-[#231F1D] text-white text-xs font-semibold shadow-xs"
        >
          العودة للمتجر
        </button>
      </div>
    );
  }

  const handleSendToWhatsApp = () => {
    const phone = storeSettings.whatsapp_number.replace(/\D/g, '');
    const itemsList = currentOrder.items
      .map((it) => `- ${it.product_name_snapshot} (${it.variant_name_snapshot || 'الافتراضي'}) × ${it.quantity} = ${it.line_total} ر.س`)
      .join('\n');

    const msg = encodeURIComponent(
      `مرحباً ميني بازار،\nتم إتمام الطلب بنجاح عبر المتجر:\n\n*رقم الطلب:* ${currentOrder.order_number}\n*الاسم:* ${currentOrder.customer_name_snapshot}\n*الهاتف:* ${currentOrder.customer_phone_snapshot}\n*المدينة:* ${currentOrder.address_snapshot.city} - ${currentOrder.address_snapshot.district}\n*طريقة الدفع:* ${currentOrder.payment_method_snapshot.name_ar}\n*طريقة التوصيل:* ${currentOrder.delivery_method_snapshot.name_ar}\n\n*المنتجات:*\n${itemsList}\n\n*المبلغ الإجمالي:* ${currentOrder.grand_total} ر.س`
    );

    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const handlePrintReceipt = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const itemsHtml = currentOrder.items
      .map(
        (it) => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9; text-align: right;">${it.product_name_snapshot} ${it.variant_name_snapshot ? `(${it.variant_name_snapshot})` : ''}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9; text-align: center;">${it.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9; text-align: left;" dir="ltr">${it.unit_price} ر.س</td>
          <td style="padding: 10px; border-bottom: 1px solid #E5D8C9; text-align: left; font-weight: bold;" dir="ltr">${it.line_total} ر.س</td>
        </tr>
      `
      )
      .join('');

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8">
        <title>إيصال طلب رقم ${currentOrder.order_number}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body {
            font-family: 'Cairo', Tahoma, Arial, sans-serif;
            color: #2F2B28;
            background: #fff;
            padding: 30px;
            margin: 0;
            direction: rtl;
            text-align: right;
          }
          .receipt-container {
            max-width: 800px;
            margin: 0 auto;
            border: 1px solid #E5D8C9;
            border-radius: 16px;
            padding: 30px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #E5D8C9;
            padding-bottom: 20px;
            margin-bottom: 20px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
            color: #2F2B28;
          }
          .order-badge {
            background: #F7F1E8;
            padding: 15px 20px;
            border-radius: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th {
            background: #F4ECE2;
            padding: 10px;
            text-align: right;
            font-size: 13px;
          }
          .totals {
            margin-top: 20px;
            border-top: 1px solid #E5D8C9;
            padding-top: 15px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 6px 0;
            font-size: 14px;
          }
          .grand-total {
            font-size: 18px;
            font-weight: bold;
            color: #6F584A;
            border-top: 2px solid #2F2B28;
            padding-top: 10px;
            margin-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            font-size: 12px;
            color: #7C736D;
            border-top: 1px dashed #E5D8C9;
            padding-top: 20px;
          }
          @media print {
            body { padding: 0; }
            .receipt-container { border: none; padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="header">
            <div>
              <div class="logo">ميني بازار | Mini Bazaar</div>
              <div style="font-size: 12px; color: #7C736D; margin-top: 4px;">متجرك الأول للأزياء والإكسسوارات الفاخرة</div>
            </div>
            <div style="text-align: left;">
              <div style="font-size: 14px; font-weight: bold; color: #607866;">✓ تم اعتماد وحفظ الطلب</div>
              <div style="font-size: 12px; color: #7C736D; margin-top: 4px;">التاريخ: ${new Date(currentOrder.placed_at).toLocaleDateString('ar-SA')}</div>
            </div>
          </div>

          <div class="order-badge">
            <div>
              <span style="font-size: 11px; color: #8A7465; display: block; margin-bottom: 2px;">رقم الطلب المرجعي:</span>
              <span style="font-size: 22px; font-weight: bold; font-family: monospace;" dir="ltr">${currentOrder.order_number}</span>
            </div>
            <div style="text-align: left; font-size: 12px; color: #5F5751;">
              <div>طريقة الدفع: <strong>${currentOrder.payment_method_snapshot.name_ar}</strong></div>
              <div>طريقة التوصيل: <strong>${currentOrder.delivery_method_snapshot.name_ar}</strong></div>
            </div>
          </div>

          <div style="display: flex; justify-content: space-between; gap: 15px; margin-bottom: 20px; font-size: 13px; background: #FBF8F3; padding: 15px; border-radius: 12px;">
            <div>
              <strong>بيانات العميل:</strong><br>
              ${currentOrder.customer_name_snapshot}<br>
              <span dir="ltr">${currentOrder.customer_phone_snapshot}</span>
            </div>
            <div>
              <strong>عنوان التسليم:</strong><br>
              ${currentOrder.address_snapshot.city}، ${currentOrder.address_snapshot.district}<br>
              ${currentOrder.address_snapshot.street || ''}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>المنتج / الصنف</th>
                <th style="text-align: center;">الكمية</th>
                <th style="text-align: left;">السعر الفردي</th>
                <th style="text-align: left;">المجموع</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="total-row">
              <span>مجموع المنتجات:</span>
              <span dir="ltr">${currentOrder.subtotal} ر.س</span>
            </div>
            <div class="total-row">
              <span>رسوم التوصيل:</span>
              <span dir="ltr">${currentOrder.delivery_fee} ر.س</span>
            </div>
            ${
              currentOrder.discount_total > 0
                ? `<div class="total-row" style="color: #607866;">
                     <span>الخصم المطبق:</span>
                     <span dir="ltr">-${currentOrder.discount_total} ر.س</span>
                   </div>`
                : ''
            }
            <div class="total-row grand-total">
              <span>المجموع الإجمالي:</span>
              <span dir="ltr">${currentOrder.grand_total} ر.س</span>
            </div>
          </div>

          ${
            currentOrder.bank_transfer_receipt
              ? `<div style="margin-top: 20px; padding: 12px; background: #FFF8EE; border: 1px solid #C6A36A; border-radius: 10px; font-size: 12px;">
                   <strong>حالة التحويل البنكي:</strong> تم إرفاق إشعار الحوالة البنكية بنجاح وجاري مطابقتها مع الحساب البنكي.
                 </div>`
              : ''
          }

          <div class="footer">
            <p>شكراً لتسوقكم في ميني بازار | نسعد دائماً بخدمتكم</p>
            <p style="font-size: 10px; margin-top: 4px;">هذا إيصال إلكتروني صادر عن النظام ولا يحتاج إلى ختم.</p>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 400);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="py-12 px-4 sm:px-8 max-w-4xl mx-auto">
      {/* Printable Invoice Container */}
      <div className="bg-white rounded-[28px] border border-[#E5D8C9] p-6 sm:p-10 shadow-lg text-right print:border-none print:shadow-none">
        {/* Header with Logo and Stamp */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-[#E5D8C9]">
          <MiniBazaarLogo variant="compact" />

          <div className="flex flex-col items-start sm:items-end">
            <div className="flex items-center gap-1.5 text-xs font-bold text-[#607866] bg-[#607866]/10 px-3 py-1 rounded-full mb-1">
              <CheckCircle className="w-4 h-4" />
              <span>تم اعتماد وحفظ الطلب</span>
            </div>
            <span className="text-xs text-[#7C736D]">
              التاريخ: {new Date(currentOrder.placed_at).toLocaleDateString('ar-SA', { dateStyle: 'full' })}
            </span>
          </div>
        </div>

        {/* Order Number Highlight Banner */}
        <div className="my-6 p-6 rounded-[20px] bg-[#F7F1E8] border border-[#E7D4BC] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-[#8A7465] font-semibold block mb-1">
              رقم الطلب المرجعي:
            </span>
            <span className="text-2xl sm:text-3xl font-bold font-mono text-[#2F2B28]" dir="ltr">
              {currentOrder.order_number}
            </span>
          </div>

          <div className="text-center sm:text-left text-xs text-[#5F5751]">
            <p>احتفظي برقم الطلب لتتبع حالة الشحنة أو عند التواصل مع خدمة العملاء.</p>
          </div>
        </div>

        {/* Order Progress Timeline */}
        <div className="mb-6">
          <OrderProgressTimeline status={currentOrder.status} logs={currentOrder.logs} />
        </div>

        {/* Customer & Address & Shipping details */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-[18px] bg-[#FBF8F3] border border-[#E5D8C9] text-xs mb-8">
          <div>
            <span className="text-[#8A7465] font-bold block mb-1">المستلم:</span>
            <span className="text-[#2F2B28] font-bold block">{currentOrder.customer_name_snapshot}</span>
            <span className="text-[#5F5751] block mt-0.5" dir="ltr">{currentOrder.customer_phone_snapshot}</span>
            {currentOrder.customer_email_snapshot && (
              <span className="text-[#7C736D] block">{currentOrder.customer_email_snapshot}</span>
            )}
          </div>

          <div>
            <span className="text-[#8A7465] font-bold block mb-1">عنوان التسليم:</span>
            <span className="text-[#2F2B28] block">
              {currentOrder.address_snapshot.city}، {currentOrder.address_snapshot.district}
            </span>
            <span className="text-[#5F5751] block">{currentOrder.address_snapshot.street}</span>
            {currentOrder.address_snapshot.building && (
              <span className="text-[#7C736D] block">{currentOrder.address_snapshot.building}</span>
            )}
          </div>

          <div>
            <span className="text-[#8A7465] font-bold block mb-1">خيارات الدفع والتوصيل:</span>
            <span className="text-[#2F2B28] font-medium block">
              التوصيل: {currentOrder.delivery_method_snapshot.name_ar}
            </span>
            <span className="text-[#2F2B28] font-medium block mt-1">
              الدفع: {currentOrder.payment_method_snapshot.name_ar}
            </span>
          </div>
        </div>

        {/* Itemized Table */}
        <div className="mb-6">
          <h3 className="text-sm font-bold text-[#2F2B28] font-heading mb-3">
            المقتنيات المشمولة في الطلب
          </h3>

          <div className="border border-[#E5D8C9] rounded-[16px] overflow-hidden">
            <table className="w-full text-right text-xs">
              <thead className="bg-[#F4ECE2] text-[#2F2B28] font-bold">
                <tr>
                  <th className="p-3">المنتج</th>
                  <th className="p-3">الرمز</th>
                  <th className="p-3 text-center">الكمية</th>
                  <th className="p-3">السعر</th>
                  <th className="p-3 text-left">المجموع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5D8C9]">
                {currentOrder.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#FBF8F3]">
                    <td className="p-3 font-semibold text-[#2F2B28]">
                      {item.product_name_snapshot}
                      {item.variant_name_snapshot && (
                        <span className="block text-[11px] text-[#8A7465] font-normal">
                          {item.variant_name_snapshot}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[#7C736D] font-mono">{item.sku_snapshot}</td>
                    <td className="p-3 text-center font-bold text-[#2F2B28]">{item.quantity}</td>
                    <td className="p-3 text-[#5F5751]" dir="ltr">{item.unit_price} ر.س</td>
                    <td className="p-3 text-left font-bold text-[#2F2B28]" dir="ltr">
                      {item.line_total} ر.س
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pricing Summary Breakdown */}
        <div className="flex justify-end mb-8">
          <div className="w-full sm:w-72 space-y-2 text-xs">
            <div className="flex justify-between text-[#7C736D]">
              <span>المجموع الفرعي:</span>
              <span className="font-bold text-[#2F2B28]" dir="ltr">{currentOrder.subtotal} ر.س</span>
            </div>
            <div className="flex justify-between text-[#7C736D]">
              <span>رسوم التوصيل المعتمدة:</span>
              <span className="font-bold text-[#2F2B28]" dir="ltr">{currentOrder.delivery_fee} ر.س</span>
            </div>
            <div className="flex justify-between items-baseline pt-2 border-t border-[#E5D8C9] text-base font-bold text-[#2F2B28]">
              <span>المجموع الإجمالي:</span>
              <span className="text-xl" dir="ltr">{currentOrder.grand_total} ر.س</span>
            </div>
          </div>
        </div>

        {/* Bank transfer guidance if applicable */}
        {currentOrder.payment_method_snapshot.type === 'bank_transfer' && (
          <div className="mb-8 p-4 rounded-[16px] bg-[#FFF8EE] border border-[#C6A36A]/40 text-xs text-[#2F2B28] leading-relaxed">
            <div className="flex items-start justify-between gap-4">
              <div>
                <strong className="block font-bold mb-1 text-[#6F584A]">
                  حالة التحويل البنكي الرسمي:
                </strong>
                {currentOrder.bank_transfer_receipt ? (
                  <div className="space-y-1">
                    <p className="text-[#607866] font-semibold flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-[#607866]" />
                      تم إرفاق صورة إشعار الحوالة البنكية بنجاح مع طلبك.
                    </p>
                    <p className="text-[#7C736D]">
                      سيقوم قسم التدقيق المالي بمطابقة الإشعار مع كشف الحساب البنكي واعتماد شحن الطلب فوراً.
                    </p>
                  </div>
                ) : (
                  <p>
                    يرجى تحويل المبلغ الإجمالي إلى حساب مؤسسة ميني بازار (الآيبان: SA44 8000 0204 6080 1000 9999)، ثم الضغط على الزر أدناه لمشاركة تفاصيل الطلب وإرسال صورة الإيصال عبر الواتساب لتأكيد خروج الشحنة.
                  </p>
                )}
              </div>

              {currentOrder.bank_transfer_receipt && (
                <div className="shrink-0 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-[10px] overflow-hidden border border-[#D9C1A7] bg-white">
                    <img
                      src={currentOrder.bank_transfer_receipt}
                      alt="إشعار الحوالة"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="text-[10px] text-[#8A7465] mt-1 font-semibold">إشعار مرفق</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions Bar (Screen only) */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-[#E5D8C9] print:hidden">
          <button
            onClick={() => setActiveView('store')}
            className="flex items-center gap-2 px-5 py-3 rounded-[14px] bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#2F2B28] text-xs font-semibold"
          >
            <ArrowRight className="w-4 h-4" />
            <span>متابعة التسوق بالمتجر</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveView('track-order')}
              className="flex items-center gap-2 px-5 py-3 rounded-[14px] bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8] text-xs font-semibold shadow-xs transition-transform active:scale-95"
            >
              <Package className="w-4 h-4 text-[#C6A36A]" />
              <span>متابعة حالة الطلب وملاحظات المشرف</span>
            </button>

            <button
              onClick={handlePrintReceipt}
              className="flex items-center gap-2 px-5 py-3 rounded-[14px] border border-[#D9C1A7] text-[#2F2B28] hover:bg-[#FBF8F3] text-xs font-semibold"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة إيصال الطلب</span>
            </button>

            <button
              onClick={handleSendToWhatsApp}
              className="flex items-center gap-2 px-6 py-3 rounded-[14px] bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold shadow-md transition-transform active:scale-95"
            >
              <MessageCircle className="w-4 h-4" />
              <span>إرسال الطلب للبوتيك عبر واتساب</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
