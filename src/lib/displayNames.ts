import type { User } from "@/lib/api/types";

export function customerDisplayName(user?: User | null) {
  if (!user) return "Customer";
  if (user.customerProfile) {
    const full = `${user.customerProfile.firstName ?? ""} ${user.customerProfile.lastName ?? ""}`.trim();
    if (full) return full;
  }
  const local = user.email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  return local ? local.replace(/\b\w/g, (c) => c.toUpperCase()) : "Customer";
}

export function moverDisplayName(user?: User | null) {
  return user?.moverProfile?.businessName ?? user?.email?.split("@")[0] ?? "Mover";
}

export function partyDisplayName(user?: User | null) {
  if (!user) return "User";
  if (user.roles?.includes("admin")) return "Admin";
  if (user.customerProfile) return customerDisplayName(user);
  if (user.moverProfile) return moverDisplayName(user);
  return user.email ?? "User";
}
