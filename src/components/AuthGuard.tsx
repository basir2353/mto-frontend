"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/api/types";
import { appAuthPath, appHomePath } from "@/lib/appRole";
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
  const unauthRedirect = redirectTo ?? appAuthPath();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(unauthRedirect);
      return;
    }
    if (roles?.length && user && !roles.some((r) => user.roles.includes(r))) {
      router.replace(appHomePath());
    }
  }, [loading, isAuthenticated, user, roles, router, unauthRedirect]);

  if (loading) {
    return <PageLoader label="Loading MoveThisOut…" />;
  }

  if (!isAuthenticated) return null;
  if (roles?.length && user && !roles.some((r) => user.roles.includes(r))) return null;

  return <>{children}</>;
}
