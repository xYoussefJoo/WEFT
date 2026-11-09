// The store's public address, used for the canonical tag, share links, robots.txt and the sitemap.
// On Vercel production it comes from Vercel itself (VERCEL_PROJECT_PRODUCTION_URL: the custom domain once one is
// added, otherwise the .vercel.app one), so a mistyped NEXT_PUBLIC_SITE_URL can't send them to another site.
export const siteUrl =
  process.env.VERCEL_ENV === 'production' && process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000');
