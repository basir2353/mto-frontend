"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/api/types";
<<<<<<< HEAD
import { appAuthPath, appHomePath } from "@/lib/appRole";
=======
>>>>>>> ac960226d218fcf032389f207fde44cc1d48f28f
import { PageLoader } from "@/components/ui/MtoLoader";

export default function AuthGuard({
  children,
  roles,
  redirectTo,
}: {
  children: React.ReactNode;
  roles?: UserRole[];
  redirectTo?: string;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
<<<<<<< HEAD
  const unauthRedirect = redirectTo ?? appAuthPath();
=======
  const unauthRedirect = redirectTo ?? "/auth?app=customer";
>>>>>>> ac960226d218fcf032389f207fde44cc1d48f28f

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(unauthRedirect);
      return;
    }
    if (roles?.length && user && !roles.some((r) => user.roles.includes(r))) {
<<<<<<< HEAD
      router.replace(appHomePath());
=======
      router.replace("/customer-app");
>>>>>>> ac960226d218fcf032389f207fde44cc1d48f28f
    }
  }, [loading, isAuthenticated, user, roles, router, unauthRedirect]);

  if (loading) {
    return <PageLoader label="Loading MoveThisOut…" />;
  }

  if (!isAuthenticated) return null;
  if (roles?.length && user && !roles.some((r) => user.roles.includes(r))) return null;

  return <>{children}</>;
}
