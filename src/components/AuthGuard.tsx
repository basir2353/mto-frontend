"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/lib/api/types";
import { PageLoader } from "@/components/ui/MtoLoader";

export default function AuthGuard({
  children,
  roles,
  redirectTo = "/auth",
}: {
  children: React.ReactNode;
  roles?: UserRole[];
  redirectTo?: string;
}) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }
    if (roles?.length && user && !roles.some((r) => user.roles.includes(r))) {
      router.replace(
        user.roles.includes("admin")
          ? "/admin"
          : user.roles.includes("mover")
            ? "/driver-app"
            : "/customer-app",
      );
    }
  }, [loading, isAuthenticated, user, roles, router, redirectTo]);

  if (loading) {
    return <PageLoader label="Loading MoveThisOut…" />;
  }

  if (!isAuthenticated) return null;
  if (roles?.length && user && !roles.some((r) => user.roles.includes(r))) return null;

  return <>{children}</>;
}
