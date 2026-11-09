'use client';

import React, { useState, FormEvent } from 'react';
import { useWeftStore } from '@/store/useWeftStore';
import { useApi } from '@/lib/useApi';
import { ApiError } from '@/lib/api';
import { savedOrders, statusLabel, trackOrder, type SavedOrder } from '@/lib/shop';

// "My orders": the orders placed on this device (number + tracking token in local storage), each with its live status.
export default function OrdersView() {
  const t = useWeftStore((state) => state.t);
  const go = useWeftStore((state) => state.go);
  const openTracking = useWeftStore((state) => state.openTracking);
  const [orders] = useState<SavedOrder[]>(() => savedOrders());
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState(false);

  // Paste the link from the confirmation email: https://…/track/WF-10234?t=…
  const openLink = (e: FormEvent) => {
    e.preventDefault();
    try {
      const url = new URL(link.trim(), window.location.origin);
      const match = url.pathname.match(/\/track\/([^/]+)/);
      const token = url.searchParams.get('t');
      if (match && token) {
        openTracking(decodeURIComponent(match[1]), token);
        return;
      }
    } catch {}
    setLinkError(true);
  };

  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-12 space-y-8 animate-scale-in">
      <div className="pb-4 border-b border-[#e6e3dd]">
        <span className="text-xs text-[#7a6b58] font-bold tracking-[0.2em] uppercase">HISTORY</span>
        <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#141414] mt-1">{t('طلباتي', 'My orders')}</h2>
        <p className="text-xs sm:text-sm text-[#6e6a63] mt-0.5">
          {t('الطلبات التي أرسلتها من هذا الجهاز، بحالتها الحالية', 'Orders placed from this device, with their current status')}
        </p>
      </div>

      <form onSubmit={openLink} className="bg-[#f5f3ef] rounded-2xl border border-[#e6e3dd] p-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <label htmlFor="track-link" className="text-xs font-bold text-[#141414] shrink-0">
          {t('لديك رابط تتبع من البريد؟', 'Have a tracking link from your email?')}
        </label>
        <input
          id="track-link"
          value={link}
          onChange={(e) => {
            setLink(e.target.value);
            setLinkError(false);
          }}
          dir="ltr"
          placeholder="https://…/track/WF-10234?t=…"
          className="flex-1 border border-[#e6e3dd] rounded-xl px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7a6b58]"
        />
        <button type="submit" className="px-5 py-2.5 rounded-full bg-[#141414] hover:bg-[#7a6b58] text-white text-xs font-bold cursor-pointer">
          {t('فتح الطلب', 'Open order')}
        </button>
        {linkError && (
          <small role="alert" className="text-xs font-bold text-[#a72f3e]">
            {t('الرابط غير صحيح', "That link isn't a tracking link")}
          </small>
        )}
      </form>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((o) => (
            <OrderRow key={o.number} order={o} onOpen={() => openTracking(o.number, o.token)} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#e6e3dd] p-16 text-center text-[#6e6a63] space-y-4 shadow-xs">
          <span className="text-5xl block animate-float select-none">📦</span>
          <h3 className="text-xl font-serif font-bold text-[#141414]">{t('لا توجد طلبات سابقة', 'No previous orders')}</h3>
          <p className="text-xs text-[#6e6a63] max-w-sm mx-auto">
            {t(
              'عند إتمام أي طلب ستتمكن من متابعة حالته وتفاصيله هنا.',
              'When you place an order, you will see it here.',
            )}
          </p>
          <div className="pt-2">
            <button
              type="button"
              className="px-7 py-3 rounded-full bg-[#141414] hover:bg-[#7a6b58] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              onClick={() => go('shop')}
            >
              {t('تصفح المجموعة ↗', 'Explore collection ↗')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function OrderRow({ order, onOpen }: { order: SavedOrder; onOpen: () => void }) {
  const t = useWeftStore((state) => state.t);
  const money = useWeftStore((state) => state.money);
  const lang = useWeftStore((state) => state.lang);
  const { data, error, loading } = useApi(() => trackOrder(order.number, order.token), [order.number, order.token]);
  const gone = error instanceof ApiError && error.status === 404;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full text-start bg-white rounded-3xl border border-[#e6e3dd] p-6 sm:p-7 shadow-xs hover:shadow-md transition-all duration-300 space-y-3 cursor-pointer"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <b className="font-mono text-base sm:text-lg font-bold text-[#141414]" dir="ltr">{order.number}</b>
        </div>
        <span className="inline-block px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#f5f3ef] text-[#141414] border border-[#e6e3dd]">
          {data ? t(...statusLabel[data.status]) : loading ? '…' : gone ? t('غير متاح', 'Unavailable') : t('تعذر التحديث', "Couldn't refresh")}
        </span>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#e6e3dd] text-xs text-[#6e6a63]">
        <span>{new Date(data?.createdAt ?? order.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}</span>
        <span className="text-base font-extrabold text-[#7a6b58]">
          {data && money(data.total)}
        </span>
      </div>
    </button>
  );
}
