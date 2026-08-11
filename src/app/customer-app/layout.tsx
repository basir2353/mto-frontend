"use client";

import AuthGuard from "@/components/AuthGuard";

export default function CustomerAppLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard roles={["customer"]}>{children}</AuthGuard>;
}
