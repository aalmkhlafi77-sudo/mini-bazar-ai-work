import React, { useState, useEffect } from 'react';
import { useStore } from '../context/StoreContext';
import { ProductCard } from './ProductCard';
import {
  Sparkles,
  SlidersHorizontal,
  PackageSearch,
  Award,
  X,
  AlertCircle,
  RefreshCw,
  Square,
  Grid2X2,
} from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const {
    products,
    selectedCategory,
    setSelectedCategory,
    selectedBrand,
    setSelectedBrand,
    brands,
    categories,
    searchQuery,
    setSearchQuery,
    storeSettings,
    isInitialLoading,
    initialSyncError,
  } = useStore();

  const [filterType, setFilterType] = useState<'all' | 'best_seller' | 'new'>('all');

  // Mobile View Switcher State ('double' by default on mobile, persistent in localStorage)
  const [mobileViewMode, setMobileViewMode] = useState<'single' | 'double'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('mb_mobile_view_mode');
        if (saved === 'single' || saved === 'double') {
          return saved;
        }
        if (window.innerWidth < 340) {
          return 'single';
        }
      } catch {
        // ignore localStorage access errors
      }
    }
    return 'double'; // Default on mobile is 2 products per row
  });

  const handleMobileViewChange = (mode: 'single' | 'double') => {
    setMobileViewMode(mode);
    try {
      localStorage.setItem('mb_mobile_view_mode', mode);
    } catch (e) {
      console.error('Failed to save mobile view preference:', e);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      try {
        const saved = localStorage.getItem('mb_mobile_view_mode');
        if (window.innerWidth < 340 && !saved) {
          setMobileViewMode('single');
        }
      } catch {}
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeCategoryObj = categories.find((c) => c.id === selectedCategory);
  const activeBrandObj = brands.find((b) => b.id === selectedBrand);

  const brandSettings = storeSettings?.brand_settings || {
    display_mode: 'both',
    logo_size: 'medium',
    show_product_count: true,
    show_on_product_card: true,
    show_in_product_modal: true,
    show_filter_bar: true,
    filter_title_ar: 'تصفية بحسب العلامة التجارية (البراند):',
  };

  const displayMode = brandSettings.display_mode || 'both';
  const logoSize = brandSettings.logo_size || 'medium';
  const showProductCount = brandSettings.show_product_count !== false;
  const showFilterBar = brandSettings.show_filter_bar !== false;

  // Active brands for filter chips
  const activeBrands = brands
    .filter((b) => b.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Logo dimension classes
  const getLogoImgClass = () => {
    switch (logoSize) {
      case 'small':
        return 'w-6 h-6 rounded-[8px]';
      case 'large':
        return 'w-11 h-11 rounded-[14px]';
      case 'medium':
      default:
        return 'w-8 h-8 sm:w-9 sm:h-9 rounded-[10px]';
    }
  };

  // Filter products by active category, active brand, search query, and filter tag
  const filteredProducts = products.filter((p) => {
    if (!p.is_active) return false;
    if (selectedCategory && p.category_id !== selectedCategory) return false;
    if (selectedBrand && p.brand_id !== selectedBrand) return false;
    if (filterType === 'best_seller' && !p.is_best_seller) return false;
    if (filterType === 'new' && !p.is_new) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNameAr = p.name_ar.toLowerCase().includes(q);
      const matchNameEn = p.name_en.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchDesc = p.description_ar.toLowerCase().includes(q);
      const brandObj = brands.find((b) => b.id === p.brand_id);
      const matchBrandAr = brandObj ? brandObj.name_ar.toLowerCase().includes(q) : false;
      const matchBrandEn = brandObj ? brandObj.name_en.toLowerCase().includes(q) : false;
      return matchNameAr || matchNameEn || matchSku || matchDesc || matchBrandAr || matchBrandEn;
    }

    return true;
  });

  if (isInitialLoading) {
    return (
      <section id="products-section" className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div className="space-y-2">
            <div className="w-24 h-4 bg-[#EFE6DA] rounded-full animate-pulse" />
            <div className="w-56 h-8 bg-[#E7D9CA] rounded-xl animate-pulse" />
          </div>
          <div className="w-48 h-10 bg-[#EFE6DA] rounded-xl animate-pulse" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="rounded-[20px] bg-white border border-[#E5D8C9] p-4 space-y-4 animate-pulse"
            >
              <div className="w-full aspect-square bg-[#F4EDE3] rounded-[16px]" />
              <div className="space-y-2 pt-2">
                <div className="w-3/4 h-5 bg-[#EFE6DA] rounded-md" />
                <div className="w-1/2 h-4 bg-[#F4EDE3] rounded-md" />
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="w-20 h-6 bg-[#E7D9CA] rounded-md" />
                <div className="w-10 h-10 bg-[#F4EDE3] rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  // Display clear Arabic error state if initial Firestore sync failed and no products are present
  if (initialSyncError && products.length === 0) {
    return (
      <section id="products-section" className="py-16 px-4 sm:px-8 max-w-xl mx-auto text-center" dir="rtl">
        <div className="bg-[#FAF5EE] border border-[#E7D4BC] rounded-[24px] p-8 sm:p-10 space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#FCE8E6] text-[#D93025] flex items-center justify-center mx-auto mb-2">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-[#2F2B28] font-heading">
            تعذر الاتصال بقاعدة البيانات
          </h3>
          <p className="text-xs sm:text-sm text-[#7C736D] leading-relaxed max-w-md mx-auto">
            {initialSyncError}
          </p>
          <div className="pt-2">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[14px] bg-[#2F2B28] hover:bg-[#231F1D] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>إعادة المحاولة</span>
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="products-section" className="py-12 px-4 sm:px-8 max-w-7xl mx-auto">
      {/* Arabic Error banner if sync error occurred but some items exist */}
      {initialSyncError && (
        <div className="mb-6 p-4 rounded-[16px] bg-[#FCE8E6]/70 border border-[#F5C2BE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs sm:text-sm text-[#B3261E]" dir="rtl">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p>{initialSyncError}</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-white border border-[#F5C2BE] rounded-lg text-xs font-medium hover:bg-[#FFF8F7] transition-colors shrink-0 cursor-pointer"
          >
            إعادة المحاولة
          </button>
        </div>
      )}

      {/* Header and Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div className="text-right">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C6A36A] mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>مختارات استثنائية</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-[#2F2B28] font-heading flex items-center gap-2">
            <span>
              {activeBrandObj
                ? `معروضات ${activeBrandObj.name_ar}`
                : activeCategoryObj
                ? activeCategoryObj.name_ar
                : 'كتالوج المنتجات المختارة'}
            </span>
          </h2>

          {(activeBrandObj || activeCategoryObj) && (
            <p className="text-sm text-[#7C736D] mt-1 max-w-2xl">
              {activeBrandObj?.description_ar || activeCategoryObj?.description_ar}
            </p>
          )}
        </div>

        {/* Filter Pills and Mobile View Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Mobile View Mode Switcher (Visible on mobile screens < sm) */}
          <div
            id="mobile-view-mode-selector"
            className="sm:hidden flex items-center justify-between gap-2 p-1.5 bg-[#F4ECE2]/90 rounded-[16px] border border-[#E7D4BC] self-stretch shadow-2xs"
          >
            <span className="text-xs font-bold text-[#6F584A] px-2 flex items-center gap-1.5">
              <span>طريقة العرض:</span>
            </span>
            <div className="flex items-center gap-1 bg-[#EBE0D2]/60 p-0.5 rounded-[12px]">
              <button
                type="button"
                id="view-mode-single-btn"
                onClick={() => handleMobileViewChange('single')}
                aria-label="عرض منتج واحد في الصف"
                aria-pressed={mobileViewMode === 'single'}
                title="عرض منتج واحد"
                className={`min-w-[40px] min-h-[40px] px-3 flex items-center justify-center gap-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                  mobileViewMode === 'single'
                    ? 'bg-[#2F2B28] text-[#F5E9D8] shadow-2xs border border-[#4A3E37]'
                    : 'text-[#6F584A] hover:text-[#2F2B28] hover:bg-white/50'
                }`}
              >
                <Square className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">منتج واحد</span>
              </button>

              <button
                type="button"
                id="view-mode-double-btn"
                onClick={() => handleMobileViewChange('double')}
                aria-label="عرض منتجان في الصف"
                aria-pressed={mobileViewMode === 'double'}
                title="عرض منتجان"
                className={`min-w-[40px] min-h-[40px] px-3 flex items-center justify-center gap-1.5 rounded-[10px] text-xs font-bold transition-all cursor-pointer ${
                  mobileViewMode === 'double'
                    ? 'bg-[#2F2B28] text-[#F5E9D8] shadow-2xs border border-[#4A3E37]'
                    : 'text-[#6F584A] hover:text-[#2F2B28] hover:bg-white/50'
                }`}
              >
                <Grid2X2 className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">منتجان</span>
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#2F2B28] text-white shadow-2xs border border-[#4A3E37]'
                  : 'bg-[#F4ECE2] text-[#2F2B28] hover:bg-[#E7D4BC]'
              }`}
            >
              جميع المعروضات ({filteredProducts.length})
            </button>

            <button
              onClick={() => setFilterType('best_seller')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'best_seller'
                  ? 'bg-[#2F2B28] text-white shadow-2xs border border-[#4A3E37]'
                  : 'bg-[#F4ECE2] text-[#2F2B28] hover:bg-[#E7D4BC]'
              }`}
            >
              الأكثر طلباً
            </button>

            <button
              onClick={() => setFilterType('new')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'new'
                  ? 'bg-[#2F2B28] text-white shadow-2xs border border-[#4A3E37]'
                  : 'bg-[#F4ECE2] text-[#2F2B28] hover:bg-[#E7D4BC]'
              }`}
            >
              وصل حديثاً
            </button>
          </div>
        </div>
      </div>

      {/* Brand Filters Bar */}
      {showFilterBar && activeBrands.length > 0 && (
        <div className="mb-8 p-4 bg-[#FBF8F3] rounded-[24px] border border-[#E7D4BC] shadow-2xs">
          <div className="flex items-center justify-between gap-3 mb-3 px-1">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-[#6F584A]">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-[#C6A36A]" />
              <span>{brandSettings.filter_title_ar || 'تصفية بحسب العلامة التجارية (البراند):'}</span>
            </div>

            {(selectedBrand || selectedCategory) && (
              <button
                onClick={() => {
                  setSelectedBrand(null);
                  setSelectedCategory(null);
                }}
                className="text-[11px] sm:text-xs text-[#B4574A] hover:underline flex items-center gap-1 font-semibold"
              >
                <X className="w-3.5 h-3.5" />
                <span>إلغاء الفلاتر</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pt-0.5 scrollbar-thin">
            {/* All Brands Button */}
            <button
              onClick={() => setSelectedBrand(null)}
              className={`flex items-center gap-2 px-4 py-2 rounded-[14px] text-xs font-bold transition-all shrink-0 border ${
                selectedBrand === null
                  ? 'bg-[#2F2B28] text-white border-[#2F2B28] shadow-sm'
                  : 'bg-white text-[#5F5751] hover:bg-[#F4ECE2] border-[#E5D8C9]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#C6A36A]"></span>
              <span>كافة البراندات</span>
            </button>

            {/* Individual Brand Buttons */}
            {activeBrands.map((brand) => {
              const isSelected = selectedBrand === brand.id;
              const brandProductCount = products.filter(
                (p) =>
                  p.is_active &&
                  p.brand_id === brand.id &&
                  (!selectedCategory || p.category_id === selectedCategory)
              ).length;

              return (
                <button
                  key={brand.id}
                  onClick={() => setSelectedBrand(isSelected ? null : brand.id)}
                  title={`${brand.name_ar}${brand.name_en ? ` (${brand.name_en})` : ''} - ${brandProductCount} منتج`}
                  className={`group relative flex items-center gap-2.5 transition-all shrink-0 border ${
                    displayMode === 'logo_only'
                      ? 'p-2 rounded-[16px]'
                      : 'px-3.5 py-2 rounded-[14px]'
                  } ${
                    isSelected
                      ? 'bg-[#2F2B28] text-white border-[#2F2B28] shadow-sm ring-2 ring-[#C6A36A]/40'
                      : 'bg-white text-[#2F2B28] hover:bg-[#F4ECE2] border-[#E5D8C9] hover:border-[#C6A36A]/50'
                  }`}
                >
                  {/* 1. Brand Logo (if in 'both' or 'logo_only' mode) */}
                  {displayMode !== 'name_only' && (
                    <div
                      className={`relative shrink-0 overflow-hidden bg-white rounded-[10px] border flex items-center justify-center ${
                        isSelected ? 'border-[#C6A36A] shadow-2xs' : 'border-[#E5D8C9]'
                      } ${
                        logoSize === 'large'
                          ? 'w-11 h-11 sm:w-12 sm:h-12'
                          : logoSize === 'small'
                          ? 'w-6 h-6'
                          : 'w-8 h-8 sm:w-9 sm:h-9'
                      }`}
                    >
                      {brand.logo_path ? (
                        <img
                          src={brand.logo_path}
                          alt={brand.name_ar}
                          className="w-full h-full object-contain p-0.5"
                          loading="lazy"
                        />
                      ) : (
                        <span className="font-bold text-xs text-[#8A7465]">
                          {brand.name_ar.charAt(0)}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 2. Brand Name (if in 'both' or 'name_only' mode) */}
                  {displayMode !== 'logo_only' && (
                    <span className="text-xs font-bold leading-none tracking-tight">
                      {brand.name_ar}
                    </span>
                  )}

                  {/* 3. Product Count Badge */}
                  {showProductCount && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold leading-none shrink-0 ${
                        isSelected
                          ? 'bg-[#C6A36A] text-[#2F2B28]'
                          : 'bg-[#F4ECE2] text-[#6F584A]'
                      }`}
                    >
                      {brandProductCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid of Cards */}
      {filteredProducts.length > 0 ? (
        <div
          className={`grid ${
            mobileViewMode === 'single'
              ? 'grid-cols-1 gap-4'
              : 'grid-cols-2 gap-2.5 sm:gap-6'
          } sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`}
        >
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              mobileViewMode={mobileViewMode}
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        /* Empty Database State: When store has no products yet */
        <div className="text-center py-20 px-4 bg-[#F7F1E8]/50 rounded-[28px] border border-[#E7D4BC] my-8 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-[#F4ECE2] text-[#C6A36A] flex items-center justify-center mx-auto mb-4">
            <PackageSearch className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-[#2F2B28] mb-2 font-heading">
            لا توجد منتجات معروضة حالياً
          </h3>
          <p className="text-xs sm:text-sm text-[#7C736D] max-w-md mx-auto leading-relaxed">
            قائمة المنتجات فارغة حالياً. عند إضافة منتجات في المتجر ستظهر هنا مباشرة.
          </p>
        </div>
      ) : (
        /* Empty Filter State: When search/category filter yields no match */
        <div className="text-center py-16 px-4 bg-[#F7F1E8]/50 rounded-[28px] border border-[#E7D4BC] my-8">
          <div className="w-16 h-16 rounded-full bg-[#F4ECE2] text-[#C6A36A] flex items-center justify-center mx-auto mb-4">
            <PackageSearch className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-[#2F2B28] mb-2 font-heading">
            لم نتمكن من العثور على نتائج مطابقة
          </h3>
          <p className="text-xs text-[#7C736D] max-w-md mx-auto mb-6">
            جربي البحث بكلمات أخرى أو تصفحي أقسام المتجر المختلفة للوصول إلى المنتجات المرغوبة.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedBrand(null);
                setSearchQuery('');
                setFilterType('all');
              }}
              className="px-5 py-2.5 rounded-[14px] bg-[#2F2B28] hover:bg-[#231F1D] text-white text-xs font-semibold shadow-xs"
            >
              عرض كافة المعروضات
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
