import React from 'react';
import { X, Trash2, ShoppingBag, ArrowLeft, Sparkles, Plus, Minus } from 'lucide-react';
import { useStore } from '../context/StoreContext';

export const CartDrawer: React.FC = () => {
  const {
    isCartOpen,
    setIsCartOpen,
    cart,
    updateCartQuantity,
    removeFromCart,
    cartSubtotal,
    setActiveView,
  } = useStore();

  if (!isCartOpen) return null;

  const freeShippingThreshold = 450;
  const safeCartSubtotal = typeof cartSubtotal === 'number' && !isNaN(cartSubtotal) ? cartSubtotal : 0;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - safeCartSubtotal);
  const progressPercent = Math.min(100, Math.round((safeCartSubtotal / freeShippingThreshold) * 100)) || 0;

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    setActiveView('checkout');
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-2xs transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />

      <div className="fixed inset-y-0 left-0 max-w-full flex pl-0 sm:pl-10">
        <div className="w-screen max-w-md bg-[#FBF8F3] shadow-2xl flex flex-col border-r border-[#E5D8C9]">
          {/* Drawer Header */}
          <div className="p-5 bg-white border-b border-[#E5D8C9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#C6A36A]" />
              <h2 className="text-base font-bold text-[#6F584A] font-heading">
                سلة المقتنيات ({Array.isArray(cart) ? cart.reduce((a, b) => a + (b?.quantity || 1), 0) : 0})
              </h2>
            </div>

            <button
              onClick={() => setIsCartOpen(false)}
              className="p-1.5 rounded-full text-[#8A7465] hover:bg-[#F4ECE2]"
              aria-label="إغلاق السلة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Free Shipping Progress Indicator */}
          <div className="bg-[#F7F1E8] px-5 py-3 border-b border-[#E7D4BC]">
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-semibold text-[#6F584A] flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#C6A36A]" />
                {remainingForFreeShipping === 0 ? (
                  <span className="text-[#607866] font-bold">تهانينا! حصلتِ على شحن مجاني</span>
                ) : (
                  <span>
                    أضيفي <strong className="text-[#C6A36A] font-bold">{remainingForFreeShipping} ر.س</strong> للشحن المجاني
                  </span>
                )}
              </span>
              <span className="text-[11px] font-bold text-[#8A7465]">{progressPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#E5D8C9] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#C6A36A] transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {cart.length > 0 ? (
              cart.map((item, idx) => {
                if (!item || !item.product) return null;

                const itemPrice =
                  typeof item.variant?.price === 'number'
                    ? item.variant.price
                    : typeof item.product.price === 'number'
                    ? item.product.price
                    : 0;

                const quantity = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
                const lineTotal = itemPrice * quantity;
                const itemKey = `${item.product.id || idx}-${item.variant?.id || 'default'}-${idx}`;
                const imageSrc =
                  item.variant?.image_path ||
                  (Array.isArray(item.product.images) && item.product.images[0]?.path) ||
                  'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80';
                const displayName = item.product.name_ar || item.product.name_en || 'منتج ميني بازار';

                return (
                  <div
                    key={itemKey}
                    className="flex gap-3 bg-white p-3.5 rounded-[18px] border border-[#E7D4BC] shadow-2xs"
                  >
                    {/* Item Thumbnail */}
                    <div className="w-20 h-20 rounded-[12px] bg-[#F7F1E8] overflow-hidden shrink-0 border border-[#E5D8C9] flex items-center justify-center">
                      <img
                        src={imageSrc}
                        alt={item.variant?.name_ar || displayName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 flex flex-col justify-between text-right">
                      <div>
                        <h4 className="text-xs sm:text-sm font-bold text-[#2F2B28] font-heading line-clamp-1">
                          {displayName}
                        </h4>
                        {item.variant && (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {item.variant.color_code && (
                              <span
                                className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: item.variant.color_code }}
                              />
                            )}
                            <span className="text-[11px] text-[#8A7465] font-medium">
                              {item.variant.name_ar || item.variant.name_en}
                            </span>
                          </div>
                        )}
                        <span className="text-xs font-bold text-[#6F584A] mt-1 block" dir="ltr">
                          {itemPrice} ر.س
                        </span>
                      </div>

                      {/* Quantity Stepper & Remove */}
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F4ECE2]">
                        <div className="flex items-center border border-[#D9C1A7] rounded-[10px] bg-[#FBF8F3] px-1.5 py-0.5">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.product.id, item.variant?.id, quantity - 1)
                            }
                            className="p-1 text-[#6F584A] hover:bg-[#E7D4BC] rounded-[6px]"
                            aria-label="إنقاص الكمية"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-[#2F2B28]">
                            {quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(item.product.id, item.variant?.id, quantity + 1)
                            }
                            className="p-1 text-[#6F584A] hover:bg-[#E7D4BC] rounded-[6px]"
                            aria-label="زيادة الكمية"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#2F2B28]" dir="ltr">
                            {lineTotal} ر.س
                          </span>
                          <button
                            onClick={() => removeFromCart(item.product.id, item.variant?.id)}
                            className="text-[#B4574A] hover:text-red-700 p-1"
                            title="إزالة"
                            aria-label="إزالة العنصر"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-[#F4ECE2] text-[#C6A36A] flex items-center justify-center mx-auto mb-3">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-sm font-bold text-[#6F584A] mb-1 font-heading">
                  سلة التسوق فارغة حالياً
                </h3>
                <p className="text-xs text-[#7C736D] mb-4">
                  تصفحي أرقى الحقائب والساعات والعطور وأضيفي ما يعجبكِ.
                </p>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="px-5 py-2 rounded-[12px] bg-[#2F2B28] hover:bg-[#231F1D] text-white text-xs font-semibold shadow-xs"
                >
                  استكشفي التشكيلة
                </button>
              </div>
            )}
          </div>

          {/* Drawer Footer with Subtotal and Checkout CTA */}
          {cart.length > 0 && (
            <div className="p-5 bg-white border-t border-[#E5D8C9] space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-[#7C736D]">المجموع الفرعي:</span>
                <span className="font-bold text-lg text-[#2F2B28]" dir="ltr">
                  {cartSubtotal} <span className="text-xs text-[#8A7465]">ر.س</span>
                </span>
              </div>

              <div className="text-[11px] text-[#7C736D] text-right">
                * يتم احتساب رسوم التوصيل بحسب المدينة في الخطوة التالية.
              </div>

              <button
                onClick={handleProceedToCheckout}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-[14px] bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8] font-bold text-sm shadow-md transition-all active:scale-98 border border-[#4A3E37]"
              >
                <span>متابعة لإتمام الطلب</span>
                <ArrowLeft className="w-4 h-4 text-[#C6A36A]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
