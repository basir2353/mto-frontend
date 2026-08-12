import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import ImageSlot from "@/components/ImageSlot";
import BusinessContactForm from "@/components/BusinessContactForm";
import styles from "@/app/public-pages.module.css";

const features = [
  ["1", "Book in bulk", "Schedule one-off, recurring, or same-day pickups across multiple locations in a few clicks."],
  ["2", "One invoice", "Consolidated monthly billing, cost centres and receipts — no chasing individual payments."],
  ["3", "Live oversight", "Track every job on a map, manage team seats, and pull delivery reports on demand."],
];

const useCases = [
  ["retail", "Retail & restock", "Move stock between shops and storerooms same-day.", "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=800&q=80"],
  ["office", "Office moves", "Desks, gear and fit-outs without a full moving crew.", "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80"],
  ["seller", "Marketplace sellers", "Get bulky items to buyers without owning a van.", "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=800&q=80"],
  ["event", "Events & studios", "Load-in and load-out for sets, gear and props.", "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80"],
];

export default function BusinessPage() {
  return (
    <MarketingShell active="business">
      {/* HERO */}
      <div className={styles.businessHero} style={{ background: "#0E0E10", color: "#fff", padding: "72px 44px 88px", display: "flex", gap: 56, alignItems: "center" }}>
        <div className={styles.businessHeroCopy} style={{ width: 600, flex: "none" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid rgba(255,255,255,.18)",
              padding: "7px 14px",
              borderRadius: 999,
              font: "700 11px var(--font-hanken)",
              letterSpacing: ".05em",
              marginBottom: 24,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />
            MOVETHISOUT FOR BUSINESS
          </div>
          <h1 className={styles.businessHeroTitle} style={{ margin: "0 0 20px", font: "900 60px/0.98 var(--font-archivo)", letterSpacing: "-.035em" }}>
            Moving, handled for your whole team.
          </h1>
          <p style={{ margin: "0 0 32px", font: "400 18px/1.5 var(--font-hanken)", color: "rgba(255,255,255,.68)", maxWidth: 480 }}>
            On-demand drivers for deliveries, store restocks, office shuffles and marketplace
            fulfilment — booked from one dashboard, billed on one invoice.
          </p>
          <div className={styles.businessHeroActions} style={{ display: "flex", gap: 14 }}>
            <Link
              href="#contact"
              style={{
                height: 56,
                padding: "0 30px",
                borderRadius: 12,
                background: "var(--accent)",
                color: "#0E0E10",
                display: "inline-flex",
                alignItems: "center",
                font: "800 16px var(--font-archivo)",
                textDecoration: "none",
              }}
            >
              Talk to sales →
            </Link>
            <Link
              href="/book"
              style={{
                height: 56,
                padding: "0 28px",
                borderRadius: 12,
                border: "1.5px solid rgba(255,255,255,.25)",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                font: "700 16px var(--font-hanken)",
                textDecoration: "none",
              }}
            >
              Book a one-off move
            </Link>
          </div>
        </div>
        <div
          className={styles.businessHeroMedia}
          style={{
            flex: 1,
            position: "relative",
            alignSelf: "stretch",
            minHeight: 440,
            borderRadius: 22,
            overflow: "hidden",
            background: "linear-gradient(135deg,#e6e4dc,#cfd3c8)",
          }}
        >
          <ImageSlot
            placeholder="Drop a photo — team / warehouse loading"
            src="https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80"
            alt="Warehouse loading"
          />
          <div
            className={styles.businessHeroStat}
            style={{
              position: "absolute",
              bottom: 22,
              left: 22,
              background: "#fff",
              borderRadius: 14,
              padding: "13px 16px",
              boxShadow: "0 18px 40px rgba(0,0,0,.3)",
            }}
          >
            <div style={{ font: "700 10px var(--font-hanken)", letterSpacing: ".08em", color: "#6B6B70" }}>THIS MONTH</div>
            <div className={styles.businessHeroStatValue} style={{ font: "900 22px var(--font-archivo)", color: "#0E0E10" }}>142 moves · 1 invoice</div>
          </div>
        </div>
      </div>

      {/* TRUST BAR */}
      <div className={styles.businessTrust} style={{ background: "var(--accent)", color: "#0E0E10", padding: "24px 44px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ font: "700 14px var(--font-hanken)" }}>Trusted by local retailers, studios &amp; online sellers</span>
        <div className={styles.businessTrustLogos} style={{ display: "flex", gap: 40, font: "800 20px var(--font-archivo)", opacity: 0.5 }}>
          <span>NORTHGOODS</span>
          <span>PARCEL&amp;CO</span>
          <span>Studio 9</span>
          <span>Maker Market</span>
        </div>
      </div>

      {/* FEATURES */}
      <div className={styles.businessFeatures} style={{ padding: "80px 44px 40px" }}>
        <div style={{ maxWidth: 680, marginBottom: 44 }}>
          <div
            style={{
              font: "700 12px var(--font-hanken)",
              letterSpacing: ".1em",
              color: "#8A8A90",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            Why business teams use us
          </div>
          <h2 className={styles.businessFeaturesHeading} style={{ margin: 0, font: "800 42px/1.05 var(--font-archivo)", letterSpacing: "-.025em" }}>
            Everything the consumer app does — built for volume.
          </h2>
        </div>
        <div className={styles.businessFeatureGrid} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {features.map(([n, title, body]) => (
            <div key={n} className={styles.businessFeatureCard} style={{ border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 20, padding: 28, background: "#fff" }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: "#0E0E10",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "900 18px var(--font-archivo)",
                  marginBottom: 20,
                }}
              >
                {n}
              </div>
              <h3 style={{ margin: "0 0 8px", font: "800 21px var(--font-archivo)" }}>{title}</h3>
              <p style={{ margin: 0, font: "400 15px/1.5 var(--font-hanken)", color: "#6B6B70" }}>{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* USE CASES */}
      <div className={styles.businessCases} style={{ padding: "48px 44px 80px" }}>
        <h2 className={styles.sectionTitle} style={{ margin: "0 0 28px", font: "800 34px var(--font-archivo)", letterSpacing: "-.02em" }}>
          Built for how your business moves
        </h2>
        <div className={styles.businessCaseGrid} style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
          {useCases.map(([id, title, body, src]) => (
            <div key={id} style={{ borderRadius: 18, overflow: "hidden", background: "#fff", border: "1.5px solid rgba(0,0,0,.1)" }}>
              <div style={{ height: 140, position: "relative", background: "linear-gradient(135deg,#e6e4dc,#cfd3c8)" }}>
                <ImageSlot placeholder={title} src={src} alt={title} />
              </div>
              <div style={{ padding: "16px 18px" }}>
                <div style={{ font: "800 18px var(--font-archivo)" }}>{title}</div>
                <div style={{ font: "500 13px var(--font-hanken)", color: "#6B6B70", marginTop: 4 }}>{body}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTACT / CTA */}
      <div id="contact" className={styles.businessContact} style={{ padding: "0 44px 70px" }}>
        <div className={styles.businessContactCard} style={{ background: "#0E0E10", color: "#fff", borderRadius: 24, overflow: "hidden", display: "flex" }}>
          <div className={styles.businessContactCopy} style={{ flex: 1, padding: "56px 52px" }}>
            <div
              style={{
                font: "700 12px var(--font-hanken)",
                letterSpacing: ".1em",
                color: "var(--accent)",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Get started
            </div>
            <h2 className={styles.businessContactHeading} style={{ margin: "0 0 16px", font: "900 40px/1.05 var(--font-archivo)", letterSpacing: "-.025em" }}>
              Tell us how your business moves.
            </h2>
            <p style={{ margin: 0, font: "400 17px/1.6 var(--font-hanken)", color: "rgba(255,255,255,.68)", maxWidth: 400 }}>
              A specialist will set up your account, add your team and get you moving within a day.
            </p>
          </div>
          <BusinessContactForm />
        </div>
      </div>
    </MarketingShell>
  );
}
