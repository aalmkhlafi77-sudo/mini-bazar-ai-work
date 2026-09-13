import React, { useState } from 'react';
import {
  Search,
  ShoppingBag,
  Heart,
  Menu,
  X,
  ShieldCheck,
  Phone,
  Mail,
  MessageCircle,
  Clock,
  Sparkles,
  ChevronLeft,
  LayoutGrid,
  Tag,
  Home,
  CheckCircle2,
  Package,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { MiniBazaarLogo } from './MiniBazaarLogo';
import { SocialIcon } from './SocialIcon';

export const Header: React.FC = () => {
  const {
    cartCount,
    setIsCartOpen,
    wishlist,
    setActiveView,
    activeView,
    searchQuery,
    setSearchQuery,
    categories,
    setSelectedCategory,
    selectedCategory,
    storeSettings,
    isAdminAuthenticated,
  } = useStore();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems =
    storeSettings.navigation_items && storeSettings.navigation_items.length > 0
      ? [...storeSettings.navigation_items]
          .filter((i) => i.is_active !== false)
          .filter((i) => {
            const t = (i.title_ar || '').toLowerCase();
            return (
              !t.includes('من نحن') &&
              !t.includes('معلومات المتجر') &&
              !t.includes('سياس') &&
              !t.includes('الشروط والأحكام') &&
              i.type !== ('policy' as any)
            );
          })
          .sort((a, b) => a.sort_order - b.sort_order)
      : [
          { id: 'nav-home', title_ar: 'الرئيسية', type: 'home' as const, is_active: true, sort_order: 1 },
          ...categories.map((cat, idx) => ({
            id: `nav-cat-${cat.id}`,
            title_ar: cat.name_ar,
            type: 'category' as const,
            category_id: cat.id,
            is_active: true,
            sort_order: idx + 2,
          })),
          {
            id: 'nav-offers',
            title_ar: 'العروض الحصرية',
            type: 'offers' as const,
            badge: 'خصومات',
            is_active: true,
            sort_order: 99,
          },
        ];

  const handleNavItemClick = (item: {
    type: string;
    category_id?: string;
    url?: string;
  }) => {
    if (item.type === 'home') {
      setSelectedCategory(null);
      setActiveView('store');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (item.type === 'category' && item.category_id) {
      setSelectedCategory(item.category_id);
      setActiveView('store');
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (item.type === 'offers') {
      setSelectedCategory(null);
      setActiveView('store');
      const el = document.getElementById('products-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    } else if (item.type === 'custom' && item.url) {
      if (item.url.startsWith('#')) {
        const el = document.querySelector(item.url);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.open(item.url, '_blank', 'noopener,noreferrer');
      }
    }
    setIsMobileMenuOpen(false);
  };

  const activeSocials = (storeSettings.social_links || [])
    .filter((s) => s.is_active !== false && s.url)
    .sort((a, b) => a.sort_order - b.sort_order);

  // Dynamic header styles from store settings
  const headerBgColor = storeSettings.header_bg_color || '#FBF8F3';
  const headerBorderColor = storeSettings.header_border_color || '#E5D8C9';
  const headerAnnouncementBg = storeSettings.header_announcement_bg || '#2F2B28';
  const headerAnnouncementTextColor = storeSettings.header_announcement_text_color || '#F5E9D8';

  const navFontSizeClass =
    storeSettings.header_nav_font_size === 'xs'
      ? 'text-xs'
      : storeSettings.header_nav_font_size === 'base'
      ? 'text-[15px]'
      : storeSettings.header_nav_font_size === 'lg'
      ? 'text-base'
      : 'text-sm';

  const navFontWeightClass =
    storeSettings.header_nav_font_weight === 'normal'
      ? 'font-normal'
      : storeSettings.header_nav_font_weight === 'semibold'
      ? 'font-semibold'
      : storeSettings.header_nav_font_weight === 'bold'
      ? 'font-bold'
      : 'font-medium';

  const navTextColor = storeSettings.header_nav_text_color || '#5F5751';
  const navActiveColor = storeSettings.header_nav_active_color || '#6F584A';
  const badgeBg = storeSettings.header_nav_badge_bg || 'rgba(198, 163, 106, 0.2)';
  const badgeColor = storeSettings.header_nav_badge_color || '#8A7465';

  const announcementPhrases =
    storeSettings.announcement_phrases && storeSettings.announcement_phrases.length > 0
      ? storeSettings.announcement_phrases
      : (storeSettings.announcement_bar_text_ar
          ? [storeSettings.announcement_bar_text_ar, 'تغليف هدايا ملكي مجاني مع كل طلبية', 'ضمان الجودة والأصالة 100%']
          : [
              'شحن مجاني لكافة الطلبات التي تتجاوز 450 ر.س',
              'تغليف هدايا ملكي مجاني مع كل طلبية',
              'ضمان الجودة والأصالة 100%',
              'خدمة توصيل سريعة وموثوقة لباب منزلك',
              'خدمة عملاء راقية واستشارات ذوقية متواصلة',
            ]);

  return (
    <header className="sticky top-0 z-40 w-full transition-all duration-300 font-sans bg-[#FBF8F3] shadow-xs">
      {/* 1. Ultra-Luxurious Announcement Ticker Bar (Always 1 Single Line with Smooth Infinite Continuous Marquee) */}
      {storeSettings.announcement_bar_visible && (
        <div
          style={{ backgroundColor: headerAnnouncementBg, color: headerAnnouncementTextColor }}
          className="border-b border-[#4A3E37]/60 py-2 px-3 text-[11px] sm:text-xs font-medium tracking-wide overflow-hidden select-none relative transition-colors duration-300"
        >
          {/* Subtle Side Gradients for high-end optical fade */}
          <div
            style={{
              background: `linear-gradient(to left, ${headerAnnouncementBg}, transparent)`,
            }}
            className="absolute right-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          />
          <div
            style={{
              background: `linear-gradient(to right, ${headerAnnouncementBg}, transparent)`,
            }}
            className="absolute left-0 top-0 bottom-0 w-8 z-10 pointer-events-none"
          />

          <div className="flex items-center overflow-hidden w-full whitespace-nowrap">
            {/* Animated Ticker Content - Loop repeated twice for seamless infinite scrolling */}
            <div className="animate-marquee flex items-center shrink-0">
              <div className="flex items-center gap-6 px-4">
                {announcementPhrases.map((phrase, idx) => (
                  <React.Fragment key={`p1-${idx}`}>
                    <span className="flex items-center gap-1.5" style={{ color: headerAnnouncementTextColor }}>
                      <Sparkles className="w-3.5 h-3.5 text-[#C6A36A]" />
                      <span>{phrase}</span>
                    </span>
                    <span className="text-[#C6A36A]/60">✦</span>
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center gap-6 px-4">
                {announcementPhrases.map((phrase, idx) => (
                  <React.Fragment key={`p2-${idx}`}>
                    <span className="flex items-center gap-1.5" style={{ color: headerAnnouncementTextColor }}>
                      <Sparkles className="w-3.5 h-3.5 text-[#C6A36A]" />
                      <span>{phrase}</span>
                    </span>
                    <span className="text-[#C6A36A]/60">✦</span>
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Main Navigation Bar */}
      <div
        style={{ backgroundColor: headerBgColor, borderColor: headerBorderColor }}
        className="backdrop-blur-md border-b px-3.5 sm:px-8 py-3 shadow-xs transition-colors duration-300"
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Right Side: Burger Menu (Mobile) + Brand Logo */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Menu Burger Trigger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl text-[#2F2B28] hover:bg-black/5 transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A36A]/30"
              aria-label="فتح قائمة الصفحات والتنقل"
              title="القائمة"
            >
              <Menu className="w-6 h-6 text-[#2F2B28]" />
            </button>

            {/* Brand Logo */}
            <button
              onClick={() => {
                setSelectedCategory(null);
                setActiveView('store');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-right group focus:outline-none shrink-0"
              title="ميني بازار — الرئيسية"
            >
              <MiniBazaarLogo variant="compact" />
            </button>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive =
                (item.type === 'home' && selectedCategory === null && activeView === 'store') ||
                (item.type === 'category' && selectedCategory === item.category_id && activeView === 'store');

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavItemClick(item)}
                  style={{
                    color: isActive
                      ? navActiveColor
                      : item.type === 'offers'
                      ? '#C6A36A'
                      : navTextColor,
                    borderColor: isActive ? '#C6A36A' : 'transparent',
                  }}
                  className={`relative ${navFontSizeClass} ${navFontWeightClass} transition-all pb-1 flex items-center gap-1.5 hover:opacity-80 ${
                    isActive ? 'border-b-2 font-bold' : ''
                  }`}
                >
                  <span>{item.title_ar}</span>
                  {item.badge && (
                    <span
                      style={{
                        backgroundColor: badgeBg,
                        color: badgeColor,
                      }}
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-[#C6A36A]/40"
                    >
                      {item.badge}
                    </span>
                  )}
                  {item.type === 'offers' && !item.badge && (
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C6A36A]" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Left Side: Actions (Search, Wishlist, Cart, Admin) */}
          <div className="flex items-center gap-1.5 sm:gap-3">
            {/* Search Box / Toggle */}
            <div className="relative">
              {isSearchOpen ? (
                <div className="flex items-center bg-[#F4ECE2] rounded-full px-3 py-1.5 border border-[#D9C1A7] w-44 sm:w-64 transition-all">
                  <Search className="w-4 h-4 text-[#8A7465] shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث في المقتنيات..."
                    className="w-full bg-transparent border-none text-xs text-[#2F2B28] px-2 focus:outline-none placeholder:text-[#7C736D]"
                    autoFocus
                  />
                  <button
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery('');
                    }}
                    className="text-[#8A7465] hover:text-[#2F2B28] p-0.5"
                    aria-label="إغلاق البحث"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="p-2 rounded-full text-[#5F5751] hover:text-[#6F584A] hover:bg-[#F4ECE2] transition-colors"
                  title="البحث في المنتجات"
                  aria-label="البحث"
                >
                  <Search className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Wishlist Button */}
            <button
              onClick={() => {
                setActiveView('wishlist');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="relative p-2 rounded-full text-[#5F5751] hover:text-[#B4574A] hover:bg-[#F4ECE2] transition-colors"
              title="المفضلة"
              aria-label="المفضلة"
            >
              <Heart className={`w-5 h-5 ${activeView === 'wishlist' ? 'text-[#B4574A] fill-[#B4574A]' : ''}`} />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#B4574A] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                  {wishlist.length}
                </span>
              )}
            </button>

            {/* Cart Drawer Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-1.5 sm:gap-2 bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8] px-3 sm:px-3.5 py-2 rounded-xl shadow-xs transition-all active:scale-95 border border-[#4A3E37]"
              aria-label="سلة التسوق"
            >
              <ShoppingBag className="w-4 h-4 text-[#C6A36A]" />
              <span className="hidden sm:inline text-xs font-semibold">السلة</span>
              {cartCount > 0 && (
                <span className="bg-[#C6A36A] text-[#2F2B28] text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Track Order Trigger */}
            <button
              onClick={() => {
                setActiveView('track-order');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                activeView === 'track-order'
                  ? 'bg-[#C6A36A] text-white border-[#C6A36A] shadow-xs'
                  : 'bg-[#F4ECE2] text-[#2F2B28] border-[#D9C1A7] hover:bg-[#E7D4BC]'
              }`}
              title="تتبع واستعراض الطلب"
            >
              <Package className="w-4 h-4 text-[#C6A36A]" />
              <span>تتبع الطلب</span>
            </button>

            {/* Admin Switcher Button (Desktop) - Shown only to authenticated admin */}
            {isAdminAuthenticated && (
              <button
                onClick={() => {
                  setActiveView(activeView === 'admin' ? 'store' : 'admin');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  activeView === 'admin'
                    ? 'bg-[#C6A36A] text-white border-[#C6A36A] shadow-xs'
                    : 'bg-[#F4ECE2] text-[#2F2B28] border-[#D9C1A7] hover:bg-[#E7D4BC]'
                }`}
                title="لوحة الإدارة والتخصيص"
              >
                <div className="relative">
                  <ShieldCheck className="w-4 h-4 text-[#C6A36A]" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                </div>
                <span>
                  {activeView === 'admin' ? 'العودة للمتجر' : 'لوحة الإدارة'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. High-End Mobile Navigation Drawer (Modal / Sheet with Backdrop) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Dark Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Content on the Right */}
          <div className="relative ml-auto w-full max-w-xs bg-[#FBF8F3] h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-[#E5D8C9] animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#E5D8C9] flex items-center justify-between bg-[#F4ECE2]/80">
              <MiniBazaarLogo variant="compact" />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-[#EFE3D4] hover:bg-[#E5D8C9] text-[#2F2B28] flex items-center justify-center transition-colors"
                aria-label="إغلاق القائمة"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-5 space-y-6 flex-1">
              {/* Quick Search */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#8A7465] absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحثي عن حقيبة، ساعة، عطر..."
                  className="w-full bg-[#F4ECE2] border border-[#D9C1A7] rounded-xl pr-9 pl-3 py-2.5 text-xs text-[#2F2B28] focus:outline-none focus:ring-2 focus:ring-[#C6A36A]"
                />
              </div>

              {/* Navigation Links */}
              <div>
                <span className="text-[11px] font-bold text-[#8A7465] uppercase tracking-wider block mb-2 px-1">
                  خيارات التنقل والصفحات
                </span>
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive =
                      (item.type === 'home' && selectedCategory === null && activeView === 'store') ||
                      (item.type === 'category' && selectedCategory === item.category_id && activeView === 'store');

                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavItemClick(item)}
                        className={`w-full text-right py-2.5 px-3 rounded-xl text-sm font-medium flex items-center justify-between transition-all ${
                          isActive
                            ? 'bg-[#2F2B28] text-[#F5E9D8] font-bold shadow-xs'
                            : 'text-[#2F2B28] hover:bg-[#F4ECE2]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {item.type === 'home' && <Home className="w-4 h-4 text-[#C6A36A]" />}
                          {item.type === 'category' && <LayoutGrid className="w-4 h-4 text-[#8A7465]" />}
                          {item.type === 'offers' && <Tag className="w-4 h-4 text-[#C6A36A]" />}
                          <span>{item.title_ar}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#C6A36A]/20 text-[#8A7465] border border-[#C6A36A]/40">
                              {item.badge}
                            </span>
                          )}
                          <ChevronLeft className="w-4 h-4 text-[#8A7465]" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Store Services / Commitments Quick List */}
              <div className="bg-[#F4ECE2]/60 rounded-2xl p-4 border border-[#E5D8C9] space-y-2">
                <span className="text-[11px] font-bold text-[#6F584A] block mb-1">
                  تعهدات بوتيك ميني بازار
                </span>
                <div className="text-xs text-[#5F5751] space-y-1.5">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    <span>فحص جودة يدوي دقيق لكل قطعة</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    <span>تغليف إهداء ملكي وشريط ساتان فاخر</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#25D366] shrink-0" />
                    <span>توصيل سريع ودفع إلكتروني آمن</span>
                  </div>
                </div>
              </div>

              {/* Direct Support Actions */}
              <div className="space-y-2 pt-1">
                <a
                  href={`https://wa.me/${storeSettings.whatsapp_number.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366]/15 hover:bg-[#25D366]/25 text-[#16803C] py-2.5 px-3 rounded-xl text-xs font-bold border border-[#25D366]/40 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#25D366]" />
                  <span>تواصل مباشر مع خدمة العملاء عبر واتساب</span>
                </a>

                {storeSettings.phone_number && (
                  <a
                    href={`tel:${storeSettings.phone_number}`}
                    className="flex items-center justify-center gap-2 w-full bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#2F2B28] py-2 px-3 rounded-xl text-xs font-medium border border-[#D9C1A7] transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#C6A36A]" />
                    <span>اتصال هاتفي: {storeSettings.phone_number}</span>
                  </a>
                )}

                <button
                  onClick={() => {
                    setActiveView('track-order');
                    setIsMobileMenuOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="flex items-center justify-center gap-2 w-full bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#2F2B28] py-2.5 px-3 rounded-xl text-xs font-bold border border-[#D9C1A7] transition-colors"
                >
                  <Package className="w-4 h-4 text-[#C6A36A]" />
                  <span>تتبع الطلب وملاحظات المشرف</span>
                </button>

                {isAdminAuthenticated && (
                  <button
                    onClick={() => {
                      setActiveView('admin');
                      setIsMobileMenuOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="flex items-center justify-center gap-2 w-full bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8] py-2.5 px-3 rounded-xl text-xs font-bold border border-[#4A3E37] transition-colors"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#C6A36A]" />
                    <span>لوحة إدارة وتحكم المتجر</span>
                  </button>
                )}
              </div>

              {/* Social Channels */}
              {activeSocials.length > 0 && (
                <div className="pt-2">
                  <span className="block text-[11px] text-[#8A7465] mb-2 font-medium">
                    تابعونا على منصات التواصل:
                  </span>
                  <div className="flex items-center gap-2">
                    {activeSocials.map((social) => (
                      <a
                        key={social.id}
                        href={social.url}
                        target="_blank"
                        rel="noreferrer"
                        title={social.title_ar}
                        aria-label={social.title_ar}
                        className="w-8 h-8 rounded-full bg-[#F4ECE2] hover:bg-[#C6A36A] hover:text-white text-[#2F2B28] border border-[#D9C1A7] flex items-center justify-center transition-all"
                      >
                        <SocialIcon platform={social.platform} className="w-4 h-4" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Footer Copyright */}
            <div className="p-4 border-t border-[#E5D8C9] text-center text-[10px] text-[#8A7465] bg-[#F4ECE2]/50">
              © {new Date().getFullYear()} {storeSettings.store_name_ar} • جميع الحقوق محفوظة
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
