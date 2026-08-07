import Link from "next/link";
import MarketingShell from "@/components/MarketingShell";
import ImageSlot from "@/components/ImageSlot";
import { CheckBadge } from "@/components/ui/Icons";
import { appUrls } from "@mto/theme/apps";

const steps = [
  ["1", "Sign up & verify", "Add your licence, insurance and vehicle. We approve most drivers within 48 hours."],
  ["2", "See nearby jobs", "Go online and browse move requests around you, filtered to your vehicle and service area."],
  ["3", "Send your quote", "Set your own price and ETA. Win the job, navigate with GPS, and update status as you go."],
  ["4", "Finish & cash out", "Upload completion photos, get a signature, and your earnings land in your wallet instantly."],
];

const whyCards = [
  ["Keep 85%", "Low platform fee and no cut of your tips. What you quote is what you earn.", true],
  ["Pick your jobs", "Only take what fits your vehicle and schedule. Decline anything, anytime — no penalties.", false],
  ["Instant pay", "Cash out to your bank after every job, or bank it weekly. Your call.", false],
  ["Covered on the job", "In-trip liability coverage and 24/7 support have your back while you work.", false],
  ["Build your rep", "Ratings and reviews win you more jobs and let you charge what you're worth.", false],
  ["Own dashboard", "Track earnings, acceptance rate and performance — all in the driver app.", false],
];

const requirements = [
  ["Be 19 or older", "with a valid driver's licence"],
  ["An SUV, van or truck", "that you own or are insured to drive"],
  ["Vehicle insurance", "current and in your name"],
  ["Pass a background check", "quick and free — we handle it"],
  ["A smartphone", "to run the driver app"],
];

export default function DrivePage() {
  return (
    <MarketingShell active="earn">
      <style>{`
        .drive-hero,.drive-earnings,.drive-dual,.drive-cta{min-width:0}
        .drive-hero-copy,.drive-hero-visual,.drive-requirements{min-width:0}
        @media(max-width:1000px){
          .drive-hero{padding:48px 24px 56px!important;gap:32px!important;align-items:stretch!important}
          .drive-hero-copy{width:48%!important}
          .drive-hero-title{font-size:48px!important}
          .drive-hero-visual{min-height:400px!important}
          .drive-earnings{padding:24px!important;flex-direction:column!important;align-items:flex-start!important;gap:20px!important}
          .drive-earnings-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:20px 36px!important;width:100%}
          .drive-section{padding-left:24px!important;padding-right:24px!important}
          .drive-steps-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
          .drive-why-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
          .drive-dual{padding-left:24px!important;padding-right:24px!important;flex-direction:column!important}
          .drive-requirements{width:100%!important}
          .drive-cta-wrap{padding-left:24px!important;padding-right:24px!important}
          .drive-cta{padding:40px!important;gap:28px!important}
          .drive-footer-spacer{display:none}
        }
        @media(max-width:640px){
          .drive-hero{padding:28px 16px 36px!important;flex-direction:column!important;gap:24px!important}
          .drive-hero-copy{width:100%!important}
          .drive-hero-title{font-size:40px!important;margin-bottom:16px!important}
          .drive-hero-sub{font-size:15px!important;margin-bottom:24px!important}
          .drive-hero-actions{flex-direction:column!important;gap:10px!important}
          .drive-hero-actions a{width:100%!important;justify-content:center!important;height:52px!important}
          .drive-hero-visual{width:100%!important;min-height:260px!important;border-radius:16px!important}
          .drive-hero-earning-chip{top:12px!important;right:12px!important;padding:10px 13px!important}
          .drive-hero-job-chip{left:12px!important;right:12px!important;bottom:12px!important;max-width:calc(100% - 24px)}
          .drive-earnings{padding:20px 16px!important}
          .drive-earnings-grid{gap:18px 16px!important}
          .drive-stat-number{font-size:24px!important}
          .drive-section{padding:48px 16px 28px!important}
          .drive-section-heading{font-size:29px!important}
          .drive-steps-grid,.drive-why-grid{grid-template-columns:1fr!important;gap:14px!important}
          .drive-step-card,.drive-why-card{padding:22px!important}
          .drive-why-section{padding-top:28px!important;padding-bottom:56px!important}
          .drive-dual{padding:0 16px 56px!important;gap:16px!important}
          .drive-estimate,.drive-requirements{padding:30px 22px!important;border-radius:18px!important}
          .drive-estimate-value{font-size:46px!important}
          .drive-cta-wrap{padding:0 16px 48px!important}
          .drive-cta{padding:30px 22px!important;border-radius:18px!important;flex-direction:column!important;align-items:flex-start!important}
          .drive-cta-title{font-size:31px!important}
          .drive-cta a{width:100%!important;justify-content:center!important;height:54px!important}
        }
      `}</style>
      {/* HERO */}
      <div className="drive-hero" style={{ background: "#0E0E10", color: "#fff", padding: "72px 44px 88px", display: "flex", gap: 56, alignItems: "center" }}>
        <div className="drive-hero-copy" style={{ width: 600, flex: "none" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid rgba(255,255,255,.18)",
              padding: "7px 14px",
              borderRadius: 999,
              font: "700 11px 'Hanken Grotesk'",
              letterSpacing: ".05em",
              marginBottom: 24,
            }}
          >
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)" }} />
            DRIVE WITH YOUR OWN VEHICLE
          </div>
          <h1 className="drive-hero-title" style={{ margin: "0 0 20px", font: "900 64px/0.98 'Archivo'", letterSpacing: "-.035em" }}>
            Your truck.
            <br />
            Your hours.
            <br />
            Your rates.
          </h1>
          <p className="drive-hero-sub" style={{ margin: "0 0 32px", font: "400 18px/1.5 'Hanken Grotesk'", color: "rgba(255,255,255,.68)", maxWidth: 480 }}>
            Turn your SUV, van or pickup into income. See nearby jobs, send your own quote, and keep
            more of every fare. Cash out whenever you want.
          </p>
          <div className="drive-hero-actions" style={{ display: "flex", gap: 14, marginBottom: 20 }}>
          <a
            href={`${appUrls.driverWeb}/signup`}
            style={{
              height: 56,
              padding: "0 30px",
              borderRadius: 12,
              background: "var(--accent)",
              color: "#0E0E10",
              display: "inline-flex",
              alignItems: "center",
              font: "800 16px 'Archivo'",
              textDecoration: "none",
            }}
          >
            Start earning →
          </a>
            <Link
              href="#how"
              style={{
                height: 56,
                padding: "0 28px",
                borderRadius: 12,
                border: "1.5px solid rgba(255,255,255,.25)",
                color: "#fff",
                display: "inline-flex",
                alignItems: "center",
                font: "700 16px 'Hanken Grotesk'",
                textDecoration: "none",
              }}
            >
              See how it works
            </Link>
          </div>
          <div style={{ font: "500 14px 'Hanken Grotesk'", color: "rgba(255,255,255,.5)" }}>
            No sign-up fee · Approved in ~48 hours
          </div>
        </div>

        <div
          className="drive-hero-visual"
          style={{
            flex: 1,
            position: "relative",
            alignSelf: "stretch",
            minHeight: 480,
            borderRadius: 22,
            overflow: "hidden",
            background: "linear-gradient(135deg,#e6e4dc,#cfd3c8)",
          }}
        >
          <ImageSlot
            placeholder="Drop a photo — driver with their van"
            src="https://images.unsplash.com/photo-1619642751038-84ae01fdf1fa?auto=format&fit=crop&w=1200&q=80"
            alt="Driver with cargo van"
          />
          <div
            className="drive-hero-earning-chip"
            style={{
              position: "absolute",
              top: 22,
              right: 22,
              background: "var(--accent)",
              color: "#0E0E10",
              borderRadius: 16,
              padding: "14px 18px",
              boxShadow: "0 18px 40px rgba(0,0,0,.3)",
            }}
          >
            <div style={{ font: "700 10px 'Hanken Grotesk'", letterSpacing: ".08em" }}>THIS WEEK</div>
            <div style={{ font: "900 28px 'Archivo'" }}>$1,240</div>
            <div style={{ font: "600 12px 'Hanken Grotesk'", opacity: 0.7 }}>18 jobs · 4.9★</div>
          </div>
          <div
            className="drive-hero-job-chip"
            style={{
              position: "absolute",
              bottom: 22,
              left: 22,
              background: "#fff",
              borderRadius: 14,
              padding: "13px 16px",
              display: "flex",
              alignItems: "center",
              gap: 11,
              boxShadow: "0 18px 40px rgba(0,0,0,.3)",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "var(--accent)",
                border: "2px solid #0E0E10",
              }}
            />
            <div style={{ font: "700 13px 'Hanken Grotesk'", color: "#0E0E10" }}>New job 0.8 mi away · $90</div>
          </div>
        </div>
      </div>

      {/* EARNINGS BAR */}
      <div
        className="drive-earnings"
        style={{
          background: "var(--accent)",
          color: "#0E0E10",
          padding: "26px 44px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div className="drive-earnings-grid" style={{ display: "flex", gap: 56 }}>
          {[
            ["$28/hr", "avg. active earnings"],
            ["85%", "of the fare is yours"],
            ["Instant", "cash-out to your bank"],
            ["You", "set every quote"],
          ].map(([n, l]) => (
            <div key={l}>
              <div className="drive-stat-number" style={{ font: "900 30px 'Archivo'" }}>{n}</div>
              <div style={{ font: "600 13px 'Hanken Grotesk'", opacity: 0.7 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ font: "700 14px 'Hanken Grotesk'" }}>Work when you want · Zero commitment</div>
      </div>

      {/* HOW IT WORKS */}
      <div id="how" className="drive-section" style={{ padding: "80px 44px 40px" }}>
        <div style={{ maxWidth: 660, marginBottom: 44 }}>
          <div
            style={{
              font: "700 12px 'Hanken Grotesk'",
              letterSpacing: ".1em",
              color: "#8A8A90",
              textTransform: "uppercase",
              marginBottom: 12,
            }}
          >
            How driving works
          </div>
          <h2 className="drive-section-heading" style={{ margin: 0, font: "800 42px/1.05 'Archivo'", letterSpacing: "-.025em" }}>
            Get on the road in four steps.
          </h2>
        </div>
        <div className="drive-steps-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 18 }}>
          {steps.map(([n, title, body]) => (
            <div key={n} className="drive-step-card" style={{ border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 20, padding: 26, background: "#fff" }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: "#0E0E10",
                  color: "var(--accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  font: "900 17px 'Archivo'",
                  marginBottom: 18,
                }}
              >
                {n}
              </div>
              <h3 style={{ margin: "0 0 8px", font: "800 20px 'Archivo'" }}>{title}</h3>
              <p style={{ margin: 0, font: "400 14px/1.5 'Hanken Grotesk'", color: "#6B6B70" }}>{body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* WHY DRIVE */}
      <div className="drive-section drive-why-section" style={{ padding: "48px 44px 80px" }}>
        <h2 className="drive-section-heading" style={{ margin: "0 0 28px", font: "800 34px 'Archivo'", letterSpacing: "-.02em" }}>
          Why drivers choose MoveThisOut
        </h2>
        <div className="drive-why-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 18 }}>
          {whyCards.map(([title, body, dark]) => (
            <div
              key={title as string}
              className="drive-why-card"
              style={
                dark
                  ? { borderRadius: 20, padding: 26, background: "#0E0E10", color: "#fff" }
                  : { border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 20, padding: 26, background: "#fff" }
              }
            >
              <div style={{ font: "900 22px 'Archivo'", color: dark ? "var(--accent)" : "#0E0E10", marginBottom: 10 }}>
                {title}
              </div>
              <p style={{ margin: 0, font: "400 15px/1.55 'Hanken Grotesk'", color: dark ? "rgba(255,255,255,.7)" : "#6B6B70" }}>
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* EARNINGS ESTIMATE + REQUIREMENTS */}
      <div className="drive-dual" style={{ padding: "0 44px 80px", display: "flex", gap: 22, alignItems: "stretch" }}>
        <div className="drive-estimate" style={{ flex: 1, background: "#0E0E10", color: "#fff", borderRadius: 24, padding: "44px 48px" }}>
          <div
            style={{
              font: "700 12px 'Hanken Grotesk'",
              letterSpacing: ".1em",
              color: "var(--accent)",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            Weekly estimate
          </div>
          <h2 style={{ margin: "0 0 26px", font: "900 34px/1.05 'Archivo'", letterSpacing: "-.02em" }}>
            See what you could make
          </h2>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
            <span className="drive-estimate-value" style={{ font: "900 60px 'Archivo'", color: "var(--accent)" }}>$960</span>
            <span style={{ font: "700 18px 'Archivo'" }}>/ week</span>
          </div>
          <p style={{ margin: "0 0 24px", font: "400 14px 'Hanken Grotesk'", color: "rgba(255,255,255,.55)" }}>
            Based on 15 jobs/week in a cargo van · your area may vary
          </p>
          <div style={{ background: "rgba(255,255,255,.06)", borderRadius: 14, padding: 6 }}>
            {[
              ["Jobs per week", "15", true],
              ["Avg. fare", "$75", false],
              ["Your keep (85%)", "$960", false],
            ].map(([label, val, isAccent], i) => (
              <div key={label as string}>
                {i > 0 && <div style={{ height: 1, background: "rgba(255,255,255,.08)" }} />}
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", font: "600 14px 'Hanken Grotesk'" }}>
                  {label}
                  <span style={isAccent ? { color: "var(--accent)" } : undefined}>{val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="drive-requirements" style={{ width: 520, flex: "none", background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 24, padding: "44px 48px" }}>
          <div
            style={{
              font: "700 12px 'Hanken Grotesk'",
              letterSpacing: ".1em",
              color: "#8A8A90",
              textTransform: "uppercase",
              marginBottom: 14,
            }}
          >
            What you&apos;ll need
          </div>
          <h2 style={{ margin: "0 0 24px", font: "800 30px/1.05 'Archivo'", letterSpacing: "-.02em" }}>
            Requirements
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {requirements.map(([title, sub]) => (
              <div key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                <CheckBadge size={24} iconSize={12} />
                <div>
                  <div style={{ font: "700 15px 'Hanken Grotesk'" }}>{title}</div>
                  <div style={{ font: "400 14px 'Hanken Grotesk'", color: "#6B6B70" }}>{sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* APPLY CTA */}
      <div id="apply" className="drive-cta-wrap" style={{ padding: "0 44px 70px" }}>
        <div
          className="drive-cta"
          style={{
            background: "var(--accent)",
            borderRadius: 24,
            padding: 56,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h2 className="drive-cta-title" style={{ margin: "0 0 10px", font: "900 44px/1.02 'Archivo'", letterSpacing: "-.03em", color: "#0E0E10" }}>
              Ready to earn with
              <br />
              what you already drive?
            </h2>
            <p style={{ margin: 0, font: "500 16px 'Hanken Grotesk'", color: "rgba(0,0,0,.65)" }}>
              Sign up today — most drivers are approved within 48 hours.
            </p>
          </div>
          <a
            href={`${appUrls.driverWeb}/signup`}
            style={{
              height: 60,
              padding: "0 34px",
              borderRadius: 12,
              background: "#0E0E10",
              color: "#fff",
              display: "inline-flex",
              alignItems: "center",
              font: "800 17px 'Archivo'",
              whiteSpace: "nowrap",
              textDecoration: "none",
            }}
          >
            Sign up to drive →
          </a>
        </div>
      </div>
    </MarketingShell>
  );
}
