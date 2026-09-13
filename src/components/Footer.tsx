import React from 'react';
import { MiniBazaarLogo } from './MiniBazaarLogo';
import {
  MessageCircle,
  ShieldCheck,
  Sparkles,
  ArrowUp,
  Phone,
  Mail,
  MapPin,
  Clock,
  Heart,
  Store,
  FileText,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { SocialIcon } from './SocialIcon';

export const Footer: React.FC = () => {
  const {
    storeSettings,
    categories,
    setSelectedCategory,
    setActiveView,
    openAboutUsModal,
    openPoliciesModal,
  } = useStore();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeSocials = (storeSettings.social_links || [])
    .filter((s) => s.is_active !== false && s.url)
    .sort((a, b) => a.sort_order - b.sort_order);

  const footerBio =
    storeSettings.footer_bio_ar ||
    'ميني بازار — وجهة المقتنيات الفاخرة والأناقة المنتقاة. نوفر لكِ تشكيلة راقية من الحقائب، الساعات، الإكسسوارات، والعطور المختارة بعناية فائقة وتغليف هدايا ملكي.';

  const verificationText =
    storeSettings.footer_verification_text_ar ||
    'متجر موثق في المركز السعودي للأعمال ومعروف برقم 392019';

  const designerCredit =
    storeSettings.footer_designer_credit_ar || 'تصميم: عبدالله المخلافي 2026';

  const showDesignerCredit = storeSettings.footer_show_designer_credit !== false;

  const commitments =
    storeSettings.footer_commitments && storeSettings.footer_commitments.length > 0
      ? storeSettings.footer_commitments
      : [
          { id: 'c-1', text_ar: 'فحص جودة يدوي دقيق لكل قطعة قبل الإرسال.' },
          { id: 'c-2', text_ar: 'بوكس الإهداء الفاخر وشريط الساتان مجاناً.' },
          { id: 'c-3', text_ar: 'دفع آمن مع التحويل البنكي المعتمد.' },
        ];

  // About Us configuration
  const aboutUsConfig = storeSettings.about_us;
  const isAboutUsVisible =
    Boolean(aboutUsConfig?.enabled !== false) &&
    Boolean(aboutUsConfig?.published !== false) &&
    Boolean(
      (aboutUsConfig?.paragraphs && aboutUsConfig.paragraphs.some((p) => p.text_ar?.trim())) ||
      aboutUsConfig?.vision_ar?.trim() ||
      aboutUsConfig?.subtitle_ar?.trim()
    );

  // Store Policies configuration
  const policiesConfig = storeSettings.store_policies;
  const activePolicies = (policiesConfig?.policies || [])
    .filter(
      (p) => p.is_active !== false && p.is_published !== false && Boolean(p.content_ar && p.content_ar.trim())
    )
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const isStoreInfoSectionVisible =
    Boolean(policiesConfig?.section_enabled !== false) &&
    (isAboutUsVisible || activePolicies.length > 0);

  const storeInfoTitle = policiesConfig?.section_title_ar || 'معلومات المتجر';

  const paymentMethods =
    storeSettings.footer_payment_methods && storeSettings.footer_payment_methods.length > 0
      ? storeSettings.footer_payment_methods
      : ['مدى', 'Apple Pay', 'Visa', 'Mastercard', 'تحويل بنكي'];

  // Dynamic footer styling from storeSettings
  const footerBgColor = storeSettings.footer_bg_color || '#2F2B28';
  const footerTextColor = storeSettings.footer_text_color || '#C4B7AC';
  const footerHeadingColor = storeSettings.footer_heading_color || '#E7D4BC';
  const footerLinkColor = storeSettings.footer_link_color || '#E7D4BC';
  const footerBorderColor = storeSettings.footer_border_color || '#4A3E37';
  const footerBadgeBg = storeSettings.footer_badge_bg || '#3D3733';
  const footerBadgeColor = storeSettings.footer_badge_color || '#E7D4BC';

  const footerFontSizeClass =
    storeSettings.footer_font_size === 'sm'
      ? 'text-sm'
      : storeSettings.footer_font_size === 'base'
      ? 'text-base'
      : 'text-xs';
  const footerFontWeightClass =
    storeSettings.footer_font_weight === 'medium'
      ? 'font-medium'
      : storeSettings.footer_font_weight === 'semibold'
      ? 'font-semibold'
      : 'font-normal';

  const handleLinkClick = (action: string) => {
    if (action === 'store') {
      setSelectedCategory(null);
      setActiveView('store');
      scrollToTop();
    } else if (action === 'wishlist') {
      setActiveView('wishlist');
      scrollToTop();
    } else if (action === 'admin') {
      setActiveView('admin');
      scrollToTop();
    } else if (action === 'orders' || action === 'track-order') {
      setActiveView('track-order');
      scrollToTop();
    }
  };

  return (
    <footer
      style={{ backgroundColor: footerBgColor, color: footerTextColor, borderColor: footerBorderColor }}
      className={`pt-14 pb-28 lg:pb-12 border-t text-right font-sans ${footerFontSizeClass} ${footerFontWeightClass} transition-colors duration-300`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-8">
        {/* Main Footer Grid */}
        <div style={{ borderColor: footerBorderColor }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-10 pb-10 border-b">
          
          {/* Brand Info & Bio (5 Columns) */}
          <div className="lg:col-span-4 space-y-4">
            <MiniBazaarLogo variant="full" inverted={true} />

            <p style={{ color: footerTextColor }} className="text-xs sm:text-sm leading-relaxed pt-2 opacity-90">
              {footerBio}
            </p>

            {/* Social Media Links Icons */}
            {activeSocials.length > 0 && (
              <div className="pt-2">
                <span style={{ color: footerHeadingColor }} className="block text-[11px] mb-2 font-medium opacity-80">
                  تابعوا منصاتنا الاجتماعية:
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {activeSocials.map((social) => (
                    <a
                      key={social.id}
                      href={social.url}
                      target="_blank"
                      rel="noreferrer"
                      title={social.title_ar}
                      aria-label={social.title_ar}
                      style={{ backgroundColor: footerBadgeBg, color: footerBadgeColor, borderColor: footerBorderColor }}
                      className="w-8 h-8 rounded-full hover:bg-[#C6A36A] hover:text-[#2F2B28] border flex items-center justify-center transition-all duration-200"
                    >
                      <SocialIcon platform={social.platform} className="w-4 h-4" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Business Verification */}
            {verificationText && (
              <div style={{ color: footerTextColor }} className="flex items-center gap-2 text-[11px] pt-2 opacity-85">
                <ShieldCheck className="w-4 h-4 text-[#C6A36A] shrink-0" />
                <span>{verificationText}</span>
              </div>
            )}
          </div>

          {/* Section 1: تواصلي معنا (Contact Info) - 3 Columns */}
          <div className="lg:col-span-3 space-y-4">
            <h3 style={{ color: footerHeadingColor, borderColor: footerBorderColor }} className="text-sm font-bold font-heading tracking-wide border-b pb-2 inline-block">
              تواصلي معنا
            </h3>

            <div className="space-y-3 text-xs" style={{ color: footerTextColor }}>
              {/* WhatsApp Link */}
              <a
                href={`https://wa.me/${storeSettings.whatsapp_number.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 border border-[#25D366]/30 text-[#4ADE80] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-[#25D366] shrink-0" />
                  <span className="font-semibold text-xs text-white">واتساب خدمة العملاء:</span>
                </div>
                <span dir="ltr" className="font-mono text-xs font-bold text-white">
                  {storeSettings.whatsapp_number}
                </span>
              </a>

              {/* Phone Link */}
              {storeSettings.phone_number && (
                <div style={{ backgroundColor: footerBadgeBg, borderColor: footerBorderColor }} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-[#C6A36A] shrink-0" />
                    <span className="opacity-75">رقم الاتصال:</span>
                  </div>
                  <a
                    href={`tel:${storeSettings.phone_number}`}
                    dir="ltr"
                    style={{ color: footerLinkColor }}
                    className="hover:underline font-mono text-xs font-medium"
                  >
                    {storeSettings.phone_number}
                  </a>
                </div>
              )}

              {/* Email Link */}
              {storeSettings.support_email && (
                <div style={{ backgroundColor: footerBadgeBg, borderColor: footerBorderColor }} className="flex items-center justify-between p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-[#C6A36A] shrink-0" />
                    <span className="opacity-75">البريد:</span>
                  </div>
                  <a
                    href={`mailto:${storeSettings.support_email}`}
                    dir="ltr"
                    style={{ color: footerLinkColor }}
                    className="hover:underline font-mono text-xs"
                  >
                    {storeSettings.support_email}
                  </a>
                </div>
              )}

              {/* Address */}
              {storeSettings.boutique_address_ar && (
                <div className="flex items-start gap-2 pt-1 text-[11px]">
                  <MapPin className="w-3.5 h-3.5 text-[#C6A36A] shrink-0 mt-0.5" />
                  <span className="opacity-75 shrink-0">العنوان:</span>
                  <span style={{ color: footerTextColor }} className="leading-relaxed font-medium">
                    {storeSettings.boutique_address_ar}
                  </span>
                </div>
              )}

              {/* Working Hours */}
              {storeSettings.service_hours_ar && (
                <div style={{ color: footerTextColor }} className="flex items-center gap-2 text-[11px] opacity-80">
                  <Clock className="w-3.5 h-3.5 text-[#C6A36A] shrink-0" />
                  <span>{storeSettings.service_hours_ar}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: روابط سريعة (Navigation Links) - 2 Columns */}
          <div className="lg:col-span-2 space-y-4">
            <h3 style={{ color: footerHeadingColor, borderColor: footerBorderColor }} className="text-sm font-bold font-heading tracking-wide border-b pb-2 inline-block">
              روابط سريعة
            </h3>
            <ul className="space-y-2.5 text-xs">
              <li>
                <button
                  onClick={() => handleLinkClick('store')}
                  style={{ color: footerLinkColor }}
                  className="hover:opacity-75 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  <span>المتجر</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('wishlist')}
                  style={{ color: footerLinkColor }}
                  className="hover:opacity-75 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  <span>المفضلة</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('track-order')}
                  style={{ color: footerLinkColor }}
                  className="hover:opacity-75 transition-opacity flex items-center gap-1.5 cursor-pointer"
                >
                  <span>تتبع واستعراض الطلب</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleLinkClick('admin')}
                  className="text-[#C6A36A] hover:underline font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>لوحة إدارة المتجر</span>
                </button>
              </li>
            </ul>
          </div>

          {/* Section 3: معلومات المتجر والسياسات (Store Info & Policies) - 3 Columns */}
          {isStoreInfoSectionVisible && (
            <div className="lg:col-span-3 space-y-4">
              <h3 style={{ color: footerHeadingColor, borderColor: footerBorderColor }} className="text-sm font-bold font-heading tracking-wide border-b pb-2 inline-block">
                {storeInfoTitle}
              </h3>
              <ul className="space-y-2.5 text-xs">
                {/* About Us Link */}
                {isAboutUsVisible && (
                  <li>
                    <button
                      type="button"
                      onClick={openAboutUsModal}
                      style={{ color: footerLinkColor }}
                      className="hover:opacity-75 transition-opacity flex items-center gap-1.5 cursor-pointer text-right"
                      title={aboutUsConfig?.footer_link_title_ar || 'من نحن'}
                    >
                      <Info className="w-3.5 h-3.5 text-[#C6A36A] shrink-0" />
                      <span>{aboutUsConfig?.footer_link_title_ar || 'من نحن'}</span>
                    </button>
                  </li>
                )}

                {/* Policies Links */}
                {activePolicies.map((pol) => (
                  <li key={pol.id}>
                    <button
                      type="button"
                      onClick={() => openPoliciesModal(pol.key || pol.id)}
                      style={{ color: footerLinkColor }}
                      className="hover:opacity-75 transition-opacity flex items-center gap-1.5 cursor-pointer text-right"
                      title={pol.footer_link_text_ar || pol.title_ar}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#C6A36A]/60 shrink-0" />
                      <span>{pol.footer_link_text_ar || pol.title_ar}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Section 4: تعهدات ميني بازار الملكية (Commitments Strip) */}
        {commitments.length > 0 && (
          <div className="py-6 border-b" style={{ borderColor: footerBorderColor }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {commitments.map((com) => (
                <div
                  key={com.id}
                  style={{
                    backgroundColor: footerBadgeBg,
                    borderColor: footerBorderColor,
                    color: footerTextColor,
                  }}
                  className="flex items-center gap-3 p-3.5 rounded-xl border text-xs shadow-2xs transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#C6A36A] shrink-0" />
                  <span className="leading-relaxed font-medium">{com.text_ar}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Methods & Copyright & Designer Signature */}
        <div className="pt-8 space-y-6">
          {/* Payment Badges Row */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span style={{ color: footerHeadingColor }} className="text-xs ml-2 opacity-80">طرق الدفع المعتمدة:</span>
            {paymentMethods.map((pm, idx) => (
              <span
                key={idx}
                style={{ backgroundColor: footerBadgeBg, color: footerBadgeColor, borderColor: footerBorderColor }}
                className="px-3 py-1 rounded-lg text-[11px] font-bold border shadow-xs"
              >
                {pm}
              </span>
            ))}
          </div>

          {/* Copyright & Designer Badge */}
          <div style={{ borderColor: footerBorderColor, color: footerTextColor }} className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs border-t pt-6 opacity-85">
            <p className="text-center sm:text-right">
              {storeSettings.footer_copyright_ar ||
                `© ${new Date().getFullYear()} ${storeSettings.store_name_ar} — جميع الحقوق محفوظة.`}
            </p>

            {showDesignerCredit && (
              <div style={{ backgroundColor: footerBadgeBg, borderColor: footerBorderColor, color: '#C6A36A' }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-medium text-xs">
                <Sparkles className="w-3.5 h-3.5 text-[#C6A36A]" />
                <span>{designerCredit}</span>
              </div>
            )}

            <button
              onClick={scrollToTop}
              aria-label="العودة لأعلى الصفحة"
              style={{ backgroundColor: footerBadgeBg, borderColor: footerBorderColor, color: '#C6A36A' }}
              className="w-8 h-8 rounded-full border flex items-center justify-center hover:opacity-80 transition-opacity"
              title="العودة للأعلى"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
