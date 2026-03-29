import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getHelpBody, getHelpSlugs } from "@/lib/help-content";
import { HelpMarkdown } from "@/components/help-markdown";

export function generateStaticParams() {
  return getHelpSlugs().map((slug) => ({ slug }));
}

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const doc = getHelpBody(params.slug);
  if (!doc) {
    return { title: "도움말 | Daily Briefing" };
  }
  return {
    title: `${doc.title} | 도움말`,
    description: "Daily Briefing 앱 도움말",
  };
}

export default function HelpSlugPage({ params }: Props) {
  const doc = getHelpBody(params.slug);
  if (!doc) {
    notFound();
  }

  return (
    <article className="max-w-none">
      <HelpMarkdown content={doc.content} />
    </article>
  );
}
