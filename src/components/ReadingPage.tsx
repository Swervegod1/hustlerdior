import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import JsonLd from "./JsonLd";
import { absoluteUrl, breadcrumbData } from "@/lib/seo";

export default function ReadingPage({
  title,
  name,
  path,
  intro,
  parent,
  children,
}: {
  title: string;
  name: string;
  path: string;
  intro: string;
  parent?: { name: string; path: string };
  children: ReactNode;
}) {
  const crumbs = [
    { name: "Home", path: "/" },
    ...(parent ? [parent] : []),
    { name, path },
  ];
  return (
    <main id="main" className="reading-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        {crumbs.map((crumb, i) => (
          <Fragment key={crumb.path}>
            {i > 0 ? <span>/</span> : null}
            {i < crumbs.length - 1 ? (
              <Link href={crumb.path}>{crumb.name}</Link>
            ) : (
              <span>{crumb.name}</span>
            )}
          </Fragment>
        ))}
      </nav>
      <header className="collection-intro">
        <p className="eyebrow">HUSTLER DIOR / THE DETAILS</p>
        <h1>{title}</h1>
        <p>{intro}</p>
      </header>
      <article className="reading-panel">{children}</article>
      <JsonLd data={breadcrumbData(crumbs)} />
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
