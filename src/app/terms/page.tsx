import MarketingShell from "@/components/MarketingShell";
import styles from "@/app/public-pages.module.css";

export default function TermsPage() {
  return (
    <MarketingShell active="">
      <div style={{ padding: "72px 44px 96px", maxWidth: 760, margin: "0 auto" }}>
        <p style={{ margin: "0 0 12px", font: "700 12px var(--font-hanken)", letterSpacing: ".1em", textTransform: "uppercase", color: "#8A8A90" }}>
          Legal
        </p>
        <h1 className={styles.sectionTitle} style={{ margin: "0 0 12px", font: "900 42px/1.05 var(--font-archivo)", letterSpacing: "-.03em" }}>
          Terms of Service
        </h1>
        <p style={{ margin: "0 0 32px", font: "500 14px var(--font-hanken)", color: "#6B6B70" }}>
          Last updated: July 19, 2026 · Governed by the laws of Canada (Ontario)
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, font: "400 15px/1.65 var(--font-hanken)", color: "#2a2a30" }}>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px var(--font-archivo)" }}>1. The marketplace</h2>
            <p style={{ margin: 0 }}>
              MoveThisOut (&quot;we&quot;, &quot;us&quot;) operates an online marketplace that connects customers who need
              something moved with independent local drivers (&quot;movers&quot;). We are not a motor carrier or
              moving company; movers provide services as independent contractors.
            </p>
          </section>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px var(--font-archivo)" }}>2. Accounts</h2>
            <p style={{ margin: 0 }}>
              You must provide accurate information, keep login credentials secure, and be at least 18 years
              old. We may suspend accounts that violate these terms or applicable law.
            </p>
          </section>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px var(--font-archivo)" }}>3. Bookings &amp; payments</h2>
            <p style={{ margin: 0 }}>
              Quotes and prices are set between customers and movers. Payment may be made by cash on site or
              wallet balance where available. Platform fees may apply to movers. Tips are optional and go to
              the mover.
            </p>
          </section>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px var(--font-archivo)" }}>4. Cancellations &amp; disputes</h2>
            <p style={{ margin: 0 }}>
              You should cancel as early as possible if plans change. Disputes can be opened in-app; we may
              mediate and, where appropriate, issue wallet refunds. Outcomes depend on evidence and job status.
            </p>
          </section>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px var(--font-archivo)" }}>5. Driver obligations</h2>
            <p style={{ margin: 0 }}>
              Movers must hold a valid licence, adequate insurance for their vehicle and cargo as required in
              their province, and complete verification. You are responsible for safe driving and lawful
              operation of your vehicle.
            </p>
          </section>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px var(--font-archivo)" }}>6. Liability</h2>
            <p style={{ margin: 0 }}>
              To the fullest extent permitted by Canadian law, MoveThisOut is not liable for indirect or
              consequential damages arising from moves performed by independent movers. Nothing in these terms
              limits rights you have under applicable consumer protection statutes that cannot be waived.
            </p>
          </section>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px var(--font-archivo)" }}>7. Contact</h2>
            <p style={{ margin: 0 }}>
              Questions about these terms:{" "}
              <a href="mailto:legal@movethisout.com" style={{ color: "#0E0E10", fontWeight: 600 }}>
                legal@movethisout.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </MarketingShell>
  );
}
