import Link from "next/link";
import type { ReactNode } from "react";
import JsonLd from "./JsonLd";
import { absoluteUrl, breadcrumbData } from "@/lib/seo";

export default function ReadingPage({
  title,
  name,
  path,
  intro,
  children,
}: {
  title: string;
  name: string;
  path: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main id="main" className="reading-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <span>{name}</span>
      </nav>
      <header className="collection-intro">
        <p className="eyebrow">HUSTLER DIOR / THE DETAILS</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      <article className="reading-panel">{children}</article>
      <JsonLd
        data={breadcrumbData([
          { name: "Home", path: "/" },
          { name, path },
        ])}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          name,
          description: intro,
          url: absoluteUrl(path),
          isPartOf: { "@id": absoluteUrl("/#website") },
        }}
      />
    </main>
  );
}
