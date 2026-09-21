import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReadingPage from "@/components/ReadingPage";
import { GUIDE_SLUGS, loadGuide } from "@/lib/guides";
import { markdownToReact } from "@/lib/markdown";
import { absoluteUrl } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = loadGuide(slug);
  if (!guide) notFound();
  return {
    title: { absolute: guide.title },
    description: guide.description,
    alternates: { canonical: absoluteUrl(`/guides/${guide.slug}`) },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url: absoluteUrl(`/guides/${guide.slug}`),
      type: "article",
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = loadGuide(slug);
  if (!guide) notFound();
  return (
    <ReadingPage
      title={guide.h1}
      name={guide.title.split("|")[0].trim()}
      path={`/guides/${guide.slug}`}
      intro={guide.description}
      parent={{ name: "Guides", path: "/guides" }}
    >
      {markdownToReact(guide.body)}
      <Link className="editorial-link" href="/collections/tees">
        EXPLORE TEES & TOPS ↗
      </Link>
      <p>
        <Link href="/about">About the brand</Link>
        {" · "}
        <Link href="/guides">All guides</Link>
      </p>
    </ReadingPage>
  );
}
