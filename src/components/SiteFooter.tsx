import Link from "next/link";

const columns = [
  {
    title: "Move",
    links: [
      { label: "How it works", href: "/#how" },
      { label: "Vehicles", href: "/#vehicles" },
      { label: "Get a quote", href: "/customer-app" },
      { label: "Business moves", href: "/business" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Safety", href: "/about#safety" },
      { label: "Support", href: "/help" },
      { label: "Careers", href: "/about" },
    ],
  },
];

export default function SiteFooter() {
  return (
    <div className="mto-footer">
      <div className="mto-footer-top">
        <div className="mto-footer-brand">
          <div className="mto-footer-logo">
            <div className="mto-footer-mark">M</div>
            <span className="mto-footer-name">MoveThisOut</span>
          </div>
          <p className="mto-footer-tagline">The on-demand marketplace connecting customers with local moving professionals.</p>
        </div>
        {columns.map((column) => <FooterCol key={column.title} {...column} />)}
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

function FooterCol({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="mto-footer-col">
      <div className="mto-footer-col-title">{title}</div>
      <div className="mto-footer-col-links">
        {links.map((link) => <Link key={link.label} href={link.href}>{link.label}</Link>)}
      </div>
    </div>
  );
}
