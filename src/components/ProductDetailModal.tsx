import React, { useState } from 'react';
import {
  X,
  Heart,
  ShoppingBag,
  Star,
  Check,
  Truck,
  ShieldCheck,
  Gift,
  MessageCircle,
  AlertCircle,
  Award,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { Product, ProductVariant } from '../types';

export const ProductDetailModal: React.FC = () => {
  const { selectedProduct, setSelectedProduct } = useStore();

  if (!selectedProduct) return null;

  return (
    <ProductDetailModalDialog
      selectedProduct={selectedProduct}
      onClose={() => setSelectedProduct(null)}
    />
  );
};

interface ProductDetailModalDialogProps {
  selectedProduct: Product;
  onClose: () => void;
}

const ProductDetailModalDialog: React.FC<ProductDetailModalDialogProps> = ({
  selectedProduct,
  onClose,
}) => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    categories,
    brands,
    setSelectedBrand,
    storeSettings,
  } = useStore();

  const safeVariants = Array.isArray(selectedProduct.variants) && selectedProduct.variants.length > 0
    ? selectedProduct.variants
    : [];

  const safeImages = Array.isArray(selectedProduct.images) && selectedProduct.images.length > 0
    ? selectedProduct.images
    : [
        {
          id: 'img-def',
          product_id: selectedProduct.id,
          path: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80',
          alt_text_ar: selectedProduct.name_ar || 'منتج ميني بازار',
          alt_text_en: selectedProduct.name_en || 'Product',
          is_primary: true,
          sort_order: 1,
        },
      ];

  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    safeVariants.find((v) => v.is_default)?.id ||
      safeVariants[0]?.id ||
      ''
  );
  const [selectedImageIndex, setSelectedImageIndex] = useState<number>(0);
  const [activePhotoUrl, setActivePhotoUrl] = useState<string>(() => {
    const defaultVariant = safeVariants.find((v) => v.is_default);
    return (
      (defaultVariant?.image_path && defaultVariant.image_path.trim()) ||
      (safeImages[0]?.path && safeImages[0].path.trim()) ||
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80'
    );
  });
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddedSuccess, setIsAddedSuccess] = useState(false);

  const activeVariant: ProductVariant | undefined =
    safeVariants.find((v) => v.id === selectedVariantId) ||
    safeVariants[0];

  const currentPrice = activeVariant?.price ?? selectedProduct.price ?? 0;
  const comparePrice = activeVariant?.compare_at_price ?? selectedProduct.compare_at_price;
  const isAvailable =
    (activeVariant?.availability_status ?? selectedProduct.availability_status) === 'available';
  const category = categories.find((c) => c.id === selectedProduct.category_id);
  const brand = brands.find((b) => b.id === selectedProduct.brand_id);
  const isFavorited = selectedProduct.id ? isInWishlist(selectedProduct.id) : false;

  // Active displayed image respects either the selected gallery thumbnail or selected variant
  const currentDisplayImage =
    (activePhotoUrl && activePhotoUrl.trim()) ||
    (safeImages[selectedImageIndex]?.path && safeImages[selectedImageIndex].path.trim()) ||
    (safeImages[0]?.path && safeImages[0].path.trim()) ||
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80';

  const handleThumbnailClick = (imgPath: string, idx: number) => {
    setSelectedImageIndex(idx);
    setActivePhotoUrl(imgPath);
  };

  const handleVariantSelect = (variant: ProductVariant) => {
    setSelectedVariantId(variant.id);
    if (variant.image_path) {
      setActivePhotoUrl(variant.image_path);
      const idx = safeImages.findIndex((img) => img.path === variant.image_path);
      if (idx > -1) {
        setSelectedImageIndex(idx);
      }
    }
  };

  const handleAddToCart = () => {
    if (!isAvailable) return;
    try {
      addToCart(selectedProduct, activeVariant?.id, quantity);
      setIsAddedSuccess(true);
      setTimeout(() => {
        setIsAddedSuccess(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Error adding to cart from modal:', err);
    }
  };

  const handleWhatsAppOrder = () => {
    const phone = storeSettings.whatsapp_number.replace(/\D/g, '');
    const variantNote = activeVariant ? ` (المتغير المختار: ${activeVariant.name_ar})` : '';
    const text = encodeURIComponent(
      `مرحباً ميني بازار، أرغب في طلب منتج:\n- الاسم: ${selectedProduct.name_ar}${variantNote}\n- الرمز: ${activeVariant?.sku || selectedProduct.sku}\n- السعر: ${currentPrice} ر.س\n- الكمية: ${quantity}`
    );
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex flex-col items-center justify-start sm:justify-center p-2 sm:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative bg-white rounded-[24px] sm:rounded-[28px] max-w-4xl w-full overflow-hidden shadow-2xl border border-[#E5D8C9] my-2 sm:my-8 max-h-[94vh] sm:max-h-[90vh] flex flex-col overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Mobile & Desktop Close Button - Never disappears or scrolls off-screen */}
        <button
          onClick={onClose}
          aria-label="إغلاق نافذة تفاصيل المنتج"
          className="sticky sm:absolute top-3 left-3 z-30 self-start sm:self-auto w-10 h-10 rounded-full bg-white/95 sm:bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#6F584A] flex items-center justify-center transition-transform active:scale-95 shadow-md border border-[#E5D8C9] ml-3 mt-2 sm:ml-0 sm:mt-0 shrink-0"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Images Gallery Column */}
          <div className="md:col-span-6 bg-[#FBF8F3] p-4 sm:p-8 flex flex-col items-center justify-between border-b md:border-b-0 md:border-l border-[#E5D8C9]">
            {/* Active Main Image - Fully responsive, complete image display with contain mode to prevent cropping on mobile */}
            <div className="relative w-full max-h-[44vh] sm:max-h-[440px] aspect-4/3 sm:aspect-1/1 rounded-[18px] sm:rounded-[20px] overflow-hidden bg-white border border-[#E7D4BC] shadow-xs mb-3 sm:mb-4 flex items-center justify-center p-2 sm:p-3">
              <img
                src={currentDisplayImage}
                alt={activeVariant?.name_ar || selectedProduct.name_ar}
                className="w-full h-full object-contain object-center transition-all duration-300"
              />
              {!isAvailable && (
                <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center">
                  <span className="bg-[#B4574A] text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg">
                    نفدت الكمية حالياً
                  </span>
                </div>
              )}

              {/* Active variant image indicator badge */}
              {activeVariant?.image_path && (
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-xs text-white text-[10px] font-medium px-2.5 py-1 rounded-full flex items-center gap-1.5">
                  {activeVariant.color_code && (
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-white shrink-0"
                      style={{ backgroundColor: activeVariant.color_code }}
                    />
                  )}
                  <span>معاينة: {activeVariant.name_ar}</span>
                </div>
              )}
            </div>

            {/* Thumbnail Selectors */}
            {safeImages.length > 1 && (
              <div className="flex items-center gap-2.5 sm:gap-3 w-full overflow-x-auto pb-1 pt-1">
                {safeImages.map((img, idx) => (
                  <button
                    key={img.id || idx}
                    type="button"
                    onClick={() => handleThumbnailClick(img.path, idx)}
                    className={`relative w-14 h-14 sm:w-16 sm:h-16 rounded-[12px] overflow-hidden border-2 transition-all shrink-0 cursor-pointer bg-white ${
                      activePhotoUrl === img.path
                        ? 'border-[#2F2B28] ring-2 ring-[#C6A36A] shadow-xs scale-102'
                        : 'border-[#E7D4BC] opacity-70 hover:opacity-100 hover:border-[#8A7465]'
                    }`}
                  >
                    <img src={img.path} alt={img.alt_text_ar || selectedProduct.name_ar} className="w-full h-full object-contain p-1" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details & Purchase Controls */}
          <div className="md:col-span-6 p-6 sm:p-8 flex flex-col text-right">
            {/* Category, Brand & SKU */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {brand && storeSettings?.brand_settings?.show_in_product_modal !== false && (
                  <button
                    onClick={() => {
                      setSelectedBrand(brand.id);
                      onClose();
                      const el = document.getElementById('products-section');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-[10px] bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#6F584A] text-xs font-bold border border-[#E7D4BC] transition-all shadow-2xs hover:shadow-xs"
                    title={`عرض جميع منتجات براند ${brand.name_ar}${brand.name_en ? ` (${brand.name_en})` : ''}`}
                  >
                    {storeSettings?.brand_settings?.display_mode !== 'name_only' && brand.logo_path && (
                      <div className="w-6 h-6 rounded-[6px] bg-white border border-[#E5D8C9] p-0.5 shrink-0 overflow-hidden flex items-center justify-center">
                        <img
                          src={brand.logo_path}
                          alt={brand.name_ar}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    {storeSettings?.brand_settings?.display_mode === 'name_only' && (
                      <Award className="w-4 h-4 text-[#C6A36A]" />
                    )}
                    {storeSettings?.brand_settings?.display_mode !== 'logo_only' && (
                      <div className="flex items-center gap-1">
                        <span>{brand.name_ar}</span>
                        {brand.name_en && (
                          <span className="text-[10px] text-[#8A7465] font-sans font-normal">
                            ({brand.name_en})
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                )}

                <span className="text-xs font-bold text-[#C6A36A] uppercase tracking-wider">
                  {category?.name_ar || 'مختارات ميني بازار'}
                </span>
              </div>

              <span className="text-xs text-[#7C736D] font-mono shrink-0">
                {activeVariant?.sku || selectedProduct.sku}
              </span>
            </div>

            {/* Product Title */}
            <h2 className="text-xl sm:text-2xl font-bold text-[#2F2B28] font-heading mb-2 leading-snug">
              {selectedProduct.name_ar || selectedProduct.name_en || 'منتج ميني بازار'}
            </h2>

            {/* Ratings and Reviews */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#F4ECE2]">
              <div className="flex items-center text-[#C6A36A]">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-[#C6A36A]" />
                ))}
              </div>
              <span className="text-xs font-bold text-[#2F2B28]">{(Number(selectedProduct.rating) || 5.0).toFixed(1)}</span>
              <span className="text-xs text-[#7C736D]">
                ({selectedProduct.reviews_count || 0} تقييم موثق من عملاء البوتيك)
              </span>
            </div>

            {/* Price section */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-2xl sm:text-3xl font-bold text-[#6F584A] font-heading" dir="ltr">
                {currentPrice} <span className="text-sm font-medium text-[#8A7465]">ر.س</span>
              </span>
              {comparePrice && comparePrice > currentPrice && (
                <span className="text-sm text-[#7C736D] line-through" dir="ltr">
                  {comparePrice} ر.س
                </span>
              )}
              {comparePrice && comparePrice > currentPrice && (
                <span className="bg-[#B4574A] text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                  وفر {comparePrice - currentPrice} ر.س
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#5F5751] leading-relaxed mb-4">
              {selectedProduct.description_ar || selectedProduct.short_description_ar || ''}
            </p>

            {/* Variants Selector - Mandatory and prominent */}
            {safeVariants.length > 0 && (
              <div className="mb-5 p-3.5 bg-[#FBF8F3] rounded-[18px] border border-[#E7D4BC]">
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold text-[#6F584A]">
                    اللون أو المتغير المختار للإضافة للسلة:
                  </label>
                  {activeVariant && (
                    <span className="text-xs font-bold text-[#C6A36A]">
                      {activeVariant.name_ar || activeVariant.name_en}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  {safeVariants.map((v) => {
                    const isSelected = selectedVariantId === v.id;
                    const vName = v.name_ar || v.name_en || 'خيار';
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => handleVariantSelect(v)}
                        className={`flex items-center gap-2 px-3.5 py-2 rounded-[12px] text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-[#2F2B28] text-white border-[#2F2B28] shadow-xs ring-2 ring-[#C6A36A]'
                            : 'bg-white text-[#5F5751] border-[#E7D4BC] hover:border-[#8A7465] hover:bg-[#F4ECE2]'
                        }`}
                      >
                        {v.color_code && (
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/50 shrink-0 shadow-2xs"
                            style={{ backgroundColor: v.color_code }}
                          />
                        )}
                        <span>{vName}</span>
                        <span className="text-[10px] opacity-80" dir="ltr">
                          ({v.price || currentPrice} ر.س)
                        </span>
                        {isSelected && <Check className="w-3 h-3 text-[#C6A36A]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity and Action Buttons */}
            <div className="mt-auto pt-3 border-t border-[#F4ECE2] flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {/* Quantity stepper */}
                <div className="flex items-center border border-[#D9C1A7] rounded-[12px] bg-[#FBF8F3] px-2 py-1">
                  <button
                    onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                    className="w-7 h-7 flex items-center justify-center text-[#6F584A] hover:bg-[#E7D4BC] rounded-[8px] font-bold"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-bold text-[#2F2B28]">{quantity}</span>
                  <button
                    onClick={() => setQuantity((prev) => prev + 1)}
                    className="w-7 h-7 flex items-center justify-center text-[#6F584A] hover:bg-[#E7D4BC] rounded-[8px] font-bold"
                  >
                    +
                  </button>
                </div>

                {/* Wishlist toggle */}
                <button
                  onClick={() => toggleWishlist(selectedProduct.id)}
                  className="p-2.5 rounded-[12px] border border-[#D9C1A7] bg-[#FBF8F3] text-[#6F584A] hover:bg-[#F4ECE2] transition-colors"
                  title="المفضلة"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      isFavorited ? 'fill-[#B4574A] text-[#B4574A]' : 'text-[#8A7465]'
                    }`}
                  />
                </button>

                {/* Direct Add to Cart Button */}
                <button
                  disabled={!isAvailable}
                  onClick={handleAddToCart}
                  className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-[14px] bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8] font-bold text-sm shadow-md active:scale-98 transition-all disabled:opacity-50 border border-[#4A3E37]"
                >
                  <ShoppingBag className="w-4 h-4 text-[#C6A36A]" />
                  <span>
                    {isAddedSuccess
                      ? 'تمت الإضافة للسلة بنجاح ✓'
                      : isAvailable
                      ? 'أضف إلى السلة'
                      : 'نفدت الكمية'}
                  </span>
                </button>
              </div>

              {/* Instant WhatsApp Order */}
              <button
                onClick={handleWhatsAppOrder}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-[14px] bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#1E7E34] border border-[#25D366]/30 font-semibold text-xs transition-colors"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>طلب سريع عبر واتساب مع خدمة الكونسيرج الفاخرة</span>
              </button>
            </div>

            {/* Micro Trust badges */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#F4ECE2] text-[11px] text-[#7C736D] text-center">
              <div className="flex flex-col items-center gap-1">
                <Truck className="w-4 h-4 text-[#C6A36A]" />
                <span>توصيل سريع وآمن</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-[#C6A36A]" />
                <span>أصلي 100% ومضمون</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <Gift className="w-4 h-4 text-[#C6A36A]" />
                <span>تغليف إهداء راقٍ مجاناً</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
