'use client';

import React, { useRef, useState, FormEvent } from 'react';
import { useWeftStore } from '@/store/useWeftStore';
import { hoodiePhoto } from '@/lib/labels';
import { useApi } from '@/lib/useApi';
import { ApiError, errorText, fieldError } from '@/lib/api';
import { getDeliveryZones, newKey, pick, placeOrder, rememberOrder } from '@/lib/shop';

type Shortage = { variantId: number; requested: number; available: number };

export default function CartView() {
  const lang = useWeftStore((state) => state.lang);
  const cart = useWeftStore((state) => state.cart);
  const removeFromCart = useWeftStore((state) => state.removeFromCart);
  const setCartQty = useWeftStore((state) => state.setCartQty);
  const clearCart = useWeftStore((state) => state.clearCart);
  const openTracking = useWeftStore((state) => state.openTracking);
  const go = useWeftStore((state) => state.go);
  const subtotal = useWeftStore((state) => state.getSubtotal());
  const money = useWeftStore((state) => state.money);
  const t = useWeftStore((state) => state.t);
  const showToast = useWeftStore((state) => state.showToast);

  const zones = useApi(getDeliveryZones, []);

  const [customer, setCustomer] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [zoneId, setZoneId] = useState<number | ''>('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<unknown>();
  const [serverTotal, setServerTotal] = useState<number | null>(null); // after 409 PRICE_CHANGED
  // One key per attempt: kept after a network error so a retry can't create a second order.
  const keyRef = useRef<string | null>(null);

  const zone = zones.data?.find((z) => z.id === zoneId);
  const delivery = zone?.fee ?? 0;
  const total = subtotal + delivery;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (!confirm || !zone) {
      showToast(t('يرجى اختيار المحافظة وتأكيد بيانات الطلب', 'Please choose your governorate and confirm your details'), 'error');
      return;
    }
    keyRef.current ??= newKey();
    setSending(true);
    setError(undefined);
    try {
      const placed = await placeOrder(
        {
          customer: {
            name: customer.trim(),
            phone: phone.trim(),
            email: email.trim() || null,
            deliveryZoneId: zone.id,
            city: city.trim(),
            address: address.trim(),
            notes: notes.trim() || null,
          },
          lines: cart.map((l) => ({ variantId: l.variantId, qty: l.qty })),
          paymentMethod: 'CashOnDelivery',
          expectedTotal: serverTotal ?? total,
          acceptTerms: true,
        },
        keyRef.current,
      );
      keyRef.current = null;
      rememberOrder({ number: placed.number, token: placed.trackingToken, createdAt: new Date().toISOString() });
      clearCart();
      setServerTotal(null);
      showToast(t(`تم استلام طلبك رقم ${placed.number}، ولم يتم تحصيل أي مبلغ`, `Order ${placed.number} received. No payment collected`), 'success');
      openTracking(placed.number, placed.trackingToken);
    } catch (err) {
      setError(err);
      if (err instanceof ApiError && err.status !== 0) keyRef.current = null; // answered: the next try is a new attempt
      if (err instanceof ApiError && err.code === 'OUT_OF_STOCK') {
        // Fit the bag to what's left and say so.
        const items = (err.problem.items as Shortage[] | undefined) ?? [];
        for (const s of items) {
          if (s.available <= 0) removeFromCart(s.variantId);
          else setCartQty(s.variantId, s.available);
        }
        setServerTotal(null);
      } else if (err instanceof ApiError && err.code === 'PRICE_CHANGED') {
        setServerTotal(Number(err.problem.total));
      }
    } finally {
      setSending(false);
    }
  };

  const errorMessage = () => {
    if (!(error instanceof ApiError)) return error ? errorText(error, t) : '';
    switch (error.code) {
      case 'OUT_OF_STOCK':
        return t('بعض القطع لم تعد متوفرة بالكمية المطلوبة، وتم تعديل حقيبتك. راجعها ثم أرسل الطلب مرة أخرى.', 'Some pieces are no longer available in that quantity, so your bag was updated. Check it and submit again.');
      case 'PRICE_CHANGED':
        return t(`تغير السعر أو رسوم التوصيل. الإجمالي الجديد ${money(serverTotal)} — اضغط إرسال للموافقة عليه.`, `The price or delivery fee changed. New total ${money(serverTotal)} — press submit to accept it.`);
      case 'VALIDATION_FAILED':
        // Field errors show under each field; a rule without a field (e.g. the phone format) shows its own message.
        return error.problem.errors ? t('راجع الحقول المظللة بالأحمر.', 'Please check the fields marked in red.') : errorText(error, t);
      default:
        return errorText(error, t);
    }
  };

  const inputClasses =
    'border border-[#e6e3dd] rounded-xl p-3 bg-white text-[#141414] text-sm focus:outline-none focus:ring-2 focus:ring-[#7a6b58] focus:border-[#7a6b58] transition-all';
  const fieldMsg = (name: string) => {
    const msg = fieldError(error, name);
    return msg ? <small className="text-[11px] font-semibold text-[#a72f3e]">{msg}</small> : null;
  };

  return (
    <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-12 space-y-8 animate-scale-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-[#e6e3dd] gap-4">
        <div>
          <span className="text-xs text-[#7a6b58] font-bold tracking-[0.2em] uppercase">SHOPPING BAG</span>
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#141414] mt-1">{t('حقيبة التسوق وإتمام الطلب', 'Your bag & checkout')}</h2>
          <p className="text-xs sm:text-sm text-[#77736c] mt-0.5">
            {t('راجع محتويات حقيبتك وبيانات التوصيل قبل إرسال الطلب للمتجر', 'Review your selected pieces and delivery information')}
          </p>
        </div>
        <button
          type="button"
          className="px-5 py-2.5 rounded-full border border-[#141414] bg-transparent hover:bg-[#141414] hover:text-white text-[#141414] text-xs font-bold transition-all duration-200 cursor-pointer self-start sm:self-auto"
          onClick={() => go('shop')}
        >
          {t('متابعة التسوق ↗', 'Continue shopping ↗')}
        </button>
      </div>

      {cart.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 bg-white rounded-3xl border border-[#e6e3dd] p-6 sm:p-8 space-y-8 shadow-xs">
            <div>
              <h3 className="text-lg font-serif font-bold text-[#141414] pb-4 border-b border-[#e6e3dd]">
                {t('القطع المختارة', 'Selected items')} ({cart.length})
              </h3>

              <div className="divide-y divide-[#e6e3dd]">
                {cart.map((c) => (
                  <div key={c.variantId} className="py-4 first:pt-4 last:pb-2 flex items-center gap-4 group">
                    <div className="w-18 h-22 rounded-xl overflow-hidden bg-[#f5f3ef] border border-[#e6e3dd] shrink-0 flex items-center justify-center">
                      {c.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={c.imageUrl} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={hoodiePhoto(c.colorNameEn)} alt="" className="w-full h-full object-contain p-1 mix-blend-multiply" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <b className="block text-sm font-bold text-[#141414] truncate">{pick(lang, c.nameAr, c.nameEn)}</b>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#77736c]">
                        <span className="bg-[#f5f3ef] px-2 py-0.5 rounded text-[#141414] font-semibold">{c.size}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: c.colorHex }} />
                          {pick(lang, c.colorNameAr, c.colorNameEn)}
                        </span>
                        <span>·</span>
                        <span className="font-bold text-[#7a6b58]">{money(c.price)}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setCartQty(c.variantId, c.qty - 1)}
                          disabled={c.qty <= 1}
                          aria-label={t('تقليل الكمية', 'Decrease quantity')}
                          className="w-7 h-7 rounded-lg bg-[#f5f3ef] text-[#141414] font-bold hover:bg-[#eee9e1] disabled:opacity-40 cursor-pointer"
                        >
                          −
                        </button>
                        <span className="w-7 text-center text-sm font-bold text-[#141414]" aria-live="polite">{c.qty}</span>
                        <button
                          type="button"
                          onClick={() => setCartQty(c.variantId, c.qty + 1)}
                          disabled={c.qty >= Math.min(10, c.stock ?? 10)}
                          aria-label={t('زيادة الكمية', 'Increase quantity')}
                          className="w-7 h-7 rounded-lg bg-[#f5f3ef] text-[#141414] font-bold hover:bg-[#eee9e1] disabled:opacity-40 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="px-3 py-1.5 rounded-lg border border-[#e6e3dd] hover:border-red-400 hover:bg-red-50 hover:text-red-700 text-xs font-bold text-[#77736c] transition-colors cursor-pointer shrink-0"
                      onClick={() => removeFromCart(c.variantId)}
                    >
                      {t('حذف', 'Remove')}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-serif font-bold text-[#141414] pb-3 border-b border-[#e6e3dd]">{t('بيانات الاستلام والشحن', 'Delivery details')}</h3>

              <form id="checkout-form" className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4" onSubmit={handleSubmit} noValidate={false}>
                <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-bold text-[#2a2a28]">
                  <span>{t('الاسم بالكامل', 'Full name')} *</span>
                  <input name="customer" required minLength={3} maxLength={100} autoComplete="name" value={customer}
                    onChange={(e) => setCustomer(e.target.value)} className={inputClasses} placeholder={t('اسم المستلم', 'Recipient name')} />
                  {fieldMsg('customer.name')}
                </label>

                <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-bold text-[#2a2a28]">
                  <span>{t('رقم الموبايل', 'Mobile number')} *</span>
                  <input name="phone" required type="tel" inputMode="tel" pattern="[0-9+ ()\-]{10,20}" autoComplete="tel" dir="ltr"
                    value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClasses} placeholder="01xxxxxxxxx" />
                  {fieldMsg('customer.phone')}
                </label>

                <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-bold text-[#2a2a28]">
                  <span>{t('المحافظة', 'Governorate')} *</span>
                  <select name="zone" required value={zoneId} onChange={(e) => setZoneId(e.target.value ? Number(e.target.value) : '')}
                    className={`${inputClasses} cursor-pointer`} disabled={zones.loading && !zones.data}>
                    <option value="">{zones.error ? t('تعذر تحميل المحافظات', "Couldn't load governorates") : t('اختر المحافظة', 'Choose governorate')}</option>
                    {zones.data?.map((z) => (
                      <option key={z.id} value={z.id}>
                        {pick(lang, z.nameAr, z.nameEn)} — {money(z.fee)}
                      </option>
                    ))}
                  </select>
                  {zone && (
                    <small className="text-[11px] font-semibold text-[#77736c]">
                      {t(`التوصيل خلال ${zone.etaDaysMin}–${zone.etaDaysMax} أيام`, `Delivery in ${zone.etaDaysMin}–${zone.etaDaysMax} days`)}
                    </small>
                  )}
                  {zones.error ? (
                    <button type="button" onClick={zones.reload} className="text-[11px] font-bold text-[#7a6b58] text-start cursor-pointer">
                      {t('إعادة المحاولة', 'Try again')}
                    </button>
                  ) : null}
                </label>

                <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-bold text-[#2a2a28]">
                  <span>{t('المدينة / المنطقة', 'City / district')} *</span>
                  <input name="city" required maxLength={100} value={city} onChange={(e) => setCity(e.target.value)}
                    className={inputClasses} placeholder={t('مثال: المعادي، مصر الجديدة...', 'e.g. Maadi, Heliopolis')} />
                  {fieldMsg('customer.city')}
                </label>

                <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-bold text-[#2a2a28] sm:col-span-2">
                  <span>{t('العنوان بالتفصيل (الشارع، رقم العمارة، الدور، الشقة)', 'Detailed address (Street, Building, Floor, Apt)')} *</span>
                  <textarea name="address" required minLength={10} maxLength={500} value={address} onChange={(e) => setAddress(e.target.value)}
                    className={`${inputClasses} min-h-[85px]`} placeholder={t('اكتب تفاصيل العنوان هنا بدقة...', 'Write detailed address here...')} />
                  {fieldMsg('customer.address')}
                </label>

                <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-bold text-[#2a2a28]">
                  <span>{t('البريد الإلكتروني (اختياري)', 'Email (optional)')}</span>
                  <input name="email" type="email" maxLength={254} autoComplete="email" dir="ltr" value={email} onChange={(e) => setEmail(e.target.value)}
                    className={inputClasses} placeholder="name@example.com" />
                  <small className="text-[11px] font-medium text-[#77736c]">
                    {t('نرسل لك رابط تتبع الطلب عليه', "We'll email you the tracking link")}
                  </small>
                  {fieldMsg('customer.email')}
                </label>

                <label className="flex flex-col gap-1.5 text-xs sm:text-sm font-bold text-[#2a2a28]">
                  <span>{t('ملاحظات للتوصيل (اختياري)', 'Delivery notes (optional)')}</span>
                  <textarea name="notes" maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)}
                    className={`${inputClasses} min-h-[70px]`} placeholder={t('أي ملاحظات لمندوب الشحن...', 'Notes for courier...')} />
                </label>

                <div className="sm:col-span-2 space-y-2 pt-2">
                  <span className="block text-xs sm:text-sm font-bold text-[#2a2a28]">{t('طريقة الدفع', 'Payment method')}</span>
                  <div className="flex items-center gap-3 border border-[#7a6b58]/40 rounded-2xl p-4 bg-[#faf9f7]">
                    <input type="radio" name="paymentMethod" value="cod" checked readOnly className="accent-[#141414] w-4 h-4" />
                    <div>
                      <b className="block text-sm font-bold text-[#141414]">{t('الدفع عند الاستلام', 'Cash on delivery')}</b>
                      <small className="block text-xs text-[#77736c] mt-0.5">
                        {t('يتم الدفع نقداً عند استلام الطلب ومراجعته', 'Pay in cash upon inspection and delivery of your items')}
                      </small>
                    </div>
                  </div>
                </div>

                <label className="sm:col-span-2 flex items-start gap-3 text-xs text-[#2a2a28] cursor-pointer pt-2 leading-relaxed">
                  <input type="checkbox" name="confirm" checked={confirm} onChange={(e) => setConfirm(e.target.checked)} required
                    className="accent-[#141414] w-4 h-4 mt-0.5 shrink-0 cursor-pointer" />
                  <span>
                    {t(
                      'أؤكد صحة بيانات الاستلام وأعلم أن فريق المتجر سيتواصل لتأكيد توفر القطع والتوصيل.',
                      'I confirm my delivery info and understand store staff will contact to confirm availability and dispatch.',
                    )}
                  </span>
                </label>

                {error ? (
                  <p role="alert" className="sm:col-span-2 text-xs font-bold text-[#a72f3e] bg-red-50 border border-red-200 rounded-xl p-3">
                    {errorMessage()}
                  </p>
                ) : null}

                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-4 rounded-full bg-[#141414] hover:bg-[#7a6b58] disabled:opacity-60 disabled:cursor-wait text-white text-sm font-bold shadow-md hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] cursor-pointer transition-all duration-300"
                  >
                    {sending ? t('جارٍ إرسال الطلب…', 'Sending your order…') : `${t('إرسال الطلب للمتجر', 'Submit order')} · ${money(serverTotal ?? total)}`}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <aside className="lg:col-span-4 bg-[#f5f3ef] rounded-3xl border border-[#e6e3dd] p-6 sm:p-7 space-y-4 lg:sticky lg:top-28 shadow-xs">
            <h3 className="text-lg font-serif font-bold text-[#141414] pb-3 border-b border-[#e6e3dd]">{t('ملخص الحساب', 'Order summary')}</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between text-[#5d5a55]">
                <span>{t('إجمالي المنتجات', 'Subtotal')}</span>
                <b className="text-[#141414] font-bold">{money(subtotal)}</b>
              </div>
              <div className="flex items-center justify-between text-[#5d5a55]">
                <span>{t('رسوم التوصيل', 'Delivery')}</span>
                <b className="text-[#141414] font-bold">{zone ? money(delivery) : t('اختر المحافظة', 'Choose governorate')}</b>
              </div>
              <div className="flex items-center justify-between text-base font-bold pt-3 border-t border-[#e6e3dd]">
                <strong className="text-[#141414]">{t('المجموع الكلي', 'Total')}</strong>
                <strong className="text-xl text-[#7a6b58]">{money(serverTotal ?? total)}</strong>
              </div>
            </div>
            <div className="pt-2 text-xs text-[#77736c] leading-relaxed border-t border-[#e6e3dd]/60">
              <p>{t('• السعر النهائي يحسبه المتجر عند الإرسال.', '• The store confirms the final price when you submit.')}</p>
              <p className="mt-1">{t('• الدفع عند الاستلام، ولا يتم تحصيل أي مبلغ الآن.', '• Cash on delivery: nothing is charged now.')}</p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-[#e6e3dd] p-16 text-center text-[#77736c] space-y-4 shadow-xs">
          <span className="text-5xl block animate-float select-none">🛍</span>
          <h3 className="text-xl font-serif font-bold text-[#141414]">{t('حقيبة التسوق فارغة', 'Your shopping bag is empty')}</h3>
          <p className="text-xs text-[#77736c] max-w-sm mx-auto">
            {t('اكتشف تشكيلة WEFT واختر الهودي المناسب لك.', 'Explore the WEFT collection and find your hoodie.')}
          </p>
          <div className="pt-2">
            <button
              type="button"
              className="px-7 py-3 rounded-full bg-[#141414] hover:bg-[#7a6b58] text-white text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer"
              onClick={() => go('shop')}
            >
              {t('تصفح المعروضات ↗', 'Start shopping ↗')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
