'use client';

import React, { useEffect, useState } from 'react';
import { useWeftStore } from '@/store/useWeftStore';
import { useApi, usePage } from '@/lib/useApi';
import { ApiError, errorText } from '@/lib/api';
import {
  changeOrderStatus, getAdminOrder, getAdminOrders, nextStatuses,
  type OrderStatus,
} from '@/lib/admin';
import { pick, statusLabel } from '@/lib/shop';
import { useConfirm } from '@/components/admin/ui';

const ALL_STATUSES = Object.keys(statusLabel) as OrderStatus[];

// #35–#38 — the order board and one order's details (opened from the board, the dashboard or an email link).
export default function AdminOrders() {
  const adminOrderId = useWeftStore((state) => state.adminOrderId);
  const setAdminOrderId = useWeftStore((state) => state.setAdminOrderId);
  if (adminOrderId) return <OrderDetail id={adminOrderId} onBack={() => setAdminOrderId(null)} />;
  return <OrderBoard onOpen={setAdminOrderId} />;
}

function OrderBoard({ onOpen }: { onOpen: (id: number) => void }) {
  const lang = useWeftStore((state) => state.lang);
  const money = useWeftStore((state) => state.money);
  const t = useWeftStore((state) => state.t);
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [search, setSearch] = useState('');
  const [q, setQ] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => setQ(search.trim()), 400);
    return () => clearTimeout(timer);
  }, [search]);
  const [page, setPage] = usePage(`${status}|${q}`);

  const { data, error, loading, reload } = useApi(
    () => getAdminOrders({ status: status ? [status] : undefined, q: q || undefined, page, pageSize: 20 }),
    [status, q, page],
  );
  const select = 'text-xs font-bold border border-[#e6e3dd] rounded-xl px-3 py-2 bg-white text-[#141414] cursor-pointer focus:ring-2 focus:ring-[#7a6b58] outline-none';

  return (
    <section className="bg-white rounded-3xl border border-[#e6e3dd] shadow-xs overflow-hidden">
      <div className="p-6 sm:p-7 border-b border-[#e6e3dd] bg-[#f8f7f4]/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-serif font-bold text-[#141414]">{t('سجل الطلبات', 'Order management')}</h3>
          <p className="text-xs text-[#77736c] mt-0.5">{data && t(`عدد النتائج: ${data.totalCount}`, `${data.totalCount} orders`)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label={t('الحالة', 'Status')} value={status} onChange={(e) => setStatus(e.target.value as OrderStatus | '')} className={select}>
            <option value="">{t('كل الحالات', 'All statuses')}</option>
            {ALL_STATUSES.map((s) => <option key={s} value={s}>{t(...statusLabel[s])}</option>)}
          </select>
          <input type="search" aria-label={t('بحث', 'Search')} placeholder={t('رقم الطلب أو الهاتف أو الاسم', 'Number, phone or name')}
            value={search} onChange={(e) => setSearch(e.target.value)} className={`${select} cursor-text w-56`} />
        </div>
      </div>

      {error ? (
        <div className="p-6 space-y-2">
          <p className="text-sm font-bold text-[#a72f3e]">{errorText(error, t)}</p>
          <button type="button" onClick={reload} className="px-4 py-2 rounded-lg bg-[#141414] text-white text-xs font-bold cursor-pointer">{t('إعادة المحاولة', 'Try again')}</button>
        </div>
      ) : !data ? (
        <div className="m-6 h-40 rounded-xl bg-[#f5f3ef] animate-pulse" />
      ) : data.items.length > 0 ? (
        <div className={`overflow-x-auto ${loading ? 'opacity-60' : ''}`}>
          <table className="w-full text-sm text-start">
            <thead className="bg-[#f5f3ef] text-[#77736c] text-[11px] uppercase tracking-wider border-b border-[#e6e3dd]">
              <tr>
                <th className="px-5 py-3.5 text-start font-bold">#</th>
                <th className="px-5 py-3.5 text-start font-bold">{t('العميل', 'Customer')}</th>
                <th className="px-5 py-3.5 text-start font-bold">{t('الإجمالي', 'Total')}</th>
                <th className="px-5 py-3.5 text-start font-bold">{t('الحالة', 'Status')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6e3dd]">
              {data.items.map((o) => (
                <tr key={o.id} onClick={() => onOpen(o.id)} className="hover:bg-[#f8f7f4] transition-colors duration-150 cursor-pointer">
                  <td className="px-5 py-4 font-mono text-xs text-[#141414] font-bold" dir="ltr">
                    {o.number}
                    <div className="text-[10px] text-[#77736c] font-sans font-normal">{new Date(o.createdAt).toLocaleDateString(lang === 'ar' ? 'ar-EG' : 'en-GB')}</div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-[#141414]">{o.customerName}</div>
                    <div className="text-xs text-[#77736c] mt-0.5" dir="ltr">{o.phone}</div>
                    <div className="text-xs text-[#77736c]">{pick(lang, o.zoneNameAr, o.zoneNameEn)}</div>
                  </td>
                  <td className="px-5 py-4 font-extrabold text-[#7a6b58]">
                    {money(o.total)}
                    <div className={`text-[11px] font-bold ${o.paymentStatus === 'Paid' ? 'text-green-700' : 'text-amber-800'}`}>
                      {o.paymentStatus === 'Paid' ? t('مدفوع', 'Paid') : t('غير مدفوع', 'Unpaid')}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-block px-3 py-1.5 rounded-full text-xs font-bold bg-[#f5f3ef] text-[#141414] border border-[#e6e3dd]">{t(...statusLabel[o.status])}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-3 p-4">
              <button type="button" disabled={page <= 1} onClick={() => setPage((n) => n - 1)} className="px-4 py-1.5 rounded-lg border border-[#cfcac2] text-xs font-bold disabled:opacity-40 cursor-pointer">{t('السابق', 'Previous')}</button>
              <span className="text-xs text-[#77736c]">{data.page} / {data.totalPages}</span>
              <button type="button" disabled={page >= data.totalPages} onClick={() => setPage((n) => n + 1)} className="px-4 py-1.5 rounded-lg border border-[#cfcac2] text-xs font-bold disabled:opacity-40 cursor-pointer">{t('التالي', 'Next')}</button>
            </nav>
          )}
        </div>
      ) : (
        <div className="py-20 text-center space-y-3">
          <span className="text-5xl block select-none">📋</span>
          <p className="text-base font-bold text-[#141414]">{t('لا توجد طلبات هنا', 'No orders here')}</p>
        </div>
      )}
    </section>
  );
}

function OrderDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const lang = useWeftStore((state) => state.lang);
  const money = useWeftStore((state) => state.money);
  const t = useWeftStore((state) => state.t);
  const showToast = useWeftStore((state) => state.showToast);
  const { data: order, error, reload } = useApi(() => getAdminOrder(id), [id]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const confirm = useConfirm();

  if (error) {
    return (
      <section className="bg-white rounded-2xl border border-[#e6e3dd] p-6 space-y-3">
        <p className="text-sm font-bold text-[#a72f3e]">
          {error instanceof ApiError && error.status === 404 ? t('الطلب غير موجود', 'Order not found') : errorText(error, t)}
        </p>
        <button type="button" onClick={onBack} className="px-4 py-2 rounded-lg border border-[#cfcac2] text-xs font-bold cursor-pointer">{t('← كل الطلبات', '← All orders')}</button>
      </section>
    );
  }
  if (!order) return <div className="h-64 rounded-2xl bg-[#f5f3ef] animate-pulse" />;

  const move = async (to: OrderStatus) => {
    if (to === 'Cancelled' && !(await confirm({
      title: t('إلغاء هذا الطلب؟', 'Cancel this order?'),
      message: t('ستعود القطع للمخزون.', 'Its pieces go back to stock.'),
      confirmLabel: t('إلغاء الطلب', 'Cancel order'), danger: true,
    }))) return;
    setBusy(true);
    try {
      await changeOrderStatus(order.id, to, note.trim() || null);
      setNote('');
      showToast(t('تم تحديث حالة الطلب', 'Order status updated'), 'success');
      reload();
    } catch (err) {
      showToast(err instanceof ApiError && err.code === 'INVALID_STATUS_TRANSITION' ? t('هذه الخطوة غير مسموحة الآن، تم تحديث الطلب', 'That step isn’t allowed now; the order was refreshed') : errorText(err, t), 'error');
      reload();
    } finally {
      setBusy(false);
    }
  };

  const date = (iso: string) => new Date(iso).toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
  const next = nextStatuses(order.status);
  const card = 'bg-white rounded-2xl border border-[#e6e3dd] p-6 shadow-2xs';

  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="text-xs font-bold text-[#141414] hover:text-[#7a6b58] cursor-pointer">{t('← كل الطلبات', '← All orders')}</button>

      <div className={`${card} flex flex-col sm:flex-row sm:items-center justify-between gap-3`}>
        <div>
          <h3 className="text-2xl font-serif font-bold text-[#141414]" dir="ltr">{order.number}</h3>
          <p className="text-xs text-[#77736c]">{date(order.createdAt)}</p>
        </div>
        <span className="self-start px-4 py-2 rounded-full text-sm font-bold bg-[#141414] text-white">{t(...statusLabel[order.status])}</span>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          {/* What was ordered */}
          <section className={`${card} space-y-3`}>
                <h4 className="font-bold text-[#141414]">{t('القطع', 'Items')}</h4>
                <div className="divide-y divide-[#eeebe6]">
                  {order.lines.map((l) => (
                    <div key={l.variantId} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0">
                        <b className="block text-[#141414] truncate">{pick(lang, l.productNameAr, l.productNameEn)}</b>
                        <span className="text-xs text-[#77736c]">{l.size} · {pick(lang, l.colorNameAr, l.colorNameEn)} · {money(l.unitPrice)} × {l.qty}</span>
                      </span>
                      <b className="text-[#141414] shrink-0">{money(l.lineTotal)}</b>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t border-[#e6e3dd] text-sm space-y-1">
                  <div className="flex justify-between"><span>{t('المنتجات', 'Subtotal')}</span><b>{money(order.subtotal)}</b></div>
                  <div className="flex justify-between"><span>{t('التوصيل', 'Delivery')}</span><b>{money(order.deliveryFee)}</b></div>
                  <div className="flex justify-between text-base"><b>{t('الإجمالي', 'Total')}</b><b className="text-[#7a6b58]">{money(order.total)}</b></div>
                </div>
          </section>

          {/* History */}
          <section className={`${card} space-y-3`}>
            <h4 className="font-bold text-[#141414]">{t('سجل الحالات', 'Status history')}</h4>
            <ol className="space-y-2.5">
              {order.history.map((h, i) => (
                <li key={i} className="text-sm flex flex-wrap justify-between gap-2 border-b border-[#f1efeb] pb-2 last:border-0">
                  <span><b className="text-[#141414]">{t(...statusLabel[h.to])}</b>{h.note ? <span className="text-[#5d5a55]"> — {h.note}</span> : null}</span>
                  <span className="text-xs text-[#77736c]">{date(h.at)}{h.changedBy ? ` · ${h.changedBy}` : ''}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <div className="space-y-5">
          {/* Customer */}
          <section className={`${card} space-y-2 text-sm`}>
            <h4 className="font-bold text-[#141414]">{t('العميل', 'Customer')}</h4>
            <p className="font-bold text-[#141414]">{order.customer.name}</p>
            <a href={`tel:${order.customer.phone}`} className="block text-[#7a6b58] font-bold" dir="ltr">{order.customer.phone}</a>
            {order.customer.email && <p className="text-xs text-[#5d5a55] break-all" dir="ltr">{order.customer.email}</p>}
            <p className="text-xs text-[#5d5a55]">{pick(lang, order.zone.nameAr, order.zone.nameEn)} · {order.customer.city}</p>
            <p className="text-xs text-[#5d5a55] whitespace-pre-line">{order.customer.address}</p>
            {order.customer.notes && <p className="text-xs italic text-[#77736c]">“{order.customer.notes}”</p>}
            <p className="text-xs pt-2 border-t border-[#f1efeb]">
              {t('الدفع عند الاستلام', 'Cash on delivery')} · <b className={order.paymentStatus === 'Paid' ? 'text-green-700' : 'text-amber-800'}>{order.paymentStatus === 'Paid' ? t('مدفوع', 'Paid') : t('غير مدفوع', 'Unpaid')}</b>
            </p>
          </section>

          {/* Next step */}
          {next.length > 0 && (
            <section className={`${card} space-y-3`}>
              <h4 className="font-bold text-[#141414]">{t('الخطوة التالية', 'Next step')}</h4>
              <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} placeholder={t('ملاحظة (اختياري)', 'Note (optional)')}
                className="w-full border border-[#e6e3dd] rounded-xl p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7a6b58]" />
              <div className="flex flex-wrap gap-2">
                {next.map((s) => (
                  <button key={s} type="button" disabled={busy} onClick={() => void move(s)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer disabled:opacity-50 ${s === 'Cancelled' ? 'border border-[#efc9c9] bg-[#fff7f7] text-[#a34c4c] hover:bg-rose-100' : 'bg-[#141414] text-white hover:bg-[#2b2926]'}`}>
                    {s === 'Cancelled' ? t('إلغاء الطلب', 'Cancel order') : `→ ${t(...statusLabel[s])}`}
                  </button>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}

