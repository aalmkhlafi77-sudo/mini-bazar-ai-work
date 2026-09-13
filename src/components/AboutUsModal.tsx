import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, ShieldCheck, Heart, Eye, Target, Calendar } from 'lucide-react';
import { useStore } from '../context/StoreContext';

interface AboutUsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutUsModal: React.FC<AboutUsModalProps> = ({ isOpen, onClose }) => {
  const { storeSettings } = useStore();
  const aboutUs = storeSettings.about_us;

  // Prevent background scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !aboutUs || aboutUs.enabled === false || aboutUs.published === false) {
    return null;
  }

  const textAlignClass = aboutUs.text_alignment === 'center' ? 'text-center' : 'text-right';
  const fontSizeClass =
    aboutUs.font_size === 'lg'
      ? 'text-base'
      : aboutUs.font_size === 'base'
      ? 'text-[15px]'
      : 'text-sm';

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-us-modal-title"
      >
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />

        {/* Modal Window (Text Only - No dummy images or logos) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-2xl bg-[#FBF8F3] rounded-[24px] border border-[#E5D8C9] shadow-2xl overflow-hidden my-auto z-10 flex flex-col max-h-[88vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5D8C9] bg-[#F4ECE2]/80 shrink-0">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#C6A36A]" />
                <h2
                  id="about-us-modal-title"
                  className="text-lg sm:text-xl font-bold font-heading text-[#2F2B28]"
                >
                  {aboutUs.modal_title_ar || 'عن بوتيك ميني بازار'}
                </h2>
              </div>
              {aboutUs.subtitle_ar && (
                <p className="text-xs text-[#8A7465] font-medium pr-4">
                  {aboutUs.subtitle_ar}
                </p>
              )}
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#6F584A] hover:bg-[#E7D4BC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A36A]"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content - Scrollable */}
          <div className={`p-6 sm:p-8 space-y-6 overflow-y-auto flex-1 ${textAlignClass} text-[#3D3733]`}>
            {/* Story Paragraphs */}
            {aboutUs.paragraphs && aboutUs.paragraphs.length > 0 && (
              <div className="space-y-4">
                {aboutUs.paragraphs.map((p) => (
                  <div key={p.id} className="space-y-1.5">
                    {p.heading_ar && (
                      <h3 className="text-sm sm:text-base font-bold text-[#6F584A] font-heading flex items-center gap-2">
                        <span>{p.heading_ar}</span>
                      </h3>
                    )}
                    <p className={`${fontSizeClass} leading-relaxed text-[#4A423D] whitespace-pre-line`}>
                      {p.text_ar}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Vision & Mission Text Cards */}
            {(aboutUs.vision_ar || aboutUs.mission_ar) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {aboutUs.vision_ar && (
                  <div className="p-4 rounded-2xl bg-[#F4ECE2]/60 border border-[#E5D8C9] space-y-2">
                    <div className="flex items-center gap-2 text-[#C6A36A]">
                      <Eye className="w-4 h-4 text-[#C6A36A]" />
                      <h4 className="text-xs font-bold font-heading text-[#6F584A]">
                        رؤيتنا
                      </h4>
                    </div>
                    <p className="text-xs leading-relaxed text-[#5F5751]">
                      {aboutUs.vision_ar}
                    </p>
                  </div>
                )}

                {aboutUs.mission_ar && (
                  <div className="p-4 rounded-2xl bg-[#F4ECE2]/60 border border-[#E5D8C9] space-y-2">
                    <div className="flex items-center gap-2 text-[#C6A36A]">
                      <Target className="w-4 h-4 text-[#C6A36A]" />
                      <h4 className="text-xs font-bold font-heading text-[#6F584A]">
                        رسالتنا
                      </h4>
                    </div>
                    <p className="text-xs leading-relaxed text-[#5F5751]">
                      {aboutUs.mission_ar}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Core Values */}
            {aboutUs.values && aboutUs.values.length > 0 && (
              <div className="pt-2 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A7465]">
                  قيمنا وثوابتنا
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {aboutUs.values.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 rounded-xl bg-white border border-[#E5D8C9] flex items-start gap-3 shadow-2xs"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#F4ECE2] flex items-center justify-center shrink-0 mt-0.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#C6A36A]" />
                      </div>
                      <div className="space-y-0.5">
                        <span className="text-xs font-bold text-[#2F2B28] block">
                          {v.title_ar}
                        </span>
                        {v.description_ar && (
                          <p className="text-[11px] text-[#7C736D] leading-relaxed">
                            {v.description_ar}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Direct Contact Text Info */}
            {aboutUs.contact_text_ar && (
              <div className="p-4 rounded-2xl bg-[#F4ECE2]/40 border border-[#D9C1A7] text-xs text-[#6F584A] leading-relaxed flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-[#C6A36A] shrink-0" />
                <p>{aboutUs.contact_text_ar}</p>
              </div>
            )}
          </div>

          {/* Footer of Modal */}
          <div className="px-6 py-4 border-t border-[#E5D8C9] bg-[#F4ECE2]/60 flex items-center justify-between shrink-0">
            {aboutUs.show_last_updated && aboutUs.last_updated ? (
              <div className="flex items-center gap-1.5 text-[11px] text-[#8A7465]">
                <Calendar className="w-3.5 h-3.5" />
                <span>آخر تحديث: {aboutUs.last_updated}</span>
              </div>
            ) : (
              <div />
            )}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8] text-xs font-bold transition-all shadow-xs"
            >
              إغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
