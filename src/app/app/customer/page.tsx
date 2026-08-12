import { redirect } from "next/navigation";
import { appUrls, sameAppOrigin } from "@/lib/theme/apps";

<<<<<<< HEAD
export default function CustomerAppEntryRedirect() {
  if (sameAppOrigin(appUrls.customerApp, appUrls.marketing)) {
    redirect("/");
=======
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { AppIcon } from "@/components/ui/Icons";
import { setAppRole } from "@/lib/appRole";
import styles from "../app-welcome.module.css";

export default function CustomerAppWelcomePage() {
  const router = useRouter();
  const { isAuthenticated, user, loading } = useAuth();

  useEffect(() => {
    setAppRole("customer");
  }, []);

  useEffect(() => {
    if (loading || !isAuthenticated || !user) return;
    router.replace("/customer-app");
  }, [isAuthenticated, user, loading, router]);

  if (loading || isAuthenticated) {
    return (
      <div className={styles.boot}>
        <div className={styles.bootMark}>M</div>
        <p>Opening MoveThisOut…</p>
      </div>
    );
>>>>>>> ac960226d218fcf032389f207fde44cc1d48f28f
  }
  redirect(appUrls.customerApp);
}
