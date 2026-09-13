import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, Sparkles, ArrowUpRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { HeroSlide } from '../types';
import { HeroParticles } from './HeroParticles';

export const HeroSeamlessCarousel: React.FC = () => {
  const { heroSlides, themeSettings, setActiveView, isInitialLoading } = useStore();
  const visibleSlides = heroSlides.filter((s) => s.is_visible);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<number>(1); // 1 = forward, -1 = backward
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const totalSlides = visibleSlides.length;

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    if (index === currentIndex || totalSlides <= 1) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Autoplay management with pause on hover/focus
  useEffect(() => {
    if (!themeSettings.carousel_autoplay || isPaused || totalSlides <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      nextSlide();
    }, themeSettings.carousel_interval || 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [nextSlide, isPaused, themeSettings.carousel_autoplay, themeSettings.carousel_interval, totalSlides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        nextSlide();
      } else if (e.key === 'ArrowRight') {
        prevSlide();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  if (isInitialLoading) {
    return (
      <section className="relative w-full max-w-7xl mx-auto px-4 sm:px-8 pt-4 pb-8">
        <div className="w-full min-h-[340px] sm:min-h-[420px] md:min-h-[480px] rounded-[24px] sm:rounded-[32px] bg-[#F5EFE6] border border-[#E7D4BC]/60 overflow-hidden relative animate-pulse flex flex-col justify-end p-6 sm:p-12">
          <div className="space-y-4 max-w-xl">
            <div className="w-32 h-4 bg-[#E7D9CA] rounded-full" />
            <div className="w-3/4 h-8 sm:h-10 bg-[#E7D9CA] rounded-xl" />
            <div className="w-1/2 h-4 sm:h-5 bg-[#E7D9CA] rounded-lg" />
            <div className="pt-2 flex gap-3">
              <div className="w-28 h-10 bg-[#DECDBD] rounded-xl" />
              <div className="w-24 h-10 bg-[#E7D9CA] rounded-xl" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (totalSlides === 0) return null;

  const slide: HeroSlide = visibleSlides[currentIndex] || visibleSlides[0];

  // Motion variants for smooth RTL-aware transition
  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '-100%' : '100%',
      opacity: 0,
      scale: 0.98,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 250, damping: 28 },
        opacity: { duration: 0.45 },
      },
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
      scale: 0.98,
      transition: {
        x: { type: 'spring' as const, stiffness: 250, damping: 28 },
        opacity: { duration: 0.35 },
      },
    }),
  };

  const handleCtaClick = (url: string) => {
    if (url.startsWith('#')) {
      const el = document.querySelector(url);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setActiveView('store');
    }
  };

  const isPulsingActive =
    themeSettings.hero_pulse_animation !== false && slide.pulse_animation !== false;

  const isFullWidthBanner = slide.layout_type === 'full_width_banner';

  const isFullBackground =
    !isFullWidthBanner &&
    (slide.layout_type === 'full_background' ||
      Boolean(slide.background_image && slide.layout_type !== 'split'));

  const fullBgImage = slide.background_image || (isFullBackground ? slide.desktop_image : undefined);

  // Overlay opacity calculation
  const overlayPercent = slide.overlay_opacity !== undefined ? slide.overlay_opacity : (isFullBackground ? 25 : 0);

  // Clarity, lighting, blur, contrast and zoom scale calculations
  const blurPx = slide.blur_amount !== undefined ? slide.blur_amount : (slide.background_blur ? 6 : 0);
  const brightnessVal = slide.brightness !== undefined ? slide.brightness : 100;
  const contrastVal = slide.contrast !== undefined ? slide.contrast : 100;
  const zoomScaleVal = slide.zoom_scale !== undefined ? slide.zoom_scale : 100;
  const showScrim = slide.show_scrim_gradient ?? (isFullBackground ? true : false);
  const showAmbientBlur = slide.ambient_blur_layer ?? false;

  const imageTransformStyle: React.CSSProperties = {
    filter: `blur(${blurPx}px) brightness(${brightnessVal}%) contrast(${contrastVal}%)`,
    transform: `scale(${zoomScaleVal / 100})`,
    transformOrigin: slide.image_position === 'top' ? 'top center' : slide.image_position === 'bottom' ? 'bottom center' : 'center center',
    transition: 'filter 0.3s ease, transform 0.3s ease',
  };

  // Banner border styling classes
  const bannerBorderStyle = slide.banner_border_style || 'subtle_card';
  const bannerBorderRadius = slide.banner_border_radius || 'lg';
  const bannerShadowStyle = slide.banner_shadow_style || 'deep';

  const getBorderRadiusClass = (radius: string = 'lg') => {
    switch (radius) {
      case 'none':
        return 'rounded-none';
      case 'sm':
        return 'rounded-[10px] sm:rounded-[12px]';
      case 'md':
        return 'rounded-[16px] sm:rounded-[18px]';
      case 'lg':
        return 'rounded-[20px] sm:rounded-[24px]';
      case 'pill':
        return 'rounded-[32px] sm:rounded-[40px]';
      default:
        return 'rounded-[20px] sm:rounded-[24px]';
    }
  };

  const getBorderStyleClass = (style: string = 'subtle_card') => {
    switch (style) {
      case 'none':
        return 'border-0 ring-0';
      case 'glass':
        return 'border-2 border-white/60 backdrop-blur-md ring-1 ring-white/30';
      case 'polished':
        return 'border-2 border-[#D9C1A7] ring-2 ring-[#C6A36A]/40 shadow-inner';
      case 'gold_luxury':
        return 'border-2 border-[#C6A36A] ring-1 ring-[#C6A36A]/20';
      case 'floating_glow':
        return 'border border-[#C6A36A]/60 shadow-[0_0_25px_rgba(198,163,106,0.35)]';
      case 'vintage_bevel':
        return 'border-4 border-[#F4ECE2] ring-2 ring-[#8A7465]/30';
      case 'subtle_card':
      default:
        return 'border-4 border-white';
    }
  };

  const getShadowClass = (shadow: string = 'deep') => {
    switch (shadow) {
      case 'none':
        return 'shadow-none';
      case 'soft':
        return 'shadow-md';
      case 'deep':
        return 'shadow-2xl';
      case 'golden_glow':
        return 'shadow-[0_15px_35px_rgba(198,163,106,0.3)]';
      default:
        return 'shadow-xl';
    }
  };

  // Focal position class for preventing top/head/title cropping on wide or full screens
  const imagePositionClass =
    slide.image_position === 'top'
      ? 'object-top'
      : slide.image_position === 'bottom'
      ? 'object-bottom'
      : slide.image_position === 'center'
      ? 'object-center'
      : slide.image_fit === 'full_width'
      ? 'object-top' // default for full_width to protect top headlines and artwork
      : 'object-center';

  // Dynamic responsive height keeping natural, comfortable banner scale
  const containerHeightClass = (() => {
    if (slide.desktop_height === 'compact') {
      return 'min-h-[380px] sm:min-h-[440px] lg:min-h-[480px]';
    }
    // Standard / Default (comfortable balanced height):
    return 'min-h-[440px] sm:min-h-[480px] lg:min-h-[520px]';
  })();

  return (
    <section
      className="relative w-full overflow-hidden bg-[#FBF8F3] border-b border-[#E5D8C9]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      aria-label="معرض ميني بازار الرئيسي"
    >
      {/* Floating Animated Particles Layer */}
      <HeroParticles
        effect={slide.particles_effect}
        density={slide.particles_density}
        speed={slide.particles_speed}
      />

      {/* Full-width Animated Background Canvas */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {/* Base background color/gradient */}
        <div
          className="absolute inset-0 w-full h-full transition-colors duration-700"
          style={{
            background: slide.background_value || '#FBF8F3',
          }}
        />

        {/* Full-width Image Background */}
        {fullBgImage && (
          <motion.div
            key={`hero-bg-${slide.id}`}
            initial={{ opacity: 0 }}
            animate={{
              opacity: 1,
              x: isPulsingActive ? [-15, 15, -15] : 0,
              scale: isPulsingActive ? [1.02, 1.05, 1.02] : 1,
            }}
            transition={{
              opacity: { duration: 0.6 },
              x: { duration: 20, repeat: Infinity, ease: 'easeInOut' },
              scale: { duration: 16, repeat: Infinity, ease: 'easeInOut' },
            }}
            className="absolute inset-0 w-full h-full overflow-hidden"
          >
            {/* Ambient Blurred Backdrop for widescreen full-bleed coverage - only if enabled */}
            {showAmbientBlur && (slide.image_fit === 'contain' || slide.image_fit === 'full_width') && fullBgImage && (
              <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                <picture className="w-full h-full">
                  {slide.mobile_image && <source media="(max-width: 640px)" srcSet={slide.mobile_image} />}
                  <img
                    src={fullBgImage}
                    alt=""
                    className="w-full h-full object-cover filter blur-3xl scale-120 opacity-40"
                  />
                </picture>
              </div>
            )}

            {/* Foreground Main Image with Precision Scaling, Lighting & Clarity */}
            {fullBgImage && (
              <picture className="relative w-full h-full block overflow-hidden">
                {slide.mobile_image && <source media="(max-width: 640px)" srcSet={slide.mobile_image} />}
                <img
                  src={fullBgImage}
                  alt=""
                  style={imageTransformStyle}
                  className={`w-full h-full ${
                    slide.image_fit === 'contain'
                      ? `object-contain ${imagePositionClass}`
                      : `object-cover ${imagePositionClass}`
                  }`}
                />
              </picture>
            )}

            {/* Smart Overlay for High Contrast and Pristine Readability */}
            {overlayPercent > 0 && (
              <div
                className="absolute inset-0 transition-opacity duration-500 pointer-events-none"
                style={{
                  backgroundColor: '#2F2B28',
                  opacity: overlayPercent / 100,
                }}
              />
            )}

            {/* Gradient Scrim for Split or Full backgrounds */}
            {showScrim && (
              isFullBackground ? (
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/35 to-transparent pointer-events-none" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-r from-[#FBF8F3]/90 via-[#FBF8F3]/60 to-[#FBF8F3]/90 pointer-events-none" />
              )
            )}
          </motion.div>
        )}

        {/* Ambient Pulsating Golden Glow Orbs */}
        {isPulsingActive && !isFullBackground && (
          <>
            <motion.div
              animate={{
                x: [-40, 40, -40],
                y: [-15, 15, -15],
                scale: [1, 1.18, 1],
                opacity: [0.25, 0.45, 0.25],
              }}
              transition={{
                duration: 14,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute top-1/4 right-1/4 w-80 sm:w-[28rem] h-80 sm:h-[28rem] rounded-full bg-gradient-to-br from-[#C6A36A]/20 to-[#E7D4BC]/10 filter blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{
                x: [40, -40, 40],
                y: [15, -15, 15],
                scale: [1.15, 0.95, 1.15],
                opacity: [0.2, 0.4, 0.2],
              }}
              transition={{
                duration: 16,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute bottom-1/4 left-1/4 w-80 sm:w-[32rem] h-80 sm:h-[32rem] rounded-full bg-gradient-to-tr from-[#6F584A]/15 to-[#D4AF37]/15 filter blur-3xl pointer-events-none"
            />
          </>
        )}
      </div>

      {/* Main Slides Carousel Container with Touch & Drag Support */}
      <div className={`relative ${containerHeightClass} w-full flex items-center z-10`}>
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={slide.id}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, { offset, velocity }) => {
              if (offset.x > 60 || velocity.x > 350) {
                prevSlide();
              } else if (offset.x < -60 || velocity.x < -350) {
                nextSlide();
              }
            }}
            className="absolute inset-0 w-full h-full flex items-center justify-center px-4 sm:px-12 lg:px-20 cursor-grab active:cursor-grabbing"
          >
            <div className="max-w-7xl w-full mx-auto py-4 sm:py-6 lg:py-8">
              {/* 1. Full Width Horizontal Panoramic Banner Mode */}
              {isFullWidthBanner ? (
                <div className="flex flex-col w-full py-1 sm:py-2">
                  <div className={`relative w-full aspect-[16/9] sm:aspect-[21/9] md:aspect-[24/9] ${getBorderRadiusClass(bannerBorderRadius)} overflow-hidden ${getShadowClass(bannerShadowStyle)} ${getBorderStyleClass(bannerBorderStyle)} group bg-[#2F2B28] flex items-center justify-center transition-all duration-300`}>
                    {/* Ambient Glow behind contain/full_width - only if enabled */}
                    {showAmbientBlur && (slide.image_fit === 'contain' || slide.image_fit === 'full_width') && (slide.desktop_image || fullBgImage) && (
                      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
                        <picture className="w-full h-full">
                          {slide.mobile_image && <source media="(max-width: 640px)" srcSet={slide.mobile_image} />}
                          <img
                            src={slide.desktop_image || fullBgImage}
                            alt=""
                            className="w-full h-full object-cover filter blur-2xl scale-110 opacity-30"
                          />
                        </picture>
                      </div>
                    )}
                    {(slide.desktop_image || fullBgImage) && (
                      <picture className="w-full h-full flex items-center justify-center overflow-hidden">
                        {slide.mobile_image && <source media="(max-width: 640px)" srcSet={slide.mobile_image} />}
                        <img
                          src={slide.desktop_image || fullBgImage}
                          alt={slide.title_ar}
                          style={imageTransformStyle}
                          className={`relative ${
                            slide.image_fit === 'contain'
                              ? 'max-w-full max-h-full w-auto h-auto object-contain object-center p-2 sm:p-4'
                              : `w-full h-full object-cover ${imagePositionClass}`
                          } select-none`}
                        />
                      </picture>
                    )}
                    {/* Atmospheric Scrim & Gradient - controlled */}
                    {showScrim && (
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent pointer-events-none" />
                    )}

                    {/* Integrated Horizontal Caption & CTA Bar */}
                    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-8 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-4 z-10">
                      <div className="max-w-2xl text-right">
                        {slide.badge_ar && (
                          <div
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] sm:text-xs font-semibold mb-1.5 shadow-md backdrop-blur-md"
                            style={{
                              backgroundColor: slide.badge_bg || '#2F2B28',
                              color: slide.badge_color || '#C6A36A',
                              borderColor: '#C6A36A',
                              borderWidth: '1px',
                            }}
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#C6A36A]" />
                            <span>{slide.badge_ar}</span>
                          </div>
                        )}
                        <h1
                          className="text-xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-[1.2] font-heading drop-shadow-md text-white mb-1.5"
                          style={{ color: slide.title_color || '#FFFFFF' }}
                        >
                          {slide.title_ar}
                        </h1>
                        <p
                          className="text-xs sm:text-sm md:text-base leading-relaxed text-[#F4ECE2] drop-shadow-sm font-medium line-clamp-2"
                          style={{ color: slide.description_color || '#F4ECE2' }}
                        >
                          {slide.description_ar}
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          onClick={() => handleCtaClick(slide.primary_button_url)}
                          style={{
                            backgroundColor: slide.button_bg || '#C6A36A',
                            color: slide.button_text_color || '#2F2B28',
                          }}
                          className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-[12px] font-bold text-xs sm:text-sm shadow-xl transition-all active:scale-95 border border-[#C6A36A] hover:brightness-110"
                        >
                          <span>{slide.primary_button_text}</span>
                          <ArrowUpRight className="w-4 h-4" />
                        </button>
                        {slide.secondary_button_text && (
                          <button
                            onClick={() => handleCtaClick(slide.secondary_button_url || '#')}
                            style={{
                              backgroundColor: slide.secondary_button_bg || 'rgba(0,0,0,0.45)',
                              color: slide.secondary_button_text_color || '#FFFFFF',
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2.5 sm:py-3 rounded-[12px] font-semibold text-xs sm:text-sm border border-white/40 backdrop-blur-md transition-all active:scale-95 hover:bg-white/20"
                          >
                            <span>{slide.secondary_button_text}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : isFullBackground ? (
                /* 2. Full Background Mode Layout with Frosted Luxury Backdrop Card */
                <div
                  className={`max-w-2xl text-right z-10 ${
                    slide.text_alignment === 'center'
                      ? 'mx-auto text-center flex flex-col items-center'
                      : 'ml-auto flex flex-col items-start'
                  } bg-black/40 backdrop-blur-md p-6 sm:p-8 rounded-[24px] border border-white/15 shadow-2xl`}
                >
                  {/* Badge */}
                  {slide.badge_ar && (
                    <div
                      className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-4 shadow-md backdrop-blur-md"
                      style={{
                        backgroundColor: slide.badge_bg || '#2F2B28',
                        color: slide.badge_color || '#C6A36A',
                        borderColor: '#C6A36A',
                        borderWidth: '1px',
                      }}
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#C6A36A]" />
                      <span>{slide.badge_ar}</span>
                    </div>
                  )}

                  {/* Main Heading */}
                  <h1
                    className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.2] font-heading mb-4 drop-shadow-md"
                    style={{
                      color: slide.title_color || '#FFFFFF',
                    }}
                  >
                    {slide.title_ar}
                  </h1>

                  {/* Subtitle / Description */}
                  <p
                    className="text-base sm:text-xl leading-relaxed mb-8 max-w-xl drop-shadow-sm font-medium"
                    style={{
                      color: slide.description_color || '#F5E9D8',
                    }}
                  >
                    {slide.description_ar}
                  </p>

                  {/* Call to Actions */}
                  <div
                    className={`flex flex-wrap items-center gap-3.5 ${
                      slide.text_alignment === 'center' ? 'justify-center' : ''
                    }`}
                  >
                    <button
                      onClick={() => handleCtaClick(slide.primary_button_url)}
                      style={{
                        backgroundColor: slide.button_bg || '#C6A36A',
                        color: slide.button_text_color || '#2F2B28',
                      }}
                      className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-[14px] font-bold text-sm shadow-xl transition-all active:scale-95 border border-[#C6A36A] group hover:brightness-110"
                    >
                      <span>{slide.primary_button_text}</span>
                      <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>

                    {slide.secondary_button_text && (
                      <button
                        onClick={() => handleCtaClick(slide.secondary_button_url || '#')}
                        style={{
                          backgroundColor: slide.secondary_button_bg || 'rgba(255,255,255,0.15)',
                          color: slide.secondary_button_text_color || '#FFFFFF',
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-[14px] font-semibold text-sm border border-white/40 backdrop-blur-md transition-all active:scale-95 hover:bg-white/25"
                      >
                        <span>{slide.secondary_button_text}</span>
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* 3. Split Layout Mode (Text + Visual Card) */
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
                  {/* Text Side (RTL Right side) */}
                  <div className="lg:col-span-6 flex flex-col items-start text-right z-10">
                    {/* Badge */}
                    {slide.badge_ar && (
                      <div
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 shadow-2xs transition-colors"
                        style={{
                          backgroundColor: slide.badge_bg || '#F4ECE2',
                          color: slide.badge_color || '#8A7465',
                          borderColor: '#D9C1A7',
                          borderWidth: '1px',
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#C6A36A]" />
                        <span>{slide.badge_ar}</span>
                      </div>
                    )}

                    {/* Main Heading */}
                    <h1
                      className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.25] font-heading mb-4 transition-colors"
                      style={{
                        color: slide.title_color || '#2F2B28',
                      }}
                    >
                      {slide.title_ar}
                    </h1>

                    {/* Subtitle / Description */}
                    <p
                      className="text-base sm:text-lg leading-relaxed max-w-xl mb-8 transition-colors"
                      style={{
                        color: slide.description_color || '#5F5751',
                      }}
                    >
                      {slide.description_ar}
                    </p>

                    {/* Call to Actions */}
                    <div className="flex flex-wrap items-center gap-3.5">
                      <button
                        onClick={() => handleCtaClick(slide.primary_button_url)}
                        style={{
                          backgroundColor: slide.button_bg || '#2F2B28',
                          color: slide.button_text_color || '#F5E9D8',
                        }}
                        className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-[14px] font-bold text-sm shadow-md transition-all active:scale-95 border border-[#4A3E37] group hover:brightness-110"
                      >
                        <span>{slide.primary_button_text}</span>
                        <ArrowUpRight className="w-4 h-4 text-[#C6A36A] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                      </button>

                      {slide.secondary_button_text && (
                        <button
                          onClick={() => handleCtaClick(slide.secondary_button_url || '#')}
                          style={{
                            backgroundColor: slide.secondary_button_bg || '#F4ECE2',
                            color: slide.secondary_button_text_color || '#6F584A',
                          }}
                          className="inline-flex items-center gap-2 px-5 py-3.5 rounded-[14px] font-semibold text-sm border border-[#D9C1A7] transition-all active:scale-95 hover:brightness-95"
                        >
                          <span>{slide.secondary_button_text}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Visual Showcase Side (Left side in RTL) */}
                  <div className="lg:col-span-6 relative flex justify-center items-center">
                    <div className={`relative w-full ${
                      slide.image_fit === 'full_width'
                        ? 'max-w-none aspect-[16/9] sm:aspect-[2/1]'
                        : 'max-w-[460px] aspect-[4/3] sm:aspect-[1/1]'
                    } ${getBorderRadiusClass(bannerBorderRadius)} overflow-hidden ${getShadowClass(bannerShadowStyle)} ${getBorderStyleClass(bannerBorderStyle)} ${
                      slide.image_fit === 'cover' || slide.image_fit === 'full_width'
                        ? 'bg-[#2F2B28]'
                        : 'bg-[#F4ECE2]/70 p-3 sm:p-5'
                    } flex items-center justify-center transition-all duration-300`}>
                      {slide.desktop_image && (
                        <picture className="w-full h-full flex items-center justify-center overflow-hidden">
                          {slide.mobile_image && <source media="(max-width: 640px)" srcSet={slide.mobile_image} />}
                          <img
                            src={slide.desktop_image}
                            alt={slide.title_ar}
                            style={imageTransformStyle}
                            className={`${
                              slide.image_fit === 'contain'
                                ? 'max-w-full max-h-full w-auto h-auto object-contain object-center'
                                : `w-full h-full object-cover ${imagePositionClass}`
                            } select-none`}
                            loading="eager"
                          />
                        </picture>
                      )}
                      {/* Subtle luxury gradient vignette for non-contained cards - only if scrim enabled */}
                      {showScrim && slide.image_fit !== 'contain' && (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent pointer-events-none" />
                      )}

                      {/* Micro floating luxury seal */}
                      <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md rounded-[14px] px-3 py-1.5 border border-[#E7D4BC] shadow-sm flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#C6A36A] animate-pulse" />
                        <span className="text-[11px] font-bold text-[#6F584A]">
                          مختارات حصرية أصلية 100%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Carousel Navigation Arrows (Right & Left Shift) */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={prevSlide}
              aria-label="إزاحة يمين - الشريحة السابقة"
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#6F584A] border border-[#E7D4BC] shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-[#2F2B28]" />
            </button>

            <button
              onClick={nextSlide}
              aria-label="إزاحة يسار - الشريحة التالية"
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 hover:bg-white text-[#6F584A] border border-[#E7D4BC] shadow-md flex items-center justify-center transition-all hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-[#2F2B28]" />
            </button>
          </>
        )}

        {/* Carousel Slide Indicators */}
        {totalSlides > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-white/70 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-[#E7D4BC] shadow-2xs">
            {visibleSlides.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => goToSlide(idx)}
                aria-label={`انتقال للشريحة ${idx + 1}`}
                className={`transition-all rounded-full ${
                  idx === currentIndex
                    ? 'w-7 h-2 bg-[#2F2B28]'
                    : 'w-2 h-2 bg-[#D9C1A7] hover:bg-[#8A7465]'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
