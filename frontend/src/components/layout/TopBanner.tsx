'use client';

import React from 'react';
import { useWeftStore } from '@/store/useWeftStore';

export default function TopBanner() {
  const t = useWeftStore((state) => state.t);
  const site = useWeftStore((state) => state.site);

  // The owner edits this line in Admin → Site content; until it loads (or if it's empty) the built-in text shows.
  const text = t(
    site?.announcementAr || 'توصيل لجميع المحافظات • الدفع عند الاستلام',
    site?.announcementEn || 'Delivery across Egypt • Cash on delivery',
  );

  return (
    <aside
      aria-label="Announcement"
      className="bg-[#141414] text-white text-[11px] sm:text-xs py-2 px-4 text-center font-medium tracking-wide flex items-center justify-center gap-2 border-b border-[#0f2138]"
    >
      <span className="text-[#7a6b58] text-xs">✦</span>
      <span className="opacity-95">{text}</span>
      <span className="text-[#7a6b58] text-xs">✦</span>
    </aside>
  );
}
