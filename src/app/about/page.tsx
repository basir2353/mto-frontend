import MarketingShell from "@/components/MarketingShell";
import ImageSlot from "@/components/ImageSlot";
import { CheckBadge } from "@/components/ui/Icons";
import styles from "@/app/public-pages.module.css";

const stats = [
  ["40+", "cities live"],
  ["12k+", "verified drivers"],
  ["300k+", "moves completed"],
  ["4.9★", "average rating"],
];

const values = [
  ["Transparent by default", "Every quote is itemized. No surge surprises, no hidden fees."],
  ["Drivers first", "Low fees and instant pay. When drivers do well, customers do too."],
  ["Local everywhere", "Real people from your own neighbourhood, not a faceless fleet."],
];

const safetyPoints = ["Background & ID checks", "Live GPS on every move", "In-trip coverage & 24/7 support"];

export default function AboutPage() {
  return (
    <MarketingShell active="about">
      {/* HERO */}
      <div className={styles.aboutHero} style={{ background: "#0E0E10", color: "#fff", padding: "90px 44px 80px" }}>
        <div style={{ maxWidth: 840 }}>
          <div
            style={{
              font: "700 12px var(--font-hanken)",
              letterSpacing: ".1em",
              color: "var(--accent)",
              textTransform: "uppercase",
              marginBottom: 16,
            }}
          >
            Our story
          </div>
          <h1 className={styles.aboutHeroTitle} style={{ margin: "0 0 20px", font: "900 64px/1.0 var(--font-archivo)", letterSpacing: "-.035em" }}>
            Moving shouldn&apos;t mean renting a van or waiting a week.
          </h1>
          <p className={styles.aboutHeroText} style={{ margin: 0, font: "400 19px/1.55 var(--font-hanken)", color: "rgba(255,255,255,.68)", maxWidth: 620 }}>
            MoveThisOut connects people who need something moved with nearby drivers who already
            have the right vehicle. Fair prices, real people, right now.
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className={styles.aboutStats} style={{ background: "var(--accent)", color: "#0E0E10", padding: "30px 44px", display: "flex", gap: 64 }}>
        {stats.map(([n, l]) => (
          <div key={l}>
            <div style={{ font: "900 34px var(--font-archivo)" }}>{n}</div>
            <div style={{ font: "600 13px var(--font-hanken)", opacity: 0.7 }}>{l}</div>
          </div>
        ))}
      </div>

      {/* STORY SPLIT */}
      <div className={styles.aboutStory} style={{ padding: "80px 44px", display: "flex", gap: 56, alignItems: "center" }}>
        <div
          className={styles.aboutStoryMedia}
          style={{
            flex: 1,
            minHeight: 380,
            borderRadius: 22,
            overflow: "hidden",
            background: "linear-gradient(135deg,#e6e4dc,#cfd3c8)",
            position: "relative",
          }}
        >
          <ImageSlot
            placeholder="Drop a photo — driver & customer"
            src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1000&q=80"
            alt="Driver and customer"
          />
        </div>
        <div className={styles.aboutStoryCopy} style={{ width: 520, flex: "none" }}>
          <h2 className={styles.sectionTitle} style={{ margin: "0 0 18px", font: "800 38px/1.05 var(--font-archivo)", letterSpacing: "-.025em" }}>
            A marketplace, not a middleman
          </h2>
          <p style={{ margin: "0 0 16px", font: "400 17px/1.65 var(--font-hanken)", color: "#3a3a40" }}>
            We started MoveThisOut after one too many overpriced quotes and no-show movers. The
            idea was simple: let drivers compete for the job and let customers pick.
          </p>
          <p style={{ margin: 0, font: "400 17px/1.65 var(--font-hanken)", color: "#6B6B70" }}>
            Today thousands of independent drivers earn on their own terms, and moving something
            big is as easy as ordering a ride.
          </p>
        </div>
      </div>

      {/* VALUES */}
      <div id="values" className={styles.aboutValues} style={{ padding: "0 44px 70px" }}>
        <h2 className={styles.sectionTitle} style={{ margin: "0 0 28px", font: "800 34px var(--font-archivo)", letterSpacing: "-.02em" }}>How we operate</h2>
        <div className={styles.aboutValuesGrid} style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 22 }}>
          {values.map(([title, body]) => (
            <div key={title} className={styles.aboutValueCard} style={{ border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 20, padding: 28, background: "#fff" }}>
              <h3 style={{ margin: "0 0 8px", font: "800 21px var(--font-archivo)" }}>{title}</h3>
              <p style={{ margin: 0, font: "400 15px/1.55 var(--font-hanken)", color: "#6B6B70" }}>{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SAFETY */}
      <div id="safety" className={styles.aboutSafety} style={{ padding: "0 44px 80px" }}>
        <div className={styles.aboutSafetyCard} style={{ background: "#0E0E10", color: "#fff", borderRadius: 24, padding: "56px 52px", display: "flex", gap: 56, alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <div
              style={{
                font: "700 12px var(--font-hanken)",
                letterSpacing: ".1em",
                color: "var(--accent)",
                textTransform: "uppercase",
                marginBottom: 14,
              }}
            >
              Safety
            </div>
            <h2 className={styles.sectionTitle} style={{ margin: "0 0 16px", font: "900 38px/1.05 var(--font-archivo)", letterSpacing: "-.025em" }}>
              Vetted drivers. Covered moves. Real-time tracking.
            </h2>
            <p style={{ margin: 0, font: "400 17px/1.6 var(--font-hanken)", color: "rgba(255,255,255,.68)", maxWidth: 440 }}>
              Every driver passes a background check and ID verification. Moves are tracked live
              and backed by in-trip coverage, with 24/7 support one tap away.
            </p>
          </div>
          <div className={styles.aboutSafetyList} style={{ width: 360, flex: "none", display: "flex", flexDirection: "column", gap: 12 }}>
            {safetyPoints.map((p) => (
              <div
                key={p}
                style={{
                  background: "rgba(255,255,255,.06)",
                  borderRadius: 14,
                  padding: "16px 18px",
                  font: "600 15px var(--font-hanken)",
                  display: "flex",
                  gap: 12,
                  alignItems: "center",
                }}
              >
                <CheckBadge size={24} iconSize={12} />
                {p}
              </div>
            ))}
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
