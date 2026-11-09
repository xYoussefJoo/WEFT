'use client';

import React from 'react';
import { useWeftStore } from '@/store/useWeftStore';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { assetPath } from '@/lib/labels';
import { useApi } from '@/lib/useApi';
import { pick, searchProducts } from '@/lib/shop';
import ProductCard from '@/components/shop/ProductCard';

export default function HomeView() {
  const site = useWeftStore((state) => state.site);
  const categories = useWeftStore((state) => state.categories);
  const lang = useWeftStore((state) => state.lang);
  const go = useWeftStore((state) => state.go);
  const setFilter = useWeftStore((state) => state.setFilter);
  const t = useWeftStore((state) => state.t);

  // Activates animations when elements enter the screen on scroll
  useScrollReveal();

  // Editorial photos for category tiles that don't have their own image yet (set one in Admin → Categories).
  const tilePhotos = [
    'assets/hoodies/black.webp',
    'assets/hoodies/cream.webp',
    'assets/hoodies/navy.webp',
    'assets/hoodies/olive.webp',
  ];

  const handleCategoryClick = (slug: string) => {
    setFilter(slug);
    go('shop');
  };

  // The newest pieces feed both 'The edit' and the new-arrivals photos.
  const { data: latest } = useApi(() => searchProducts({ sort: 'newest', pageSize: 8 }), []);
  const featured = latest?.items.slice(0, 4) ?? [];
  const newArrivals = (latest?.items ?? []).filter((p) => p.image).slice(0, 3);
  const hero = site?.hero;

  return (
    <main className="overflow-hidden">
      {/* ══════════════════════ EDITORIAL HERO ══════════════════════ */}
      <section className="relative grid grid-cols-1 lg:grid-cols-2 min-h-[560px] lg:min-h-[640px] bg-gradient-to-br from-[#f7f3eb] via-[#ede4d4] to-[#e2cfb3] overflow-hidden">
        {/* Copy Column */}
        <div className="relative z-10 p-8 sm:p-14 lg:p-20 flex flex-col items-start justify-center text-start">
          <span className="text-xs text-[#b99664] font-bold tracking-[0.25em] uppercase reveal-init">
            WEFT FASHION / THE NEW EDIT
          </span>

          <h1 className="text-4xl sm:text-5xl lg:text-[4.2rem] font-serif font-bold text-[#142b4a] leading-[1.12] my-4 reveal-init delay-100">
            {t(hero?.titleAr || 'ستايل يشبهك.', hero?.titleEn || 'Made to feel like you.')}
          </h1>

          <p className="text-sm sm:text-base text-[#5e605b] leading-relaxed max-w-lg mb-8 reveal-init delay-200">
            {t(
              hero?.subtitleAr || 'هوديز بتصميم بسيط وخامات مريحة وتفاصيل مميزة.',
              hero?.subtitleEn || 'Hoodies with a simple design, comfortable fabrics and standout details.'
            )}
          </p>

          <div className="flex flex-wrap items-center gap-3.5 reveal-init delay-300">
            <button
              type="button"
              className="px-7 py-3.5 rounded-full bg-[#142b4a] hover:bg-[#1e3a61] text-white text-sm font-bold shadow-md hover:shadow-lg cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2"
              onClick={() => {
                setFilter('all');
                go('shop');
              }}
            >
              <span>{t('اكتشفي المجموعة', 'Explore collection')}</span>
              <span className="text-base">↗</span>
            </button>
          </div>

          {/* Trust Badges */}
          <div className="mt-10 sm:mt-14 flex flex-wrap items-center gap-5 sm:gap-7 reveal-init delay-400">
            {[
              { ar: 'تصميم أصيل', en: 'Original design' },
              { ar: 'خامات فاخرة', en: 'Premium fabrics' },
              { ar: 'راحة طول اليوم', en: 'All-day comfort' },
            ].map((badge) => (
              <div
                key={badge.en}
                className="flex items-center gap-2 text-xs text-[#77808b] font-semibold"
              >
                <span className="text-[#b99664] text-xs">✦</span>
                <span>{t(badge.ar, badge.en)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Photo Column */}
        <div className="relative min-h-[380px] lg:min-h-full overflow-hidden bg-[#d5b995] group reveal-right delay-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={assetPath(hero?.imageUrl || 'assets/weft-hero.webp')}
            alt="WEFT hoodies"
            className="w-full h-full object-cover object-[center_34%] group-hover:scale-[1.04] transition-transform duration-1000 ease-out"
          />
          {/* Subtle gradient vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#142b4a]/45 via-transparent to-transparent pointer-events-none" />

          {/* Floating glass badge */}
          <span className="absolute bottom-6 end-6 bg-white/85 backdrop-blur-md px-4 py-2 text-[10px] sm:text-xs tracking-widest font-bold text-[#142b4a] rounded-full shadow-sm">
            THE EVERYDAY COLLECTION — 2026
          </span>

          {/* Floating decorative ring */}
          <div className="absolute top-8 start-8 w-24 h-24 rounded-full border-2 border-[#b99664]/40 animate-float pointer-events-none hidden sm:block" />
        </div>
      </section>

      {/* ══════════════════════ CURATED CATEGORIES ══════════════════════ */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 reveal-init">
          <div>
            <span className="text-xs text-[#b99664] font-bold tracking-[0.25em] uppercase">
              CURATED FOR YOU
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#142b4a] mt-1.5">
              {t('تسوقي على ذوقك', 'Find your style')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-[#77808b]">
            {t('قطع مختارة بعناية تناسب يومك', 'Considered pieces for your everyday wardrobe')}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((c, i) => {
            const tileImg = c.imageUrl || tilePhotos[i % tilePhotos.length];
            const name = pick(lang, c.nameAr, c.nameEn);
            return (
              <button
                key={c.id}
                type="button"
                className={`relative h-[260px] sm:h-[350px] rounded-2xl overflow-hidden bg-[#e0ceb6] group cursor-pointer text-start shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-1.5 border border-[#e8dfd1] reveal-init delay-${(i + 1) * 100}`}
                onClick={() => handleCategoryClick(c.slug)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={assetPath(tileImg)}
                  alt={name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#142b4a]/90 via-[#142b4a]/25 to-transparent" />
                {/* Gold hover glow */}
                <div className="absolute inset-0 bg-[#b99664]/15 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                <div className="absolute bottom-0 start-0 end-0 p-5">
                  <span className="text-white text-base sm:text-lg font-bold flex items-end justify-between w-full">
                    <span>{name}</span>
                    <span className="text-[#b99664] text-xl group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300">
                      ↗
                    </span>
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ══════════════════════ NEW COLLECTION BANNER ══════════════════════ */}
      {site?.collection.enabled !== false && (
        <section className="max-w-[1240px] mx-auto px-4 sm:px-6 pb-16">
          <div className="relative overflow-hidden rounded-3xl bg-[#142b4a] p-8 sm:p-14 shadow-xl reveal-init">
            {/* Subtle background dots pattern */}
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle, #b99664 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
              <div className="flex flex-col justify-center items-start text-start space-y-4 reveal-left delay-100">
                <span className="text-xs text-[#b99664] font-bold tracking-[0.25em] uppercase">
                  NEW ARRIVALS
                </span>
                <h2 className="text-2xl sm:text-4xl lg:text-5xl font-serif font-bold text-white leading-tight">
                  {t(site?.collection.titleAr || 'الكولكشن الجديد', site?.collection.titleEn || 'New collection')}
                </h2>
                <p className="text-sm text-white/75 leading-relaxed max-w-md">
                  {t(
                    'اكتشفي أحدث القطع المضافة لمجموعتنا المميزة بتفاصيل راقية وخامات ناعمة صُممت لتمنحك إطلالة متجددة ومريحة.',
                    'Explore our newest designs with refined craftsmanship, premium fabrics, and elevated everyday luxury.'
                  )}
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    className="px-7 py-3.5 rounded-full bg-[#b99664] hover:bg-[#c9a97a] text-white text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[#b99664]/40 hover:scale-[1.02] active:scale-[0.98] inline-flex items-center gap-2"
                    onClick={() => {
                      setFilter('all');
                      go('shop');
                    }}
                  >
                    <span>{t('تسوقي الجديد', 'Shop new arrivals')}</span>
                    <span>↗</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:gap-4 items-center">
                {newArrivals.map((p, i) => (
                  <div
                    key={p.id}
                    className={`aspect-[3/4] rounded-2xl overflow-hidden bg-[#243d61] border border-white/10 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1.5 reveal-scale delay-${(i + 2) * 100}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.image?.url}
                      srcSet={p.image?.srcSet}
                      sizes="160px"
                      alt={pick(lang, p.nameAr, p.nameEn)}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ══════════════════════ THE WEFT EDIT ══════════════════════ */}
      <section className="max-w-[1240px] mx-auto px-4 sm:px-6 py-12 pb-20">
        <div className="flex items-center justify-between gap-4 mb-10 reveal-init">
          <div>
            <span className="text-xs text-[#b99664] font-bold tracking-[0.25em] uppercase">
              THE EDIT
            </span>
            <h2 className="text-2xl sm:text-4xl font-serif font-bold text-[#142b4a] mt-1.5">
              {t('مختارات WEFT', 'The Weft edit')}
            </h2>
          </div>
          <button
            type="button"
            className="text-sm font-bold text-[#142b4a] hover:text-[#b99664] transition-colors cursor-pointer group inline-flex items-center gap-1.5"
            onClick={() => {
              setFilter('all');
              go('shop');
            }}
          >
            <span className="border-b border-current pb-0.5">{t('كل المنتجات', 'View all pieces')}</span>
            <span className="group-hover:translate-x-1 transition-transform duration-200">↗</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featured.map((p, i) => (
            <div
              key={p.id}
              className={`reveal-init delay-${(i + 1) * 100}`}
            >
              <ProductCard product={p} />
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
