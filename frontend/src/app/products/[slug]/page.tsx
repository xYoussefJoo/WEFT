import type { Metadata } from 'next';
import { Suspense } from 'react';
import { preload } from 'react-dom';
import AppShell from '@/components/AppShell';
import { hoodiePhoto } from '@/lib/labels';

type Params = { params: Promise<{ slug: string }> };

type ProductForHead = {
  nameAr: string;
  nameEn: string;
  descriptionAr: string | null;
  images: { url: string; srcSet: string }[];
  variants: { inStock: boolean; color: { nameEn: string } }[];
};

// Same URL and options in generateMetadata and the page, so Next fetches the product only once per request.
async function fetchProduct(slug: string): Promise<ProductForHead | null> {
  try {
    const res = await fetch(`${process.env.API_URL ?? 'http://localhost:5055'}/api/products/${encodeURIComponent(slug)}`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok ? ((await res.json()) as ProductForHead) : null;
  } catch {
    return null;
  }
}

// Share previews (WhatsApp, Facebook) show the product's own name and first photo.
export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const canonical = `/products/${slug}`;
  const p = await fetchProduct(decodeURIComponent(slug));
  if (!p) return { alternates: { canonical } };
  const title = `${p.nameAr} | ${p.nameEn} | WEFT`;
  const description = p.descriptionAr ?? undefined;
  const images = p.images[0] ? [{ url: p.images[0].url }] : undefined;
  return { title, description, alternates: { canonical }, openGraph: { title, description, url: canonical, images }, twitter: { title, description, images } };
}

// The big product photo is the page's largest element, but the browser only finds it after the app's JavaScript runs.
// Announcing it in <head> lets the download start with the HTML (Lighthouse: LCP request discovery).
async function PreloadMainPhoto({ slug }: { slug: string }) {
  const p = await fetchProduct(slug);
  if (!p) return null;
  const photo = p.images[0];
  if (photo) preload(photo.url, { as: 'image', fetchPriority: 'high', imageSrcSet: photo.srcSet, imageSizes: '(min-width: 1024px) 600px, 100vw' });
  else {
    // No photo yet: ProductDetailsView shows the hoodie in the first in-stock variant's colour.
    const first = p.variants.find((v) => v.inStock) ?? p.variants[0];
    preload(hoodiePhoto(first?.color.nameEn), { as: 'image', fetchPriority: 'high' });
  }
  return null;
}

// A product's shareable address. With Cache Components, params are runtime data, so they're read inside Suspense.
export default function ProductPage({ params }: Params) {
  return (
    <Suspense fallback={null}>
      {params.then(({ slug }) => (
        <>
          <PreloadMainPhoto slug={decodeURIComponent(slug)} />
          <AppShell route={{ page: 'product', slug: decodeURIComponent(slug) }} />
        </>
      ))}
    </Suspense>
  );
}
