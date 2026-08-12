"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import styles from "@/app/public-pages.module.css";
import { HELP_ARTICLES, HELP_CATEGORIES } from "@/lib/helpContent";

export default function HelpPage() {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (!q) return HELP_ARTICLES;
    return HELP_ARTICLES.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.summary.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.body.toLowerCase().includes(q),
    );
  }, [q]);

  return (
    <MarketingShell active="">
      <div className={styles.helpHero} style={{ background: "#0E0E10", color: "#fff", padding: "72px 44px 64px", textAlign: "center" }}>
        <h1 className={styles.helpHeroTitle} style={{ margin: "0 0 24px", font: "900 48px/1.02 var(--font-archivo)", letterSpacing: "-.03em" }}>
          How can we help?
        </h1>
        <div
          className={styles.helpSearch}
          style={{
            maxWidth: 640,
            margin: "0 auto",
            height: 60,
            background: "#fff",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "0 20px",
          }}
        >
          <span style={{ width: 18, height: 18, borderRadius: "50%", border: "2px solid #9a9aa0" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search help articles…"
            className={styles.helpSearchText}
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              font: "500 16px var(--font-hanken)",
              color: "#0E0E10",
              background: "transparent",
            }}
          />
        </div>
        <div className={styles.helpPopularTerms} style={{ marginTop: 18, font: "500 14px var(--font-hanken)", color: "rgba(255,255,255,.55)" }}>
          Popular:{" "}
<<<<<<< HEAD
          {["refunds", "reschedule", "cash"].map((term, i) => (
=======
          {["refunds", "reschedule", "tracking"].map((term, i) => (
>>>>>>> ac960226d218fcf032389f207fde44cc1d48f28f
            <span key={term}>
              {i > 0 ? " · " : null}
              <button
                type="button"
                onClick={() => setQuery(term)}
                style={{ background: "none", border: "none", color: "#fff", cursor: "pointer", font: "inherit", padding: 0 }}
              >
<<<<<<< HEAD
                {term === "reschedule" ? "reschedule a move" : term === "cash" ? "cash on site" : term}
=======
                {term === "reschedule" ? "reschedule a move" : term}
>>>>>>> ac960226d218fcf032389f207fde44cc1d48f28f
              </button>
            </span>
          ))}
        </div>
      </div>

      <div className={styles.helpCategories} style={{ padding: "64px 44px 40px" }}>
        <h2 style={{ margin: "0 0 28px", font: "800 30px var(--font-archivo)", letterSpacing: "-.02em" }}>Browse by topic</h2>
        <div className={styles.helpCategoryGrid} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {HELP_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setQuery(cat.title.split(" ")[0])}
              className={styles.helpCategoryCard}
              style={{
                border: "1.5px solid rgba(0,0,0,.1)",
                borderRadius: 20,
                padding: 26,
                background: "#fff",
                textAlign: "left",
                cursor: "pointer",
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "900 18px var(--font-archivo)",
                  color: "#0E0E10",
                  marginBottom: 16,
                }}
              >
                {cat.id}
              </div>
              <h3 style={{ margin: "0 0 6px", font: "800 19px var(--font-archivo)" }}>{cat.title}</h3>
              <p style={{ margin: 0, font: "400 14px/1.5 var(--font-hanken)", color: "#6B6B70" }}>{cat.body}</p>
            </button>
          ))}
        </div>
      </div>

      <div className={styles.helpArticles} style={{ padding: "24px 44px 40px" }}>
        <h2 style={{ margin: "0 0 20px", font: "800 26px var(--font-archivo)", letterSpacing: "-.02em" }}>
          {q ? `Results (${filtered.length})` : "Popular articles"}
        </h2>
        <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 18, overflow: "hidden" }}>
          {filtered.length === 0 && (
            <div style={{ padding: "22px", font: "500 15px var(--font-hanken)", color: "#6B6B70" }}>
              No articles match “{query}”. Try refunds, tracking, or cash.
            </div>
          )}
          {filtered.map((a, i) => (
            <div key={a.slug}>
              {i > 0 && <div style={{ height: 1, background: "rgba(0,0,0,.07)" }} />}
              <Link
                href={`/help/${a.slug}`}
                className={styles.helpArticle}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "18px 22px",
                  font: "600 15px var(--font-hanken)",
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <span>
                  <span style={{ display: "block" }}>{a.title}</span>
                  <span style={{ display: "block", marginTop: 4, font: "500 13px var(--font-hanken)", color: "#8A8A90" }}>{a.summary}</span>
                </span>
                <span style={{ color: "#9a9aa0", fontSize: 18 }}>›</span>
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.helpContact} style={{ padding: "0 44px 80px" }}>
        <div
          className={styles.helpContactCard}
          style={{
            background: "var(--accent)",
            borderRadius: 24,
            padding: "48px 52px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 24,
            flexWrap: "wrap",
          }}
        >
          <div>
            <h2 style={{ margin: "0 0 8px", font: "900 28px var(--font-archivo)" }}>Still stuck?</h2>
            <p style={{ margin: 0, font: "500 15px var(--font-hanken)", color: "rgba(14,14,16,.7)" }}>
              Open a dispute from a completed booking, or email support@movethisout.com.
            </p>
          </div>
          <Link href="/customer-app/support" className="mto-btn-dark" style={{ textDecoration: "none" }}>
            Customer support →
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}
