"use client";

import Link from "next/link";
import AuthGuard from "@/components/AuthGuard";

const faqs = [
  {
    q: "How do quotes work?",
    a: "Post your move details. Nearby verified movers send prices. You compare, negotiate in chat, and accept one quote to create a booking.",
  },
  {
    q: "When am I charged?",
    a: "Add money to your wallet first. After delivery is verified, you release payment from the wallet. Tips are optional after rating.",
  },
  {
    q: "How do I raise a dispute?",
    a: "Open Track or History, expand your move, and use Manage this move → Raise dispute. Pick a category, describe the issue in detail, and our team responds within 24–48 hours.",
  },
  {
    q: "Can I cancel after booking?",
    a: "Yes, before pickup. Use Manage this move → Cancel move. Cancellations close to pickup time may affect account standing.",
  },
  {
    q: "How does live tracking work?",
    a: "Once your mover starts the job, their GPS appears on your map. You can share a tracking link with family from Manage this move.",
  },
  {
    q: "What vehicle size do I need?",
    a: "On the review step before publishing, we analyze your item list and distance to suggest the right truck size, load weight, and a ballpark vehicle estimate.",
  },
  {
    q: "Can I book the same mover again?",
    a: "Yes. Open a completed move in History and tap Book again with same mover, or Duplicate as draft to copy addresses and items into a new booking.",
  },
  {
    q: "How do I track my dispute?",
    a: "After submitting a dispute, check Profile → Your disputes for status updates. Resolved cases show the admin's written resolution.",
  },
  {
    q: "What are saved addresses for?",
    a: "Store home, office, or storage locations with delivery instructions (buzz codes, elevator access). Edit or set a default anytime from Profile.",
  },
];

const disputeSteps = [
  "Gather photos of damage or proof of the issue.",
  "Open the completed or active move in Track or History.",
  "Choose Raise dispute and select the closest category.",
  "Write at least 20 characters explaining what happened and what you want (refund, partial credit, etc.).",
  "Admin reviews both sides and emails you the resolution.",
];

export default function CustomerSupportPage() {
  return (
    <AuthGuard roles={["customer"]}>
      <div
        style={{
          background: "#F5F4EF",
          height: "100dvh",
          width: "100%",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="support-header" style={{ height: 66, flex: "none", background: "#0E0E10", color: "#fff", display: "flex", alignItems: "center", padding: "0 26px", gap: 16 }}>
          <Link href="/customer-app" style={{ color: "#fff", textDecoration: "none", font: "700 14px 'Hanken Grotesk'" }}>
            ← Back to app
          </Link>
          <span style={{ marginLeft: "auto", font: "800 18px 'Archivo'" }}>Help & support</span>
        </div>

        <div className="support-content" style={{ flex: 1, overflow: "auto", minHeight: 0, padding: "36px 40px 48px" }}>
          <h1 style={{ margin: "0 0 8px", font: "900 34px 'Archivo'", letterSpacing: "-.025em" }}>We&apos;re here to help</h1>
          <p style={{ margin: "0 0 28px", font: "500 16px 'Hanken Grotesk'", color: "#6B6B70", maxWidth: 640 }}>
            Guides for booking, payments, disputes, and cancellations. For urgent safety issues, email support@movethisout.com.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 14, marginBottom: 32 }}>
            {[
              { title: "Book a move", href: "/customer-app", desc: "Start a new request" },
              { title: "Wallet & billing", href: "/customer-app", desc: "Top up and pay invoices" },
              { title: "Your profile", href: "/customer-app/profile", desc: "Addresses & settings" },
              { title: "General help", href: "/help", desc: "Platform overview" },
            ].map((card) => (
              <Link key={card.title} href={card.href} style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 14, padding: "18px 20px", height: "100%" }}>
                  <div style={{ font: "800 16px 'Archivo'" }}>{card.title}</div>
                  <div style={{ font: "500 13px 'Hanken Grotesk'", color: "#6B6B70", marginTop: 6 }}>{card.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          <section style={{ marginBottom: 32 }}>
            <h2 style={{ margin: "0 0 14px", font: "800 22px 'Archivo'" }}>Dispute process</h2>
            <div style={{ background: "#fff4df", border: "1.5px solid #e8c96a", borderRadius: 14, padding: "18px 20px" }}>
              <ol style={{ margin: 0, paddingLeft: 20, font: "600 15px 'Hanken Grotesk'", lineHeight: 1.8, color: "#3a3a40" }}>
                {disputeSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </section>

          <section>
            <h2 style={{ margin: "0 0 14px", font: "800 22px 'Archivo'" }}>FAQ</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {faqs.map((f) => (
                <details key={f.q} style={{ background: "#fff", border: "1.5px solid rgba(0,0,0,.1)", borderRadius: 14, padding: "14px 18px" }}>
                  <summary style={{ font: "700 15px 'Hanken Grotesk'", cursor: "pointer" }}>{f.q}</summary>
                  <p style={{ margin: "12px 0 0", font: "500 14px/1.55 'Hanken Grotesk'", color: "#6B6B70" }}>{f.a}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
        <style>{`
          @media(max-width:600px){
            .support-header{height:58px!important;padding:0 14px!important}
            .support-header>span{font-size:15px!important}
            .support-content{padding:26px 16px 36px!important}
            .support-content h1{font-size:29px!important}
            .support-content>div{grid-template-columns:1fr!important}
          }
        `}</style>
      </div>
    </AuthGuard>
  );
}
