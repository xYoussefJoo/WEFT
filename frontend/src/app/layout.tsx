import type { Metadata, Viewport } from "next";
import { Tajawal, DM_Sans } from "next/font/google";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const tajawal = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-tajawal",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

const title = "WEFT | The Thread Co.";
const description = "WEFT — The Thread Co. هوديز بتصميم بسيط وخامات مريحة | Hoodies with a simple design and comfortable fabrics";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  // The share image is app/opengraph-image.jpg (WhatsApp, Facebook, X previews).
  openGraph: { type: "website", siteName: "WEFT", locale: "ar_EG", title, description, url: "/" },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = { themeColor: "#141414" };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${tajawal.variable} ${dmSans.variable} h-full antialiased`}
    >
      <head>
        {/* Apply the saved language before the first paint, so English visitors don't see the page flip from right-to-left. */}
        <script
          dangerouslySetInnerHTML={{
            __html: "try{if(localStorage.getItem('weft_lang')==='en'){var d=document.documentElement;d.lang='en';d.dir='ltr'}}catch(e){}",
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
