'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWeftStore } from '@/store/useWeftStore';

export default function Toast() {
  const toast = useWeftStore((state) => state.toast);
  const hideToast = useWeftStore((state) => state.hideToast);
  const go = useWeftStore((state) => state.go);
  const t = useWeftStore((state) => state.t);

  const [isExiting, setIsExiting] = useState(false);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!toast) return;

    // Auto-dismiss: after 3.8s, trigger exit animation (.animate-toast-out), then hide toast
    const autoDismissTimer = setTimeout(() => {
      setIsExiting(true);
      exitTimerRef.current = setTimeout(() => {
        hideToast();
        setIsExiting(false);
      }, 350);
    }, 3800);

    return () => {
      clearTimeout(autoDismissTimer);
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current);
      }
    };
  }, [toast, hideToast]);

  const handleDismiss = () => {
    setIsExiting(true);
    if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    exitTimerRef.current = setTimeout(() => {
      hideToast();
      setIsExiting(false);
    }, 350);
  };

  const handleViewCart = () => {
    handleDismiss();
    go('cart');
  };

  if (!toast) return null;

  const isError = toast.type === 'error';

  return (
    <div
      className={`fixed top-24 end-4 sm:end-6 z-50 max-w-sm w-full pointer-events-none ${
        isExiting ? 'animate-toast-out' : 'animate-toast-enter'
      }`}
      aria-live="polite"
      aria-atomic="true"
    >
      <div
        className={`pointer-events-auto flex items-center gap-3 p-3.5 sm:p-4 rounded-xl bg-[#f1efeb] border border-[#a39b90] border-s-4 shadow-xl text-[#141414] ${
          isError ? 'border-s-[#a34c3c]' : 'border-s-[#6b5d4c]'
        }`}
        role="status"
      >
        <span
          className={`w-8 h-8 rounded-full flex items-center justify-center font-extrabold text-sm text-white flex-shrink-0 ${
            isError ? 'bg-[#a34c3c]' : 'bg-[#141414]'
          }`}
          aria-hidden="true"
        >
          {isError ? '!' : '✓'}
        </span>

        <div className="flex-1 min-w-0">
          <strong className="block text-xs font-bold text-[#141414]">
            {isError ? t('تنبيه', 'Notice') : t('تم بنجاح', 'Success')}
          </strong>
          <span className="block text-xs text-[#5d5b57] leading-relaxed break-words">
            {toast.message}
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {toast.showCartLink && (
            <button
              type="button"
              className="bg-[#141414] hover:bg-[#2b2926] text-white text-xs font-bold px-2.5 py-1.5 rounded-md transition-colors cursor-pointer whitespace-nowrap"
              onClick={handleViewCart}
            >
              {t('عرض السلة', 'View cart')}
            </button>
          )}

          <button
            type="button"
            className="text-[#141414] hover:opacity-75 p-1 text-xl leading-none cursor-pointer"
            aria-label={t('إغلاق الإشعار', 'Dismiss notification')}
            onClick={handleDismiss}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}
