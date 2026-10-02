import type { Guide } from "./guides";
import { absoluteUrl } from "./seo";

export type GuideFaq = { question: string; answer: string };

function plainText(value: string) {
  return value
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** FAQ entries are the ### questions under the guide's ## FAQ heading. */
export function guideFaqs(body: string): GuideFaq[] {
  const faqs: GuideFaq[] = [];
  let inFaq = false;
  let current: { question: string; answer: string[] } | null = null;
  const flush = () => {
    if (!current) return;
    const answer = plainText(current.answer.join(" "));
    if (current.question && answer) {
      faqs.push({ question: plainText(current.question), answer });
    }
    current = null;
  };
  for (const line of body.split(/\r?\n/)) {
    if (/^##\s+FAQ\s*$/i.test(line.trim())) {
      inFaq = true;
      continue;
    }
    if (!inFaq) continue;
    if (/^##\s+/.test(line)) break;
    const question = line.match(/^###\s+(.+)$/);
    if (question) {
      flush();
      current = { question: question[1], answer: [] };
      continue;
    }
    if (current && line.trim()) current.answer.push(line.trim());
  }
  flush();
  return faqs;
}

export function guideStructuredData(guide: Guide) {
  const url = absoluteUrl(`/guides/${guide.slug}`);
  const faqs = guideFaqs(guide.body);
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: guide.h1,
        description: guide.description,
        url,
        mainEntityOfPage: url,
        author: { "@type": "Organization", name: "Hustler Dior" },
        publisher: { "@type": "Organization", name: "Hustler Dior" },
      },
      {
        "@type": "FAQPage",
        url,
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };
}
