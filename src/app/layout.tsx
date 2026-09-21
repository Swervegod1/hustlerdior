import type { Metadata } from "next";
import Link from "next/link";
import "@fontsource/anton/latin-400.css";
import "@fontsource/dm-sans/latin-400.css";
import "@fontsource/dm-sans/latin-500.css";
import "@fontsource/dm-sans/latin-700.css";
import "lenis/dist/lenis.css";
import "./globals.css";
import "./remix.css";
import "./refinement.css";
import "./sales.css";
import "./growth.css";
import Navigation from "@/components/Navigation";
import CartDrawer from "@/components/CartDrawer";
import { Experience } from "@/components/Experience";
import { connection } from "next/server";
import { requestPublicHost } from "@/lib/request-host";
import { absoluteUrl, isIndexable, robotsMetadata } from "@/lib/seo";
import { collections } from "@/lib/collections";
import StyleDesk from "@/components/StyleDesk";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const indexable = isIndexable(process.env, await requestPublicHost());
  return {
    metadataBase: new URL(absoluteUrl("/")),
    title: {
      default: "Hustler Dior — Independent Streetwear | The Concrete Edit",
      template: "%s | Hustler Dior",
    },
    description:
      "Explore Hustler Dior's original streetwear collection: graphic tees, oversized layers, hoodies, shorts and accessories. Independent by design.",
    robots: robotsMetadata(indexable),
    openGraph: {
      type: "website",
      siteName: "Hustler Dior",
      title: "Hustler Dior — Built Different",
      description:
        "The Concrete Edit. Independent streetwear. Unfiltered expression.",
    },
    verification: process.env.GOOGLE_SITE_VERIFICATION
      ? { google: process.env.GOOGLE_SITE_VERIFICATION }
      : undefined,
    twitter: {
      card: "summary",
      title: "Hustler Dior — Built Different",
      description: "Independent streetwear. Unfiltered expression.",
    },
  };
}
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <Navigation />
        {children}
        <CartDrawer />
        <Experience />
        <StyleDesk />
        <footer className="footer">
          <div className="footer-top">
            <p>
              INDEPENDENT STREETWEAR.
              <br />
              UNFILTERED EXPRESSION.
            </p>
            <nav aria-label="Footer navigation">
              {collections.map((c) => (
                <Link key={c.slug} href={`/collections/${c.slug}`}>
                  {c.name}
                </Link>
              ))}
              <Link href="/guides">Guides</Link>
              <Link href="/about">About Hustler Dior</Link>
              <Link href="/world">The creative world</Link>
              <Link href="/fit-guide">Fit guide</Link>
              <Link href="/help">Ordering information</Link>
              <Link href="/privacy">Photo & shopping privacy</Link>
              <Link href="/#main">Back to top ↑</Link>
            </nav>
          </div>
          <div className="footer-wordmark">
            HUSTLER DIOR<span>✳</span>
          </div>
          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} HUSTLER DIOR</span>
            <span>BUILT FROM AMBITION.</span>
            <span>HUSTLERDIOR.COM</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
