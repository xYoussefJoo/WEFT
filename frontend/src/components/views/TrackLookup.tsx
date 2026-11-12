'use client';

import React, { useState, FormEvent } from 'react';
import { useWeftStore } from '@/store/useWeftStore';
import { ApiError, errorText } from '@/lib/api';
import { lookupOrder, type PublicOrder } from '@/lib/shop';
import { OrderDetails } from '@/components/views/TrackOrderView';

// "Track your order": the order number plus the phone or email used at checkout.
export default function TrackLookup() {
  const t = useWeftStore((state) => state.t);
  const [number, setNumber] = useState('');
  const [contact, setContact] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [order, setOrder] = useState<PublicOrder | null>(null);

  const find = async (e?: FormEvent) => {
    e?.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      setOrder(await lookupOrder(number.trim(), contact.trim()));
    } catch (err) {
      setOrder(null);
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  const input = 'w-full border border-[#e6e3dd] rounded-xl px-4 py-3 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#7a6b58]';
  return (
    <div className="space-y-6">
      <form onSubmit={find} className="bg-white rounded-3xl border border-[#e6e3dd] p-5 sm:p-7 shadow-xs space-y-4">
        <div>
          <h3 className="text-xl font-serif font-bold text-[#141414]">{t('تتبع طلبك', 'Track your order')}</h3>
          <p className="text-sm text-[#6e6a63] mt-1">{t('رقم الطلب مع رقم الموبايل أو البريد الذي استخدمته عند الطلب.', 'Your order number with the phone or email you used when ordering.')}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.4fr_auto] gap-3 sm:items-end">
          <label className="flex flex-col gap-1.5 text-sm font-bold text-[#2a2a28]">
            <span>{t('رقم الطلب', 'Order number')}</span>
            <input required dir="ltr" value={number} onChange={(e) => setNumber(e.target.value)} placeholder="WF-10234" maxLength={20} className={input} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-bold text-[#2a2a28]">
            <span>{t('الموبايل أو البريد الإلكتروني', 'Phone or email')}</span>
            <input required dir="ltr" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="01012345678 / name@gmail.com" maxLength={254} autoComplete="email" className={input} />
          </label>
          <button type="submit" disabled={busy} className="px-7 py-3 rounded-full bg-[#141414] hover:bg-[#7a6b58] disabled:opacity-60 text-white text-sm font-bold cursor-pointer">
            {busy ? '…' : t('تتبع', 'Track')}
          </button>
        </div>
        {error ? (
          <p role="alert" className="text-sm font-bold text-[#a72f3e]">
            {error instanceof ApiError && error.status === 404
              ? t('لم نجد طلبًا بهذا الرقم وهذه البيانات. تأكد من رقم الطلب والموبايل أو البريد.', "We couldn't find an order with these details. Check the order number and the phone or email.")
              : error instanceof ApiError && error.status === 429
                ? t('محاولات كثيرة. حاول بعد دقيقة.', 'Too many tries. Please wait a minute.')
                : errorText(error, t)}
          </p>
        ) : null}
      </form>
      {order && <OrderDetails order={order} />}
    </div>
  );
}
