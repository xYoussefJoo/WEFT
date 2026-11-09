'use client';

import React, { useEffect } from 'react';
import { useWeftStore } from '@/store/useWeftStore';
import { useApi } from '@/lib/useApi';
import { ApiError, errorText } from '@/lib/api';
import { pick, rememberOrder, statusLabel, trackOrder, type PublicOrder } from '@/lib/shop';

// /track/[number]?t=… — the page every order email links to. The token is the key; no login.
export default function TrackOrderView() {
  const tracking = useWeftStore((state) => state.tracking);
  const t = useWeftStore((state) => state.t);
  const go = useWeftStore((state) => state.go);
  const number = tracking?.number ?? '';
  const token = tracking?.token ?? '';
  const { data, error, loading, reload } = useApi(() => trackOrder(number, token), [number, token], !!number && !!token);

  // Opening a tracking link on a new device adds the order to "My orders" there too.
  useEffect(() => {
    if (data) rememberOrder({ number: data.number, token, createdAt: data.createdAt });
  }, [data, token]);

  if (!number || !token || (error instanceof ApiError && error.status === 404)) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-20 text-center space-y-4 animate-scale-in">
        <span className="text-5xl block animate-float select-none">🔍</span>
        <h2 className="text-2xl font-serif font-bold text-[#142b4a]">{t('لم يتم العثور على الطلب', 'Order not found')}</h2>
        <p className="text-sm text-[#77808b]">
          {t('تأكدي من استخدام الرابط كما وصلكِ في الرسالة بالكامل.', 'Check that you opened the full link from your message.')}
        </p>
        <button type="button" onClick={() => go('orders')} className="px-7 py-3 rounded-full bg-[#142b4a] hover:bg-[#b99664] text-white text-sm font-bold cursor-pointer">
          {t('طلباتي', 'My orders')}
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-[760px] mx-auto px-4 py-20 text-center space-y-4">
        <p className="text-sm font-bold text-[#a72f3e]">{errorText(error, t)}</p>
        <button type="button" onClick={reload} className="px-6 py-2.5 rounded-full bg-[#142b4a] text-white text-xs font-bold cursor-pointer">
          {t('إعادة المحاولة', 'Try again')}
        </button>
      </div>
    );
  }

  if (loading || !data) {
    return (
      <div className="max-w-[860px] mx-auto px-4 sm:px-6 py-12 space-y-4 animate-pulse" aria-busy="true">
        <div className="h-10 bg-[#f1ebe0] rounded w-1/2" />
        <div className="h-40 bg-[#f7f3eb] rounded-3xl" />
        <div className="h-56 bg-[#f7f3eb] rounded-3xl" />
      </div>
    );
  }

  return <OrderDetails order={data} />;
}

function OrderDetails({ order }: { order: PublicOrder }) {
  const lang = useWeftStore((state) => state.lang);
  const t = useWeftStore((state) => state.t);
  const money = useWeftStore((state) => state.money);
  const go = useWeftStore((state) => state.go);

  const date = (iso: string) =>
    new Date(iso).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  return (
    <section className="max-w-[860px] mx-auto px-4 sm:px-6 py-12 space-y-6 animate-scale-in">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-4 border-b border-[#e8dfd1]">
        <div>
          <span className="text-xs text-[#b99664] font-bold tracking-[0.2em] uppercase">{t('تتبع الطلب', 'ORDER TRACKING')}</span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#142b4a] mt-1" dir="ltr">{order.number}</h2>
          <p className="text-xs text-[#77808b] mt-1">{date(order.createdAt)}</p>
        </div>
        <span className="self-start sm:self-auto px-4 py-2 rounded-full text-sm font-bold bg-[#142b4a] text-white">
          {t(...statusLabel[order.status])}
        </span>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-3xl border border-[#e8e3d9] p-6 sm:p-7 shadow-xs">
        <h3 className="text-base font-bold text-[#142b4a] mb-4">{t('مراحل الطلب', 'Order progress')}</h3>
        <ol className="space-y-3">
          {order.timeline.map((step, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className={`mt-1 w-3 h-3 rounded-full shrink-0 ${i === order.timeline.length - 1 ? 'bg-[#b99664]' : 'bg-[#142b4a]/40'}`} />
              <div className="flex-1 flex flex-wrap justify-between gap-2 text-sm">
                <b className="text-[#142b4a]">{t(...statusLabel[step.to])}</b>
                <span className="text-xs text-[#77808b]">{date(step.at)}</span>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* What was ordered */}
      <div className="bg-white rounded-3xl border border-[#e8e3d9] p-6 sm:p-7 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#142b4a]">{t('القطع', 'Items')}</h3>
            <div className="divide-y divide-[#e8dfd1]">
              {order.lines.map((l) => (
                <div key={l.variantId} className="py-3 flex items-center gap-3">
                  <div className="w-14 h-16 rounded-lg overflow-hidden bg-[#f7f3eb] shrink-0 flex items-center justify-center">
                    {l.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={l.imageUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span aria-hidden="true">👕</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-sm">
                    <b className="block text-[#142b4a] truncate">{pick(lang, l.productNameAr, l.productNameEn)}</b>
                    <span className="text-xs text-[#77808b]">
                      {l.size} · {pick(lang, l.colorNameAr, l.colorNameEn)} · {money(l.unitPrice)} × {l.qty}
                    </span>
                  </div>
                  <b className="text-sm text-[#142b4a]">{money(l.lineTotal)}</b>
                </div>
              ))}
            </div>
            <div className="space-y-2 pt-3 border-t border-[#e8dfd1] text-sm">
              <div className="flex justify-between text-[#5e605b]"><span>{t('المنتجات', 'Subtotal')}</span><b className="text-[#142b4a]">{money(order.subtotal)}</b></div>
              <div className="flex justify-between text-[#5e605b]"><span>{t('التوصيل', 'Delivery')}</span><b className="text-[#142b4a]">{money(order.deliveryFee)}</b></div>
              <div className="flex justify-between font-bold"><span className="text-[#142b4a]">{t('الإجمالي', 'Total')}</span><b className="text-lg text-[#b99664]">{money(order.total)}</b></div>
            </div>
      </div>

      {/* Delivery and payment */}
      <div className="bg-[#f7f3eb] rounded-3xl border border-[#e8dfd1] p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div><span className="block text-xs text-[#77808b]">{t('الاسم', 'Name')}</span><b className="text-[#142b4a]">{order.customer.name}</b></div>
        <div><span className="block text-xs text-[#77808b]">{t('الموبايل', 'Phone')}</span><b className="text-[#142b4a]" dir="ltr">{order.customer.phone}</b></div>
        <div><span className="block text-xs text-[#77808b]">{t('المحافظة', 'Governorate')}</span><b className="text-[#142b4a]">{pick(lang, order.customer.zone.nameAr, order.customer.zone.nameEn)}</b></div>
        <div className="sm:col-span-3 text-xs text-[#77808b]">
          {t('الدفع عند الاستلام', 'Cash on delivery')} · {order.paymentStatus === 'Paid' ? t('تم الدفع', 'Paid') : t('لم يتم الدفع بعد', 'Not paid yet')}
        </div>
      </div>

      <div className="text-center">
        <button type="button" onClick={() => go('orders')} className="text-sm font-bold text-[#142b4a] hover:text-[#b99664] cursor-pointer">
          {t('← كل طلباتي', '← All my orders')}
        </button>
      </div>
    </section>
  );
}
