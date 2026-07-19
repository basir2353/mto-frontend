import MarketingShell from "@/components/MarketingShell";
import styles from "@/app/public-pages.module.css";

export default function PrivacyPage() {
  return (
    <MarketingShell active="">
      <div style={{ padding: "72px 44px 96px", maxWidth: 760, margin: "0 auto" }}>
        <p style={{ margin: "0 0 12px", font: "700 12px 'Hanken Grotesk'", letterSpacing: ".1em", textTransform: "uppercase", color: "#8A8A90" }}>
          Legal
        </p>
        <h1 className={styles.sectionTitle} style={{ margin: "0 0 12px", font: "900 42px/1.05 'Archivo'", letterSpacing: "-.03em" }}>
          Privacy Policy
        </h1>
        <p style={{ margin: "0 0 32px", font: "500 14px 'Hanken Grotesk'", color: "#6B6B70" }}>
          Last updated: July 19, 2026 · PIPEDA-oriented · Canada
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 28, font: "400 15px/1.65 'Hanken Grotesk'", color: "#2a2a30" }}>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px 'Archivo'" }}>1. What we collect</h2>
            <p style={{ margin: 0 }}>
              Account details (name, email, phone), booking addresses and item descriptions, payment and
              wallet activity, device/app data, and — for drivers — licence, insurance, vehicle, and
              verification documents.
            </p>
          </section>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px 'Archivo'" }}>2. How we use it</h2>
            <p style={{ margin: 0 }}>
              We use personal information to operate the marketplace, match jobs, process payments, send
              service messages, verify drivers, improve safety, and comply with law. Location data is used
              during active jobs for tracking and ETAs.
            </p>
          </section>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px 'Archivo'" }}>3. Sharing</h2>
            <p style={{ margin: 0 }}>
              We share what is needed to complete a move (e.g. pickup details with your assigned mover). We
              use service providers for hosting, email, and analytics under contractual safeguards. We do not
              sell your personal information.
            </p>
          </section>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px 'Archivo'" }}>4. Retention &amp; security</h2>
            <p style={{ margin: 0 }}>
              We retain data as long as your account is active and as needed for legal, tax, and dispute
              purposes. We use industry-standard technical and organizational measures to protect information.
            </p>
          </section>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px 'Archivo'" }}>5. Your rights</h2>
            <p style={{ margin: 0 }}>
              Subject to Canadian privacy law (including PIPEDA), you may request access to or correction of
              your personal information, and in some cases deletion or withdrawal of consent for marketing.
              Contact us using the details below.
            </p>
          </section>
          <section>
            <h2 style={{ margin: "0 0 10px", font: "800 20px 'Archivo'" }}>6. Contact</h2>
            <p style={{ margin: 0 }}>
              Privacy questions:{" "}
              <a href="mailto:privacy@movethisout.com" style={{ color: "#0E0E10", fontWeight: 600 }}>
                privacy@movethisout.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </MarketingShell>
  );
}
