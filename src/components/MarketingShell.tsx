import SiteNav from "./SiteNav";
import SiteFooter from "./SiteFooter";
import AppPromptPopup from "./AppPromptPopup";

type NavKey = "move" | "earn" | "business" | "about" | "";

export default function MarketingShell({
  active,
  children,
}: {
  active: NavKey;
  children: React.ReactNode;
}) {
  return (
    <div className="mto-marketing-outer">
      <div className="mto-marketing-shell">
        <SiteNav active={active} />
        {children}
        <SiteFooter />
        <AppPromptPopup mode={active === "earn" ? "earn" : "move"} />
      </div>
    </div>
  );
}
