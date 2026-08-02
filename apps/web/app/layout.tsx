import type { Metadata } from "next";
import "./tailwind.css";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://kuvend.org"),
  title: "Kuvend — Fjala jote, në tryezë",
  description: "Platformë e pavarur për propozime dhe pjesëmarrje këshilluese për Shqipërinë.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/mark.svg" },
  alternates: { canonical: "/" },
  openGraph: {
    title: "Kuvend — Fjala jote, në tryezë",
    description: "Propozime dhe votim këshillues për Shqipërinë.",
    url: "/",
    siteName: "Kuvend",
    locale: "sq_AL",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Kuvend",
    description: "Propozime dhe votim këshillues për Shqipërinë.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="sq" className={cn("font-sans", geist.variable)}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Kuvend",
              url: "https://kuvend.org",
              description:
                "Platformë e pavarur dhe joqeveritare për pjesëmarrje këshilluese në Shqipëri.",
            }),
          }}
        />
      </body>
    </html>
  );
}
