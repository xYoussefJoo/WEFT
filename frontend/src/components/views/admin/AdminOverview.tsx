'use client';

import React from 'react';
import { useWeftStore } from '@/store/useWeftStore';
import { useApi } from '@/lib/useApi';
import { errorText } from '@/lib/api';
import { getDashboard } from '@/lib/admin';
import { pick, statusLabel } from '@/lib/shop';

// #47 — what needs the owner's attention today.
export default function AdminOverview() {
  const lang = useWeftStore((state) => state.lang);
  const money = useWeftStore((state) => state.money);
  const setAdminTab = useWeftStore((state) => state.setAdminTab);
  const setAdminOrderId = useWeftStore((state) => state.setAdminOrderId);
  const openProductEditor = useWeftStore((state) => state.openProductEditor);
  const go = useWeftStore((state) => state.go);
  const t = useWeftStore((state) => state.t);
  const { data, error, loading, reload } = useApi(getDashboard, []);

  const openOrder = (id: number) => {
    setAdminTab('orders');
    setAdminOrderId(id);
  };

  if (error) {
    return (
      <div className="bg-white p-6 rounded-2xl border border-[#e8e6e1] space-y-3">
        <p className="text-sm font-bold text-[#a72f3e]">{errorText(error, t)}</p>
        <button type="button" onClick={reload} className="px-4 py-2 rounded-lg bg-[#141414] text-white text-xs font-bold cursor-pointer">{t('إعادة المحاولة', 'Try again')}</button>
      </div>
    );
  }

  const stats: [string, string, number | string | undefined, string][] = [
    ['طلبات اليوم', 'Orders today', data?.ordersToday, 'text-[#141414]'],
    ['بانتظار التأكيد', 'To confirm', data?.pendingConfirmation, 'text-[#6b5d4c]'],
    ['للتغليف', 'To pack', data?.toPack, 'text-[#141414]'],
    ['جاهز للشحن', 'Ready to ship', data?.readyToShip, 'text-emerald-800'],
    ['قيد التوصيل', 'Out for delivery', data?.outForDelivery, 'text-[#141414]'],
    ['مبيعات 30 يومًا (مسلّمة)', 'Delivered, last 30 days', data ? money(data.deliveredRevenueLast30Days) : undefined, 'text-emerald-800'],
  ];

  return (
    <div className="space-y-6" aria-busy={loading}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(([ar, en, value, color]) => (
          <div key={en} className="p-5 rounded-2xl bg-white border border-[#e8e6e1] shadow-2xs space-y-1">
            <span className="text-xs font-semibold text-[#77736c] uppercase block">{t(ar, en)}</span>
            <b className={`text-2xl sm:text-3xl font-serif font-bold ${color}`}>{value ?? '—'}</b>
          </div>
        ))}
      </div>

      <section className="bg-white p-6 sm:p-8 rounded-2xl border border-[#e8e6e1] shadow-2xs space-y-3">
        <h3 className="text-lg sm:text-xl font-serif font-bold text-[#141414]">{t('إدارة متجرك من مكان واحد', 'Your store, one workspace')}</h3>
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button type="button" className="px-4 py-2.5 rounded-lg bg-[#141414] hover:bg-[#2b2926] text-white text-xs font-bold transition-colors cursor-pointer" onClick={() => setAdminTab('orders')}>
            {t('الطلبات', 'Orders')}
          </button>
          <button type="button" className="px-4 py-2.5 rounded-lg border border-[#cfcac2] bg-white hover:bg-[#f5f3ef] text-xs font-bold text-[#141414] transition-colors cursor-pointer" onClick={() => openProductEditor()}>
            ＋ {t('إضافة منتج', 'Add product')}
          </button>
          <button type="button" className="px-4 py-2.5 rounded-lg border border-[#cfcac2] bg-white hover:bg-[#f5f3ef] text-xs font-bold text-[#141414] transition-colors cursor-pointer" onClick={() => setAdminTab('categories')}>
            ＋ {t('إنشاء قسم', 'Create category')}
          </button>
          <button type="button" className="px-4 py-2.5 rounded-lg border border-[#cfcac2] bg-white hover:bg-[#f5f3ef] text-xs font-bold text-[#141414] transition-colors cursor-pointer" onClick={() => go('shop')}>
            {t('معاينة المتجر', 'Preview shop')} ↗
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="bg-white p-6 rounded-2xl border border-[#e8e6e1] shadow-2xs space-y-3">
          <h3 className="text-lg font-serif font-bold text-[#141414]">{t('أحدث الطلبات', 'Latest orders')}</h3>
          {data && data.latestOrders.length === 0 && <p className="text-xs text-[#77736c]">{t('لا توجد طلبات بعد', 'No orders yet')}</p>}
          <div className="divide-y divide-[#eeebe6]">
            {data?.latestOrders.map((o) => (
              <button key={o.id} type="button" onClick={() => openOrder(o.id)} className="w-full py-2.5 flex items-center justify-between gap-3 text-start hover:bg-[#faf9f7] rounded-lg px-2 cursor-pointer">
                <span className="min-w-0">
                  <b className="block text-sm text-[#141414] font-mono" dir="ltr">{o.number}</b>
                  <span className="text-xs text-[#77736c] truncate block">{o.customerName} · {pick(lang, o.zoneNameAr, o.zoneNameEn)}</span>
                </span>
                <span className="text-end shrink-0">
                  <span className="block text-[11px] font-bold text-[#6b5d4c]">{t(...statusLabel[o.status])}</span>
                  <span className="text-xs font-bold text-[#141414]">{money(o.total)}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white p-6 rounded-2xl border border-[#e8e6e1] shadow-2xs space-y-3">
          <h3 className="text-lg font-serif font-bold text-[#141414]">{t('مخزون منخفض', 'Low stock')}</h3>
          {data && data.lowStock.length === 0 && <p className="text-xs text-[#77736c]">{t('كل المقاسات متوفرة بكمية جيدة', 'Every size is well stocked')}</p>}
          <div className="divide-y divide-[#eeebe6] max-h-80 overflow-y-auto">
            {data?.lowStock.map((s) => (
              <button
                key={s.variantId}
                type="button"
                onClick={() => setAdminTab('products')}
                className="w-full py-2.5 flex items-center justify-between gap-3 text-start px-2 hover:bg-[#faf9f7] rounded-lg cursor-pointer"
              >
                <span className="min-w-0">
                  <b className="block text-sm text-[#141414] truncate">{pick(lang, s.productNameAr, s.productNameEn)}</b>
                  <span className="text-xs text-[#77736c] font-mono" dir="ltr">{s.sku} · {s.size}</span>
                </span>
                <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-bold ${s.stock === 0 ? 'bg-red-50 text-red-700' : 'bg-[#fff7e7] text-[#6b5d4c]'}`}>
                  {s.stock === 0 ? t('نفد', 'Sold out') : t(`${s.stock} متبقي`, `${s.stock} left`)}
                </span>
              </button>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
