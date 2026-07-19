import Link from "next/link";
import { notFound } from "next/navigation";
import MarketingShell from "@/components/MarketingShell";
import { getHelpArticle, HELP_ARTICLES } from "@/lib/helpContent";

export function generateStaticParams() {
  return HELP_ARTICLES.map((a) => ({ slug: a.slug }));
}

export default async function HelpArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getHelpArticle(slug);
  if (!article) notFound();

  return (
    <MarketingShell active="">
      <article style={{ padding: "64px 44px 96px", maxWidth: 720, margin: "0 auto" }}>
        <Link href="/help" style={{ font: "700 13px 'Hanken Grotesk'", color: "#6B6B70", textDecoration: "none" }}>
          ← All help articles
        </Link>
        <p style={{ margin: "24px 0 10px", font: "700 12px 'Hanken Grotesk'", letterSpacing: ".08em", textTransform: "uppercase", color: "#8A8A90" }}>
          {article.category}
        </p>
        <h1 style={{ margin: "0 0 14px", font: "900 36px/1.1 'Archivo'", letterSpacing: "-.03em" }}>{article.title}</h1>
        <p style={{ margin: "0 0 28px", font: "500 16px/1.5 'Hanken Grotesk'", color: "#6B6B70" }}>{article.summary}</p>
        <div style={{ font: "400 16px/1.7 'Hanken Grotesk'", color: "#2a2a30", whiteSpace: "pre-wrap" }}>{article.body}</div>
      </article>
    </MarketingShell>
  );
}
