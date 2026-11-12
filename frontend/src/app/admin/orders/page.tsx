import { Suspense } from 'react';
import AppShell from '@/components/AppShell';

export const metadata = { title: 'الطلبات | WEFT', robots: { index: false, follow: false } };

// /admin/orders: the orders tab (its own folder exists for /admin/orders/[id], so it needs its own page).
export default function AdminOrdersPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f3ef] animate-pulse" />}>
      <AppShell route={{ page: 'admin', tab: 'orders' }} />
    </Suspense>
  );
}
