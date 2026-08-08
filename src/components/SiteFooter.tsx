import Link from "next/link";
import { appUrls } from "@/lib/theme/apps";

export default function SiteFooter() {
  return (
    <div className="mto-footer">
      <div className="mto-footer-top">
        <div className="mto-footer-brand">
          <div className="mto-footer-logo">
            <div className="mto-footer-mark">M</div>
            <span className="mto-footer-name">MoveThisOut</span>
          </div>
          <p className="mto-footer-tagline">
            The on-demand marketplace connecting you with local drivers who move things — big or
            small.
          </p>
        </div>
        <FooterCol
          title="Move"
          links={[
            { label: "How it works", href: "/#how" },
            { label: "Vehicles", href: "/#vehicles" },
            { label: "Get a quote", href: appUrls.customerApp },
            { label: "Business moves", href: "/business" },
          ]}
        />
        <FooterCol
          title="Drive"
          links={[
            { label: "Become a driver", href: `${appUrls.driverWeb}/signup` },
            { label: "Driver login", href: `${appUrls.driverWeb}/login` },
            { label: "Driver app", href: appUrls.driverApp },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { label: "About", href: "/about" },
            { label: "Safety", href: "/about#safety" },
            { label: "Support", href: "/help" },
            { label: "Careers", href: "/about" },
          ]}
        />
      </div>
      <div className="mto-footer-bottom">
        <span>© 2026 MoveThisOut, Inc.</span>
        <span className="mto-footer-legal">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span>Cookies</span>
        </span>
      </div>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="mto-footer-col">
      <div className="mto-footer-col-title">{title}</div>
      <div className="mto-footer-col-links">
        {links.map((l) => (
          <Link key={l.label} href={l.href}>
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
