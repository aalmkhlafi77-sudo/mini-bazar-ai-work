import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, FileText, Calendar, CheckCircle2, Shield, ArrowRight } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { StorePolicyItem } from '../types';

interface PoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPolicyKey?: string | null;
}

export const PoliciesModal: React.FC<PoliciesModalProps> = ({
  isOpen,
  onClose,
  selectedPolicyKey,
}) => {
  const { storeSettings } = useStore();
  const policiesConfig = storeSettings.store_policies;

  // Filter only active, published policies with actual text content
  const activePolicies: StorePolicyItem[] = (policiesConfig?.policies || [])
    .filter((p) => p.is_active !== false && p.is_published !== false && p.content_ar?.trim())
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));

  const [currentKey, setCurrentKey] = useState<string>('');

  // Update current policy when modal opens or selectedPolicyKey changes
  useEffect(() => {
    if (!isOpen) return;

    if (selectedPolicyKey && activePolicies.some((p) => p.key === selectedPolicyKey || p.id === selectedPolicyKey)) {
      setCurrentKey(selectedPolicyKey);
    } else if (policiesConfig?.default_policy_id && activePolicies.some((p) => p.id === policiesConfig.default_policy_id || p.key === policiesConfig.default_policy_id)) {
      setCurrentKey(policiesConfig.default_policy_id);
    } else if (activePolicies.length > 0) {
      setCurrentKey(activePolicies[0].key || activePolicies[0].id);
    }
  }, [isOpen, selectedPolicyKey, policiesConfig]);

  // Lock body scroll when modal is open and handle Escape key
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

  if (!isOpen || activePolicies.length === 0) {
    return null;
  }

  const selectedPolicy =
    activePolicies.find((p) => p.key === currentKey || p.id === currentKey) ||
    activePolicies[0];

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="policies-modal-title"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="relative w-full max-w-3xl bg-[#FBF8F3] rounded-[24px] border border-[#E5D8C9] shadow-2xl overflow-hidden my-auto z-10 flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#E5D8C9] bg-[#F4ECE2]/80 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#EADCCB] flex items-center justify-center text-[#6F584A]">
                <FileText className="w-4 h-4 text-[#C6A36A]" />
              </div>
              <div>
                <h2
                  id="policies-modal-title"
                  className="text-lg sm:text-xl font-bold font-heading text-[#2F2B28]"
                >
                  {policiesConfig?.section_title_ar || 'معلومات وسياسات المتجر'}
                </h2>
                <p className="text-xs text-[#8A7465]">
                  معايير الخدمة وضمانات التسوق الآمن في بوتيك ميني بازار
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full text-[#6F584A] hover:bg-[#E7D4BC] transition-colors focus:outline-none focus:ring-2 focus:ring-[#C6A36A]"
              aria-label="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Policy Switcher Tabs (Horizontal scrollable pill list) */}
          <div className="px-6 py-3 border-b border-[#E5D8C9] bg-[#FAF5EE] overflow-x-auto no-scrollbar shrink-0">
            <div className="flex items-center gap-2 min-w-max">
              {activePolicies.map((pol) => {
                const isCurrent = pol.key === selectedPolicy.key || pol.id === selectedPolicy.id;
                return (
                  <button
                    key={pol.id}
                    onClick={() => setCurrentKey(pol.key || pol.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                      isCurrent
                        ? 'bg-[#2F2B28] text-[#F5E9D8] shadow-xs scale-102'
                        : 'bg-white text-[#5F5751] hover:bg-[#F4ECE2] border border-[#D9C1A7]'
                    }`}
                  >
                    <span>{pol.footer_link_text_ar || pol.title_ar}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Policy Content - Text Only */}
          <div className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1 text-right">
            {/* Policy Title & Last Updated Tag */}
            <div className="pb-4 border-b border-[#E5D8C9] flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base sm:text-lg font-bold font-heading text-[#6F584A]">
                {selectedPolicy.title_ar}
              </h3>

              {selectedPolicy.show_last_updated && selectedPolicy.last_updated && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4ECE2] text-[#8A7465] text-[11px] font-medium border border-[#D9C1A7]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>تاريخ آخر تحديث: {selectedPolicy.last_updated}</span>
                </div>
              )}
            </div>

            {/* Policy Body Text */}
            <div className="space-y-4 text-xs sm:text-sm leading-relaxed text-[#3D3733]">
              {selectedPolicy.content_ar
                .split('\n\n')
                .filter((p) => p.trim())
                .map((paragraph, idx) => {
                  const trimmed = paragraph.trim();
                  // Check if it's a section header (e.g. starts with digit or short title)
                  const isNumberedHeading = /^\d+\.\s+/.test(trimmed);

                  return (
                    <div key={idx} className="space-y-1">
                      {isNumberedHeading ? (
                        <div className="pt-2">
                          <p className="font-bold text-[#6F584A] text-sm">
                            {trimmed.split('\n')[0]}
                          </p>
                          {trimmed.split('\n').slice(1).length > 0 && (
                            <p className="text-[#4A423D] leading-relaxed pt-1 whitespace-pre-line">
                              {trimmed.split('\n').slice(1).join('\n')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-line text-[#4A423D]">
                          {trimmed}
                        </p>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-[#E5D8C9] bg-[#F4ECE2]/60 flex items-center justify-between shrink-0">
            <span className="text-[11px] text-[#8A7465]">
              جميع الحقوق والشروط خاضعة للأنظمة المعتمدة في المملكة العربية السعودية
            </span>

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-[#2F2B28] hover:bg-[#231F1D] text-[#F5E9D8] text-xs font-bold transition-all shadow-xs"
            >
              تمت القراءة وإغلاق
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
