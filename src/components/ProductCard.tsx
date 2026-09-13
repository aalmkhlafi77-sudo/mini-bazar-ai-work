import React, { useState } from 'react';
import { Heart, ShoppingBag, Star, Check, AlertCircle, MessageCircle } from 'lucide-react';
import { Product, ProductVariant } from '../types';
import { useStore } from '../context/StoreContext';

interface ProductCardProps {
  product: Product;
  mobileViewMode?: 'single' | 'double';
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, mobileViewMode = 'double' }) => {
  const {
    addToCart,
    toggleWishlist,
    isInWishlist,
    categories,
    brands,
    setSelectedProduct,
    setSelectedBrand,
    storeSettings,
  } = useStore();

  const safeVariants = Array.isArray(product?.variants) && product.variants.length > 0 ? product.variants : [];
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    safeVariants.find((v) => v.is_default)?.id || safeVariants[0]?.id || ''
  );
  const [justAdded, setJustAdded] = useState(false);

  const activeVariant: ProductVariant | undefined =
    safeVariants.find((v) => v.id === selectedVariantId) || safeVariants[0];

  const isFavorited = product?.id ? isInWishlist(product.id) : false;
  const category = categories.find((c) => c.id === product?.category_id);
  const brand = brands.find((b) => b.id === product?.brand_id);
  const isAvailable = (activeVariant?.availability_status ?? product?.availability_status) === 'available';

  const activePrice = activeVariant?.price ?? product?.price ?? 0;
  const activeComparePrice = activeVariant?.compare_at_price ?? product?.compare_at_price;

  // Displayed image: prefer chosen variant image, fallback to primary product image or placeholder
  const displayImage =
    (activeVariant?.image_path && activeVariant.image_path.trim()) ||
    (Array.isArray(product?.images) && product.images.find((img) => img.path && img.path.trim())?.path) ||
    'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=400&q=80';

  const handleWhatsAppInquiry = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = (storeSettings?.whatsapp_number || '+966500000000').replace(/\D/g, '');
    const message = encodeURIComponent(
      `مرحباً ميني بازار، أود الاستفسار عن توفر منتج: ${product?.name_ar || ''} (الخيار: ${activeVariant?.name_ar || ''})`
    );
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product || !isAvailable) return;
    try {
      addToCart(product, activeVariant?.id, 1, false);
      setJustAdded(true);
      setTimeout(() => setJustAdded(false), 2000);
    } catch (err) {
      console.error('Error adding to cart from ProductCard:', err);
    }
  };

  const handleVariantSelect = (e: React.MouseEvent, variantId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedVariantId(variantId);
  };

  return (
    <div
      onClick={() => setSelectedProduct(product)}
      className={`group relative flex flex-col h-full bg-white ${
        mobileViewMode === 'double' ? 'rounded-[16px] sm:rounded-[20px]' : 'rounded-[20px]'
      } border border-[#E5D8C9] hover:border-[#C6A36A] shadow-2xs hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer`}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          setSelectedProduct(product);
        }
      }}
    >
      {/* 1. Image Container with Badges and Wishlist button */}
      <div
        className={`relative w-full ${
          mobileViewMode === 'double' ? 'aspect-square sm:aspect-square' : 'aspect-4/3 sm:aspect-1/1'
        } overflow-hidden bg-[#F7F1E8] flex items-center justify-center`}
      >
        <img
          src={displayImage}
          alt={activeVariant?.name_ar || product.name_ar}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-all duration-500"
          loading="lazy"
        />

        {/* Badges Top Right (RTL) */}
        <div
          className={`absolute ${
            mobileViewMode === 'double'
              ? 'top-2 right-2 gap-1 max-w-[82%]'
              : 'top-3 right-3 gap-1.5'
          } flex flex-col z-10`}
        >
          {product?.is_new && (
            <span
              className={`bg-[#2F2B28] text-[#F5E9D8] ${
                mobileViewMode === 'double'
                  ? 'text-[9px] sm:text-[10px] px-1.5 sm:px-2.5 py-0.5 sm:py-1'
                  : 'text-[10px] px-2.5 py-1'
              } font-bold rounded-full shadow-xs border border-[#4A3E37] truncate`}
            >
              وصل حديثاً
            </span>
          )}
          {product?.is_best_seller && (
            <span
              className={`bg-[#C6A36A] text-[#2F2B28] ${
                mobileViewMode === 'double'
                  ? 'text-[9px] sm:text-[10px] px-1.5 sm:px-2.5 py-0.5 sm:py-1'
                  : 'text-[10px] px-2.5 py-1'
              } font-bold rounded-full shadow-xs truncate`}
            >
              الأكثر طلباً
            </span>
          )}
          {activeComparePrice && activeComparePrice > activePrice && (
            <span
              className={`bg-[#B4574A] text-white ${
                mobileViewMode === 'double'
                  ? 'text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5'
                  : 'text-[10px] px-2 py-0.5'
              } font-bold rounded-full shadow-xs truncate`}
            >
              وفر {activeComparePrice - activePrice} ر.س
            </span>
          )}
        </div>

        {/* Wishlist Top Left (RTL) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (product?.id) toggleWishlist(product.id);
          }}
          aria-label={isFavorited ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
          className={`absolute ${
            mobileViewMode === 'double' ? 'top-2 left-2 w-7 h-7 sm:w-8 sm:h-8' : 'top-3 left-3 w-8 h-8'
          } rounded-full bg-white/90 hover:bg-white text-[#6F584A] shadow-sm flex items-center justify-center transition-transform active:scale-90 z-10 cursor-pointer`}
        >
          <Heart
            className={`${
              mobileViewMode === 'double' ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-4 h-4'
            } transition-colors ${
              isFavorited ? 'fill-[#B4574A] text-[#B4574A]' : 'text-[#8A7465]'
            }`}
          />
        </button>

        {/* Selected Variant pill tag over image */}
        {activeVariant && safeVariants.length > 1 && (
          <div
            className={`absolute ${
              mobileViewMode === 'double'
                ? 'bottom-1.5 right-1.5 text-[9px] px-1.5 py-0.5'
                : 'bottom-2.5 right-2.5 text-[10px] px-2 py-0.5'
            } bg-black/60 backdrop-blur-2xs text-white font-medium rounded-full z-10 flex items-center gap-1`}
          >
            {activeVariant.color_code && (
              <span
                className="w-2 h-2 rounded-full border border-white shrink-0"
                style={{ backgroundColor: activeVariant.color_code }}
              />
            )}
            <span className="truncate max-w-[80px] sm:max-w-none">
              {activeVariant.name_ar || activeVariant.name_en}
            </span>
          </div>
        )}

        {/* Availability Badge Overlay if out of stock */}
        {!isAvailable && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-2xs flex items-center justify-center z-15">
            <span
              className={`bg-[#B4574A] text-white ${
                mobileViewMode === 'double'
                  ? 'text-[10px] sm:text-xs px-2 sm:px-3 py-1 sm:py-1.5'
                  : 'text-xs px-3 py-1.5'
              } font-bold rounded-full shadow-md`}
            >
              نفدت الكمية حالياً
            </span>
          </div>
        )}
      </div>

      {/* 2. Content Body */}
      <div
        className={`flex flex-col flex-1 ${
          mobileViewMode === 'double' ? 'p-2.5 sm:p-5' : 'p-4 sm:p-5'
        } text-right`}
      >
        {/* Category & Brand & Rating */}
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1 overflow-hidden min-w-0">
            {brand && storeSettings?.brand_settings?.show_on_product_card !== false && (
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedBrand(brand.id);
                  const el = document.getElementById('products-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className={`inline-flex items-center gap-1 ${
                  mobileViewMode === 'double'
                    ? 'text-[9px] sm:text-[10px] px-1.5 py-0.5'
                    : 'text-[10px] px-2 py-0.5'
                } font-bold text-[#6F584A] bg-[#F4ECE2] hover:bg-[#E7D4BC] rounded-[8px] border border-[#E7D4BC] truncate transition-colors cursor-pointer shrink-0`}
                title={`تصفية حسب براند ${brand.name_ar}${brand.name_en ? ` (${brand.name_en})` : ''}`}
              >
                {/* Logo in 'both' or 'logo_only' */}
                {storeSettings?.brand_settings?.display_mode !== 'name_only' && brand.logo_path && (
                  <img
                    src={brand.logo_path}
                    alt={brand.name_ar}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full object-contain bg-white shrink-0 border border-[#E5D8C9]"
                  />
                )}
                {/* Name in 'both' or 'name_only' */}
                {storeSettings?.brand_settings?.display_mode !== 'logo_only' && (
                  <span className="truncate max-w-[60px] sm:max-w-none">{brand.name_ar}</span>
                )}
              </span>
            )}
            <span
              className={`${
                mobileViewMode === 'double' ? 'text-[10px] sm:text-[11px]' : 'text-[11px]'
              } font-semibold text-[#C6A36A] uppercase tracking-wider truncate`}
            >
              {category?.name_ar || 'مختارات ميني بازار'}
            </span>
          </div>

          <div
            className={`flex items-center gap-0.5 ${
              mobileViewMode === 'double' ? 'text-[10px] sm:text-[11px]' : 'text-[11px]'
            } text-[#8A7465] shrink-0`}
          >
            <Star
              className={`${
                mobileViewMode === 'double' ? 'w-3 h-3 sm:w-3.5 sm:h-3.5' : 'w-3.5 h-3.5'
              } fill-[#C6A36A] text-[#C6A36A]`}
            />
            <span className="font-bold text-[#2F2B28]">
              {(Number(product?.rating) || 5.0).toFixed(1)}
            </span>
            <span
              className={`${
                mobileViewMode === 'double' ? 'hidden min-[380px]:inline sm:inline' : 'inline'
              } text-[#7C736D]`}
            >
              ({product?.reviews_count || 0})
            </span>
          </div>
        </div>

        {/* Product Name (max 2 lines) */}
        <h3
          className={`font-bold text-[#2F2B28] font-heading group-hover:text-[#6F584A] transition-colors line-clamp-2 leading-snug break-words mb-1 ${
            mobileViewMode === 'double'
              ? 'text-xs sm:text-base min-h-[2rem] sm:min-h-[2.75rem]'
              : 'text-sm sm:text-base min-h-[2.5rem] sm:min-h-[2.75rem]'
          }`}
        >
          {product?.name_ar || product?.name_en || 'منتج ميني بازار'}
        </h3>

        {/* Color Swatches Picker */}
        {safeVariants.length > 1 && (
          <div className="mb-2 flex items-center gap-1.5 flex-wrap">
            <span
              className={`${
                mobileViewMode === 'double' ? 'text-[10px] sm:text-[11px]' : 'text-[11px]'
              } text-[#8A7465] font-medium shrink-0`}
            >
              اللون:
            </span>
            <div className="flex items-center gap-1 flex-wrap">
              {(mobileViewMode === 'double' ? safeVariants.slice(0, 3) : safeVariants).map((v) => {
                const isSelected = selectedVariantId === v.id;
                const vName = v.name_ar || v.name_en || '';
                const swatchBg =
                  v.color_code ||
                  (vName.includes('ذهب') || vName.includes('ذهبي')
                    ? '#D4AF37'
                    : vName.includes('روز')
                    ? '#B76E79'
                    : vName.includes('أسود')
                    ? '#222222'
                    : vName.includes('عسلي')
                    ? '#C58F49'
                    : vName.includes('بيج') || vName.includes('عاجي')
                    ? '#E6D7C3'
                    : '#8A7465');

                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={(e) => handleVariantSelect(e, v.id)}
                    title={`${vName} — ${v.price || activePrice} ر.س`}
                    aria-label={vName}
                    className={`relative ${
                      mobileViewMode === 'double' ? 'w-4 h-4 sm:w-5 sm:h-5' : 'w-5 h-5'
                    } rounded-full transition-all duration-200 shrink-0 cursor-pointer ${
                      isSelected
                        ? 'ring-2 ring-[#C6A36A] ring-offset-1 ring-offset-white scale-110 shadow-xs'
                        : 'hover:scale-105 opacity-80 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: swatchBg }}
                  >
                    <span className="sr-only">{vName}</span>
                    <span className="absolute inset-0 rounded-full border border-black/20 pointer-events-none" />
                  </button>
                );
              })}
              {mobileViewMode === 'double' && safeVariants.length > 3 && (
                <span className="text-[9px] text-[#8A7465] font-bold">
                  +{safeVariants.length - 3}
                </span>
              )}
            </div>
            {activeVariant && (
              <span
                className={`${
                  mobileViewMode === 'double' ? 'hidden sm:inline-block' : 'inline-block'
                } text-[11px] text-[#5F5751] font-semibold truncate max-w-[120px]`}
              >
                {activeVariant.name_ar || activeVariant.name_en}
              </span>
            )}
          </div>
        )}

        {/* Short description - hidden on mobile in double mode */}
        <p
          className={`text-xs text-[#7C736D] line-clamp-1 mb-2 ${
            mobileViewMode === 'double' ? 'hidden sm:block' : 'block'
          }`}
        >
          {product?.short_description_ar || product?.description_ar || ''}
        </p>

        {/* Price Row */}
        <div
          className={`mt-auto ${
            mobileViewMode === 'double' ? 'pt-1.5 sm:pt-2.5' : 'pt-2.5'
          } border-t border-[#F4ECE2] flex items-baseline justify-between gap-1`}
        >
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span
              className={`${
                mobileViewMode === 'double'
                  ? 'text-xs min-[360px]:text-sm sm:text-xl'
                  : 'text-lg sm:text-xl'
              } font-bold text-[#2F2B28] font-heading`}
              dir="ltr"
            >
              {activePrice}{' '}
              <span
                className={`${
                  mobileViewMode === 'double' ? 'text-[9px] sm:text-xs' : 'text-xs'
                } font-medium text-[#8A7465]`}
              >
                ر.س
              </span>
            </span>
            {activeComparePrice && activeComparePrice > activePrice && (
              <span
                className={`${
                  mobileViewMode === 'double'
                    ? 'text-[9px] min-[360px]:text-[10px] sm:text-xs'
                    : 'text-xs'
                } text-[#7C736D] line-through`}
                dir="ltr"
              >
                {activeComparePrice} ر.س
              </span>
            )}
          </div>

          <div
            className={`${
              mobileViewMode === 'double' ? 'text-[9px] sm:text-[11px]' : 'text-[11px]'
            } font-medium flex items-center gap-0.5 shrink-0`}
          >
            {isAvailable ? (
              <span className="text-[#607866] flex items-center gap-0.5">
                <Check className="w-3 h-3" />
                <span>متوفر</span>
              </span>
            ) : (
              <span className="text-[#B4574A] flex items-center gap-0.5">
                <AlertCircle className="w-3 h-3" />
                <span>طلب مسبق</span>
              </span>
            )}
          </div>
        </div>

        {/* 3. Bottom Action Button */}
        <div
          className={mobileViewMode === 'double' ? 'mt-2 sm:mt-3' : 'mt-3'}
          onClick={(e) => e.stopPropagation()}
        >
          {isAvailable ? (
            <button
              type="button"
              onClick={handleAddToCartClick}
              className={`w-full flex items-center justify-center gap-1 sm:gap-2 ${
                mobileViewMode === 'double'
                  ? 'py-2 sm:py-2.5 px-1.5 sm:px-4 rounded-[10px] sm:rounded-[14px] text-[11px] sm:text-xs'
                  : 'py-2.5 px-4 rounded-[14px] text-xs'
              } font-bold transition-all duration-200 shadow-2xs group/btn active:scale-98 border border-[#4A3E37] cursor-pointer ${
                justAdded
                  ? 'bg-[#3F5042] text-white'
                  : 'bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8]'
              }`}
            >
              {justAdded ? (
                <>
                  <Check
                    className={`${
                      mobileViewMode === 'double' ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-4 h-4'
                    } text-[#C6A36A]`}
                  />
                  <span>
                    {mobileViewMode === 'double' ? 'تمت الإضافة ✓' : 'تمت الإضافة للسلة بنجاح ✓'}
                  </span>
                </>
              ) : (
                <>
                  <ShoppingBag
                    className={`${
                      mobileViewMode === 'double' ? 'w-3.5 h-3.5 sm:w-4 sm:h-4' : 'w-4 h-4'
                    } text-[#C6A36A] group-hover/btn:scale-110 transition-transform`}
                  />
                  <span>
                    {mobileViewMode === 'double' ? 'أضف للسلة' : 'أضف إلى السلة'}
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleWhatsAppInquiry}
              className={`w-full flex items-center justify-center gap-1.5 ${
                mobileViewMode === 'double'
                  ? 'py-2 sm:py-2.5 px-1.5 sm:px-4 rounded-[10px] sm:rounded-[14px] text-[10px] sm:text-xs'
                  : 'py-2.5 px-4 rounded-[14px] text-xs'
              } bg-[#F7F1E8] hover:bg-[#E7D4BC] text-[#8A7465] font-semibold border border-[#D9C1A7] transition-colors cursor-pointer`}
            >
              <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
              <span>{mobileViewMode === 'double' ? 'طلب واتساب' : 'تواصل عبر واتساب للتوفير'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
