import React, { useState, useEffect } from 'react';
import { Sparkles, RotateCcw, Check, AlertTriangle, Type, Save } from 'lucide-react';
import { useStore } from '../../context/StoreContext';
import { ImageUploader } from '../ImageUploader';
import { MiniBazaarLogo } from '../MiniBazaarLogo';

interface LogoCustomizerProps {
  onSuccess?: () => void;
}

export const LogoCustomizer: React.FC<LogoCustomizerProps> = ({ onSuccess }) => {
  const { storeSettings, updateStoreSettings } = useStore();

  const [siteNameAr, setSiteNameAr] = useState(storeSettings.store_name_ar || 'ميني بازار');
  const [siteNameEn, setSiteNameEn] = useState(storeSettings.store_name_en || 'Mini Bazaar');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setSiteNameAr(storeSettings.store_name_ar || 'ميني بازار');
    setSiteNameEn(storeSettings.store_name_en || 'Mini Bazaar');
  }, [storeSettings.store_name_ar, storeSettings.store_name_en]);

  const handleSaveNames = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    updateStoreSettings({
      store_name_ar: siteNameAr.trim() || 'ميني بازار',
      store_name_en: siteNameEn.trim() || 'Mini Bazaar',
    });
    setIsSaved(true);
    if (onSuccess) onSuccess();
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleResetNames = () => {
    setSiteNameAr('ميني بازار');
    setSiteNameEn('Mini Bazaar');
    updateStoreSettings({
      store_name_ar: 'ميني بازار',
      store_name_en: 'Mini Bazaar',
    });
    setIsSaved(true);
    if (onSuccess) onSuccess();
    setTimeout(() => setIsSaved(false), 2500);
  };

  const isLocalLogo =
    Boolean(storeSettings.custom_logo_url) &&
    (storeSettings.custom_logo_url!.startsWith('data:') ||
      storeSettings.custom_logo_url!.startsWith('blob:'));

  const handleLogoChange = (url: string) => {
    updateStoreSettings({ custom_logo_url: url });
  };

  const handleResetToDefault = () => {
    updateStoreSettings({ custom_logo_url: undefined });
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-[24px] border border-[#E5D8C9] shadow-2xs space-y-8">
      {/* 1. Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E5D8C9]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-[#C6A36A]" />
            <h3 className="text-base font-bold text-[#2F2B28] font-heading">
              هوية وشعار واسم المتجر (Store Identity & Branding)
            </h3>
          </div>
          <p className="text-xs text-[#7C736D]">
            يمكنك تخصيص اسم المتجر بالعربية والإنجليزية ليظهر في الهيدر والفوتر، ورفع الشعار والأيقونة الرسمية وحفظها مباشرة.
          </p>
        </div>

        {storeSettings.custom_logo_url && (
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-[12px] bg-[#F4ECE2] hover:bg-[#E7D4BC] text-[#2F2B28] text-xs font-semibold transition-colors shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>استعادة الشعار الأصلي</span>
          </button>
        )}
      </div>

      {/* 2. Site Name Customization Box (Arabic & English) */}
      <div className="bg-[#FAF6F0] p-5 sm:p-6 rounded-[20px] border border-[#E7D4BC] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E7D4BC]/60">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-[#C6A36A]" />
            <h4 className="text-sm font-bold text-[#6F584A] font-heading">
              اسم المتجر الكتابي في الهيدر والفوتر (Site Name)
            </h4>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetNames}
              className="text-[11px] font-semibold text-[#8A7465] hover:text-[#2F2B28] transition-colors"
            >
              استعادة "ميني بازار"
            </button>
          </div>
        </div>

        <form onSubmit={handleSaveNames} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Arabic Name */}
            <div>
              <label className="block text-xs font-bold text-[#5F5751] mb-1.5 text-right">
                اسم المتجر بالعربية (يظهر كعنوان رئيسي للهوية):
              </label>
              <input
                type="text"
                value={siteNameAr}
                onChange={(e) => {
                  setSiteNameAr(e.target.value);
                  updateStoreSettings({ store_name_ar: e.target.value });
                }}
                placeholder="ميني بازار"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9C1A7] rounded-[12px] text-xs text-[#2F2B28] font-bold focus:outline-none focus:ring-2 focus:ring-[#C6A36A]/40 text-right"
              />
              <span className="text-[10px] text-[#8A7465] mt-1 block text-right">
                الاسم الظاهر بالخط العريض الفاخر في الهيدر والفوتر.
              </span>
            </div>

            {/* English Name */}
            <div>
              <label className="block text-xs font-bold text-[#5F5751] mb-1.5 text-right">
                اسم المتجر بالإنجليزية (يظهر بالخط الذهبي اللاتيني):
              </label>
              <input
                type="text"
                value={siteNameEn}
                onChange={(e) => {
                  setSiteNameEn(e.target.value);
                  updateStoreSettings({ store_name_en: e.target.value });
                }}
                placeholder="Mini Bazaar"
                dir="ltr"
                className="w-full px-3.5 py-2.5 bg-white border border-[#D9C1A7] rounded-[12px] text-xs text-[#2F2B28] font-bold focus:outline-none focus:ring-2 focus:ring-[#C6A36A]/40 text-left"
              />
              <span className="text-[10px] text-[#8A7465] mt-1 block text-right">
                الاسم اللاتيني الفرعي المكتمل بأحرف أنيقة متناسقة.
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {isSaved && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-[11px] font-bold animate-fade-in">
                  <Check className="w-3.5 h-3.5" />
                  تم حفظ اسم المتجر بنجاح
                </span>
              )}
            </div>

            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-[12px] bg-[#2F2B28] hover:bg-[#231F1D] text-white text-xs font-bold shadow-xs transition-all active:scale-98"
            >
              <Save className="w-3.5 h-3.5 text-[#C6A36A]" />
              <span>حفظ نصوص الاسم وتطبيقها فوراً</span>
            </button>
          </div>
        </form>
      </div>

      {isLocalLogo && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-[16px] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs">
              تم اختيار الشعار ومعاينته، لكن يلزم إعداد خدمة التخزين قبل الحفظ النهائي
            </p>
            <p className="text-[11px] text-amber-700 mt-0.5">
              يظهر الشعار حالياً في المعاينة الحية فقط، ولن يتم حفظه نهائياً في السجلات السحابية حتى ربط خدمة التخزين أو استخدام رابط خارجي.
            </p>
          </div>
        </div>
      )}

      {/* 3. Logo Upload and Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upload Control */}
        <div className="lg:col-span-7">
          <ImageUploader
            value={storeSettings.custom_logo_url || ''}
            onChange={handleLogoChange}
            label="رفع صورة الشعار من الكمبيوتر أو معرض الجوال أو الكاميرا (يدعم JPEG, PNG, WebP, GIF)"
            aspectRatioHint="يفضل شعار مربع أو دائري بنسبة 1:1 أو خلفية شفافة"
            maxDimension={600}
            quality={0.9}
            folder="logo"
          />
        </div>

        {/* Live Preview Box */}
        <div className="lg:col-span-5 bg-[#FBF8F3] p-5 rounded-[20px] border border-[#E7D4BC] space-y-4 text-right">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#6F584A] block">
              معاينة حية لظهور الاسم والشعار:
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EFE4D6] text-[#6F584A] font-semibold">
              تحديث فوري
            </span>
          </div>

          {/* Light Header preview */}
          <div className="p-3.5 rounded-[14px] bg-white border border-[#E5D8C9] shadow-2xs">
            <span className="text-[10px] text-[#8A7465] font-semibold block mb-2">
              في الهيدر والشريط العلوي:
            </span>
            <div className="flex items-center justify-between">
              <MiniBazaarLogo
                variant="compact"
                siteNameAr={siteNameAr}
                siteNameEn={siteNameEn}
              />
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#F4ECE2] text-[#6F584A]">
                معاينة الهيدر
              </span>
            </div>
          </div>

          {/* Dark Footer preview */}
          <div className="p-3.5 rounded-[14px] bg-[#2F2B28] text-white border border-[#4A3E37] shadow-2xs">
            <span className="text-[10px] text-[#C4B7AC] font-semibold block mb-2">
              في الفوتر وأسفل المتجر:
            </span>
            <div className="flex items-center justify-between">
              <MiniBazaarLogo
                variant="full"
                inverted={true}
                siteNameAr={siteNameAr}
                siteNameEn={siteNameEn}
              />
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#3D3733] text-[#C6A36A]">
                معاينة الفوتر
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#607866] font-medium pt-1">
            <Check className="w-3.5 h-3.5 text-[#607866]" />
            <span>
              {storeSettings.custom_logo_url
                ? 'يتم الآن استخدام الشعار المخصص المرفوع'
                : 'يتم حالياً استخدام الشعار الملكي الافتراضي'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
