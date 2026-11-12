'use client';

import React, { useState, useEffect } from 'react';
import { useWeftStore } from '@/store/useWeftStore';
import { PageId } from '@/types/weft';
import { navigationLabels, assetPath } from '@/lib/labels';
import { FaShoppingCart } from "react-icons/fa";


export default function Navbar() {
  const page = useWeftStore((state) => state.page);
  const go = useWeftStore((state) => state.go);
  const lang = useWeftStore((state) => state.lang);
  const toggleLang = useWeftStore((state) => state.toggleLang);
  const cartCount = useWeftStore((state) => state.getCartCount());
  const t = useWeftStore((state) => state.t);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const mainLinks: PageId[] = ['home', 'shop', 'orders'];

  const handleNavClick = (p: PageId) => {
    go(p);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`sticky top-0 z-40 transition-all duration-300 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-sm border-b border-[#e6e3dd]/80'
          : 'bg-white border-b border-[#e6e3dd]'
      }`}
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 flex items-center justify-between min-h-[78px] gap-4">
        {/* Brand Logo & Name */}
        <button
          type="button"
          onClick={() => handleNavClick('home')}
          className="flex items-center gap-3 text-start group cursor-pointer focus:outline-none"
        >
          {!logoError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={assetPath('assets/weft-mark-160.webp')}
              alt="WEFT"
              className="w-13 h-13 sm:w-15 sm:h-15 object-contain transition-transform duration-300 group-hover:scale-105"
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-[#141414] text-[#7a6b58] flex items-center justify-center font-serif text-2xl font-bold italic shadow-sm group-hover:scale-105 transition-transform duration-300">
              W
            </div>
          )}

          <div className="flex flex-col">
            <b className="text-lg sm:text-xl font-bold tracking-tight text-[#141414] group-hover:text-[#7a6b58] transition-colors duration-200">
              WEFT
            </b>
            <small className="text-[14px] sm:text-[14px] tracking-widest text-[#6b5d4c] font-semibold uppercase">
              THE THREAD CO.
            </small>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-[15px] font-bold">
          {mainLinks.map((key) => {
            const isActive = page === key;
            const [arText, enText] = navigationLabels[key] || [key, key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleNavClick(key)}
                className={`relative py-2 transition-colors duration-200 cursor-pointer group ${
                  isActive
                    ? 'text-[#141414]'
                    : 'text-[#2a2a28] hover:text-[#7a6b58]'
                }`}
              >
                {t(arText, enText)}
                <span
                  className={`absolute bottom-0 start-0 h-0.5 bg-[#7a6b58] transition-all duration-300 ${
                    isActive ? 'w-full' : 'w-0 group-hover:w-full'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {/* Actions (Lang Switcher, Cart Button, Mobile Hamburger) */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={toggleLang}
            className="px-3 py-1.5 rounded-lg border border-[#cfcac2] text-xs sm:text-sm font-bold text-[#141414] hover:bg-[#eee9e1] hover:border-[#7a6b58] transition-all duration-200 cursor-pointer"
          >
            {lang === 'ar' ? 'EN' : 'عربي'}
          </button>

          <button
            type="button"
            onClick={() => handleNavClick('cart')}
            className="relative flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#141414] text-white hover:bg-[#2b2926] font-bold text-xs sm:text-sm cursor-pointer shadow-sm transition-all duration-200 hover:shadow-md active:scale-[0.97]"
          >
            <span className="text-[#7a6b58] text-m"><FaShoppingCart /></span>
            <span>{t('السلة', 'Cart')}</span>
            {cartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-[#7a6b58] text-white text-[14px] font-bold flex items-center justify-center animate-pulse-gold">
                {cartCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#141414] rounded-lg hover:bg-[#f5f3ef] cursor-pointer transition-colors"
            aria-label="Toggle Navigation Menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        className={`md:hidden overflow-hidden transition-all duration-300 ease-in-out ${
          mobileMenuOpen ? 'max-h-80 opacity-100 border-t border-[#e6e3dd]' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-[#faf9f7] px-4 py-3 space-y-1.5">
          {mainLinks.map((key) => {
            const isActive = page === key;
            const [arText, enText] = navigationLabels[key] || [key, key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleNavClick(key)}
                className={`w-full text-start px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-[#141414] text-white'
                    : 'text-[#2a2a28] hover:bg-[#eee9e1]'
                }`}
              >
                {t(arText, enText)}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
