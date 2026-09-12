import React, { useRef, useState } from 'react';
import { useStore } from '../context/StoreContext';
import { Sparkles, ChevronRight, ChevronLeft, Layers, Play, Pause } from 'lucide-react';
import { initialCategoryCarouselSettings } from '../data/initialData';
import { Category } from '../types';

export const CategoryBar: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory, products, storeSettings, isInitialLoading } = useStore();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isManualPaused, setIsManualPaused] = useState(false);

  const carouselSettings = storeSettings.category_carousel || initialCategoryCarouselSettings;

  const getProductCount = (catId: string) => {
    return products.filter((p) => p.category_id === catId && p.is_active).length;
  };

  if (isInitialLoading) {
    return (
      <div className="py-6 px-4 sm:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-12 w-28 sm:w-36 rounded-full bg-[#F4EDE3] border border-[#E7D9CA]/60 shrink-0 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // Filter active categories and sort by sort_order
  const activeCategories = categories
    .filter((c) => c.is_active)
    .sort((a, b) => a.sort_order - b.sort_order);

  // If no categories, return null
  if (activeCategories.length === 0) return null;

  // Duplicate active categories for seamless infinite looping (3 sets)
  const duplicatedCategories = [...activeCategories, ...activeCategories, ...activeCategories, ...activeCategories];

  // Manual scroll buttons handlers
  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = 320;
    scrollContainerRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  const isContinuous = carouselSettings.enabled && carouselSettings.autoplay && !isManualPaused;
  const isPaused = isManualPaused || (carouselSettings.pause_on_hover && isHovered);

  // Card Width per Style
  const getCardWidth = () => {
    switch (carouselSettings.card_style) {
      case 'circle':
        return 'w-[130px] sm:w-[155px]';
      case 'compact':
        return 'w-[145px] sm:w-[170px]';
      case 'minimal':
        return 'w-[170px] sm:w-[195px]';
      case 'overlay':
        return 'w-[175px] sm:w-[210px]';
      case 'glass':
      case 'luxury':
      default:
        return 'w-[185px] sm:w-[220px]';
    }
  };

  // Hover Effect Classes
  const getHoverClass = () => {
    switch (carouselSettings.hover_effect) {
      case 'lift':
        return 'hover:-translate-y-1.5 hover:shadow-lg';
      case 'glow':
        return 'hover:ring-2 hover:ring-[#C6A36A]/60 hover:shadow-[0_10px_30px_rgba(198,163,106,0.22)]';
      case 'subtle':
        return 'hover:opacity-95';
      case 'zoom':
      default:
        return 'hover:scale-[1.03]';
    }
  };

  // Card Outer Style Classes
  const getCardClasses = (isSelected: boolean) => {
    const base = `group relative flex flex-col items-center shrink-0 transition-all text-center select-none cursor-pointer duration-300 ${getHoverClass()}`;

    switch (carouselSettings.card_style) {
      case 'overlay':
        return `${base} aspect-[4/5] rounded-[24px] overflow-hidden border ${
          isSelected
            ? 'ring-3 ring-[#C6A36A] border-[#C6A36A] shadow-lg scale-[1.03]'
            : 'border-[#E7D4BC] shadow-2xs hover:border-[#C6A36A]/70'
        }`;

      case 'circle':
        return `${base} p-2 rounded-[20px] ${
          isSelected
            ? 'bg-[#F4ECE2]/80 border border-[#C6A36A]/60 shadow-xs scale-[1.03]'
            : 'hover:bg-[#FBF8F3]'
        }`;

      case 'glass':
        return `${base} p-3.5 rounded-[22px] backdrop-blur-md border ${
          isSelected
            ? 'bg-white/95 border-[#C6A36A] ring-2 ring-[#C6A36A]/50 shadow-md scale-[1.02]'
            : 'bg-white/75 hover:bg-white/95 border-white/80 shadow-2xs hover:shadow-md hover:border-[#C6A36A]/40'
        }`;

      case 'minimal':
        return `${base} p-3 rounded-[16px] border ${
          isSelected
            ? 'bg-[#F4ECE2] border-[#2F2B28] ring-1 ring-[#2F2B28] shadow-xs scale-[1.02]'
            : 'bg-white hover:bg-[#FBF8F3] border-[#E5D8C9] hover:border-[#2F2B28]'
        }`;

      case 'compact':
        return `${base} p-2.5 rounded-[18px] border ${
          isSelected
            ? 'bg-[#F4ECE2] border-[#C6A36A] ring-1 ring-[#C6A36A] shadow-xs scale-[1.02]'
            : 'bg-white hover:bg-[#FBF8F3] border-[#E7D4BC] hover:border-[#C6A36A]/50'
        }`;

      case 'luxury':
      default:
        return `${base} p-3.5 rounded-[24px] border ${
          isSelected
            ? 'bg-gradient-to-b from-[#F4ECE2] to-[#EAE0D3] border-[#C6A36A] ring-2 ring-[#C6A36A]/50 shadow-md scale-[1.02]'
            : 'bg-white hover:bg-[#FBF8F3] border-[#E7D4BC] shadow-2xs hover:shadow-xs hover:border-[#C6A36A]/40'
        }`;
    }
  };

  // Render Card Internal Content per Style
  const renderCardContent = (cat: Category, isSelected: boolean) => {
    const count = getProductCount(cat.id);
    const showIndicator = carouselSettings.show_active_indicator !== false;

    // 1. OVERLAY FULL-BLEED STYLE
    if (carouselSettings.card_style === 'overlay') {
      return (
        <div className="relative w-full h-full">
          <img
            src={cat.image_path}
            alt={cat.name_ar}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
            loading="lazy"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />

          {/* Active Check */}
          {isSelected && showIndicator && (
            <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#C6A36A] text-white flex items-center justify-center shadow-md">
              <span className="text-xs font-bold">✓</span>
            </div>
          )}

          {/* Item Count Top Badge */}
          {carouselSettings.show_item_count && (
            <span className="absolute top-2.5 left-2.5 text-[10px] font-bold text-white bg-black/50 backdrop-blur-xs px-2.5 py-0.5 rounded-full border border-white/20">
              {count} قطع
            </span>
          )}

          {/* Bottom Floating Title */}
          <div className="absolute bottom-0 inset-x-0 p-3 text-right">
            <span className="text-xs sm:text-sm font-bold text-white font-heading block truncate drop-shadow-xs">
              {cat.name_ar}
            </span>
            {carouselSettings.show_description && cat.description_ar && (
              <span className="text-[10px] text-white/80 line-clamp-1 mt-0.5">
                {cat.description_ar}
              </span>
            )}
          </div>
        </div>
      );
    }

    // 2. CIRCULAR STORY RING STYLE
    if (carouselSettings.card_style === 'circle') {
      return (
        <>
          <div
            className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full p-[3px] transition-all duration-500 mb-2 relative shrink-0 ${
              isSelected
                ? 'bg-gradient-to-tr from-[#C6A36A] to-[#2F2B28] shadow-md ring-2 ring-[#C6A36A]/50'
                : 'bg-gradient-to-tr from-[#C6A36A] via-[#E7D4BC] to-[#6F584A] shadow-2xs group-hover:scale-105'
            }`}
          >
            <div className="w-full h-full rounded-full overflow-hidden bg-white p-0.5">
              <img
                src={cat.image_path}
                alt={cat.name_ar}
                className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-700"
                loading="lazy"
                draggable={false}
              />
            </div>

            {/* Active Check Indicator */}
            {isSelected && showIndicator && (
              <div className="absolute top-0 right-0 w-5 h-5 rounded-full bg-[#C6A36A] text-white flex items-center justify-center shadow-xs text-[10px] font-bold">
                ✓
              </div>
            )}
          </div>

          <span
            className={`text-xs font-bold transition-colors font-heading truncate w-full ${
              isSelected ? 'text-[#6F584A]' : 'text-[#2F2B28] group-hover:text-[#6F584A]'
            }`}
          >
            {cat.name_ar}
          </span>

          {carouselSettings.show_item_count && (
            <span className="text-[10px] font-semibold text-[#8A7465] mt-0.5 bg-[#F4ECE2] px-2 py-0.5 rounded-full">
              {count} قطع
            </span>
          )}
        </>
      );
    }

    // 3. COMPACT STYLE (Slightly shallower aspect ratio)
    if (carouselSettings.card_style === 'compact') {
      return (
        <>
          <div className="relative w-full aspect-[5/4] rounded-[14px] overflow-hidden mb-2 bg-[#F4ECE2] shadow-2xs">
            <img
              src={cat.image_path}
              alt={cat.name_ar}
              className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
              loading="lazy"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-transparent opacity-80" />

            {isSelected && showIndicator && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#C6A36A] text-white flex items-center justify-center shadow-xs text-[10px] font-bold">
                ✓
              </div>
            )}

            {carouselSettings.show_item_count && (
              <span className="absolute bottom-1.5 right-1.5 text-[9px] font-bold text-white bg-black/50 backdrop-blur-xs px-2 py-0.2 rounded-full">
                {count}
              </span>
            )}
          </div>

          <span
            className={`text-xs font-bold transition-colors font-heading truncate w-full ${
              isSelected ? 'text-[#6F584A]' : 'text-[#2F2B28] group-hover:text-[#6F584A]'
            }`}
          >
            {cat.name_ar}
          </span>
        </>
      );
    }

    // 4. MINIMAL STYLE
    if (carouselSettings.card_style === 'minimal') {
      return (
        <>
          <div className="relative w-full aspect-1/1 rounded-[12px] overflow-hidden mb-2.5 bg-[#F4ECE2]">
            <img
              src={cat.image_path}
              alt={cat.name_ar}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              draggable={false}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />

            {isSelected && showIndicator && (
              <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#2F2B28] text-white flex items-center justify-center text-[10px] font-bold">
                ✓
              </div>
            )}

            {carouselSettings.show_item_count && (
              <span className="absolute bottom-2 right-2 text-[9px] font-mono font-bold text-white bg-[#2F2B28]/80 px-2 py-0.5 rounded-[6px]">
                {count} مقتنيات
              </span>
            )}
          </div>

          <span
            className={`text-xs sm:text-sm font-bold transition-colors font-heading truncate w-full ${
              isSelected ? 'text-[#2F2B28] underline underline-offset-4' : 'text-[#2F2B28]'
            }`}
          >
            {cat.name_ar}
          </span>

          {carouselSettings.show_description && cat.description_ar && (
            <span className="text-[10px] text-[#7C736D] line-clamp-1 mt-0.5 px-1">
              {cat.description_ar}
            </span>
          )}
        </>
      );
    }

    // 5. GLASS & LUXURY (Standard Square with refined badge and typography)
    return (
      <>
        <div
          className={`relative w-full aspect-1/1 overflow-hidden mb-2.5 bg-[#F4ECE2] shadow-2xs ${
            carouselSettings.card_style === 'glass' ? 'rounded-[16px]' : 'rounded-[18px]'
          }`}
        >
          <img
            src={cat.image_path}
            alt={cat.name_ar}
            className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
            loading="lazy"
            draggable={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

          {/* Active Check Indicator */}
          {isSelected && showIndicator && (
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#C6A36A] text-white flex items-center justify-center shadow-sm">
              <span className="text-xs font-bold">✓</span>
            </div>
          )}

          {/* Product count badge */}
          {carouselSettings.show_item_count && (
            <span
              className={`absolute bottom-2 right-2 text-[10px] font-bold text-white px-2.5 py-0.5 rounded-full border ${
                carouselSettings.card_style === 'glass'
                  ? 'bg-black/35 backdrop-blur-md border-white/30'
                  : 'bg-black/50 backdrop-blur-xs border-white/20'
              }`}
            >
              {count} قطع
            </span>
          )}
        </div>

        {/* Title & Description */}
        <span
          className={`text-xs sm:text-sm font-bold transition-colors font-heading truncate w-full ${
            isSelected ? 'text-[#6F584A]' : 'text-[#2F2B28] group-hover:text-[#6F584A]'
          }`}
        >
          {cat.name_ar}
        </span>

        {carouselSettings.show_description && cat.description_ar && (
          <span className="text-[10px] sm:text-[11px] text-[#7C736D] line-clamp-1 mt-0.5 px-1">
            {cat.description_ar}
          </span>
        )}
      </>
    );
  };

  return (
    <section id="categories-section" className="py-10 sm:py-14 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-7">
          <div className="text-right">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C6A36A] mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{carouselSettings.badge_text_ar || 'مجموعات مختارة بعناية'}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#2F2B28] font-heading flex items-center gap-2.5">
              <span>{carouselSettings.title_ar || 'تصنيفات ميني بازار الفاخرة'}</span>
              {selectedCategory && (
                <span className="text-xs font-normal text-[#8A7465] px-2.5 py-1 bg-[#F4ECE2] rounded-full border border-[#D9C1A7]">
                  مصفى حسب القسم
                </span>
              )}
            </h2>
          </div>

          {/* Action Tools & Navigation Controls */}
          <div className="flex items-center gap-2.5 self-end sm:self-auto">
            {/* Play/Pause Motion Toggle */}
            {carouselSettings.enabled && carouselSettings.autoplay && (
              <button
                type="button"
                onClick={() => setIsManualPaused(!isManualPaused)}
                className="p-2 rounded-full bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#6F584A] text-xs transition-colors border border-[#D9C1A7]"
                title={isManualPaused ? 'تشغيل الحركة التلقائية' : 'إيقاف مؤقت للحركة'}
                aria-label={isManualPaused ? 'تشغيل الحركة' : 'إيقاف الحركة'}
              >
                {isManualPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Manual Arrows Navigation */}
            {carouselSettings.show_arrows && carouselSettings.enabled && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleScroll('right')}
                  className="p-2 rounded-full bg-white hover:bg-[#F4ECE2] text-[#2F2B28] border border-[#D9C1A7] shadow-2xs hover:shadow-xs transition-all active:scale-95"
                  title="السابق"
                  aria-label="السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleScroll('left')}
                  className="p-2 rounded-full bg-white hover:bg-[#F4ECE2] text-[#2F2B28] border border-[#D9C1A7] shadow-2xs hover:shadow-xs transition-all active:scale-95"
                  title="التالي"
                  aria-label="التالي"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* View All Categories Button */}
            {carouselSettings.show_view_all_button && (
              <button
                onClick={() => setSelectedCategory(null)}
                className={`text-xs font-semibold px-4 py-2 rounded-full border transition-all ${
                  selectedCategory === null
                    ? 'bg-[#2F2B28] text-white border-[#2F2B28] shadow-xs'
                    : 'bg-[#F4ECE2] text-[#2F2B28] border-[#D9C1A7] hover:bg-[#E7D4BC]'
                }`}
              >
                عرض الكل ({products.length})
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CONTINUOUS CAROUSEL MODE */}
      {carouselSettings.enabled ? (
        <div
          className="relative w-full overflow-hidden py-2"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Subtle Left & Right Gradient Shadows for Seamless Blending */}
          {carouselSettings.show_gradient_fade && (
            <>
              <div className="absolute top-0 right-0 bottom-0 w-12 sm:w-28 bg-gradient-to-l from-[#FBF8F3] to-transparent z-10 pointer-events-none" />
              <div className="absolute top-0 left-0 bottom-0 w-12 sm:w-28 bg-gradient-to-r from-[#FBF8F3] to-transparent z-10 pointer-events-none" />
            </>
          )}

          {/* Continuous Running Track */}
          <div
            ref={scrollContainerRef}
            className={`flex items-center gap-4 px-4 sm:px-8 overflow-x-auto no-scrollbar py-2 ${
              isContinuous
                ? carouselSettings.direction === 'ltr'
                  ? 'category-marquee-ltr'
                  : 'category-marquee-rtl'
                : ''
            } ${isPaused ? 'category-marquee-paused' : ''}`}
            style={
              {
                '--carousel-duration': `${carouselSettings.speed || 28}s`,
                width: isContinuous ? 'max-content' : '100%',
              } as React.CSSProperties
            }
          >
            {(isContinuous ? duplicatedCategories : activeCategories).map((cat, idx) => {
              const isSelected = selectedCategory === cat.id;
              const cardWidth = getCardWidth();

              return (
                <div
                  key={`${cat.id}-${idx}`}
                  onClick={() => {
                    setSelectedCategory(isSelected ? null : cat.id);
                    // Smooth scroll to products section
                    const el = document.getElementById('products-section');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    }
                  }}
                  className={`${cardWidth} ${getCardClasses(isSelected)}`}
                >
                  {renderCardContent(cat, isSelected)}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* STATIC GRID FALLBACK MODE (If Carousel is Disabled in Admin) */
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {activeCategories.map((cat) => {
              const isSelected = selectedCategory === cat.id;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                  className={`w-full ${getCardClasses(isSelected)}`}
                >
                  {renderCardContent(cat, isSelected)}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
};
