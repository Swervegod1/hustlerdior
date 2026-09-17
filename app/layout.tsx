import type { Metadata } from "next";
import { createElement } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Hustler Dior — The Concrete Edit",
    template: "%s · Hustler Dior",
  },
  description:
    "Independent graphic streetwear. Wear your own rules. Made-to-order. Creative direction by Swerve God.",
  openGraph: {
    title: "Hustler Dior — The Concrete Edit",
    description: "Wear your own rules. Made-to-order streetwear.",
    type: "website",
  },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return createElement(
    "html",
    { lang: "en" },
    createElement(
      "body",
      null,
      createElement(Header),
      createElement("main", null, children),
      createElement(Footer),
    ),
  );
}
