import type { User } from "@/lib/api/types";

export function isPhoneBridgeEmail(email: string | null | undefined): boolean {
  return !!email && /@phone\.mto\.app$/i.test(email);
}

export function formatPhoneDisplay(value: string): string {
  if (isPhoneBridgeEmail(value)) {
    const digits = value.split("@")[0] ?? "";
    return digits ? `+${digits}` : value;
  }
  const digits = value.replace(/\D/g, "");
  if (!digits) return value;
  return `+${digits}`;
}

/** Admin / lists: show phone for phone-auth users, never the synthetic @phone.mto.app email. */
export function userContactLabel(user: User): string {
  const profilePhone = user.moverProfile?.phone || user.customerProfile?.phone;
  if (profilePhone?.trim()) return formatPhoneDisplay(profilePhone);
  if (isPhoneBridgeEmail(user.email)) return formatPhoneDisplay(user.email);
  return user.email;
}

export function userDisplayName(user: User): string {
  if (user.moverProfile?.businessName?.trim()) return user.moverProfile.businessName.trim();
  if (user.customerProfile) {
    const name = `${user.customerProfile.firstName ?? ""} ${user.customerProfile.lastName ?? ""}`.trim();
    if (name) return name;
  }
  return userContactLabel(user);
}
