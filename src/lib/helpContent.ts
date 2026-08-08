export type HelpArticle = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  body: string;
};

export const HELP_CATEGORIES = [
  { id: "1", title: "Booking a move", body: "Requests, quotes, negotiating and scheduling." },
  { id: "2", title: "Payments & refunds", body: "Charges, receipts, tips and disputes." },
  { id: "3", title: "During your move", body: "Tracking, chat, delays and completion." },
  { id: "4", title: "Driving & earnings", body: "Sign-up, verification, payouts and jobs." },
  { id: "5", title: "Account & app", body: "Login, notifications, privacy and settings." },
  { id: "6", title: "Safety & trust", body: "Coverage, reporting and verified movers." },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "negotiate-a-quote",
    title: "How do I negotiate a quote with a driver?",
    summary: "Send a counteroffer and wait for the mover to accept or reply.",
    category: "Booking a move",
    body: `After movers send quotes, open a quote and use Counteroffer to propose a different price. The mover can accept, decline, or counter again. Once you both agree, choose Cash on site or Wallet and confirm the booking.

Tips:
• Be specific about stairs, elevators, and fragile items so quotes stay fair.
• Counter once with a realistic number rather than many tiny changes.
• If timing matters, mention it in the counter note.`,
  },
  {
    slug: "driver-running-late",
    title: "What happens if my driver is running late?",
    summary: "Track live GPS, message the mover, and reschedule if needed.",
    category: "During your move",
    body: `Open Track in the customer app to see live status and ETA. Use in-app chat or call if a phone number is shown.

If the mover is significantly delayed:
1. Message them with a new preferred window.
2. Use Manage move → Reschedule when the booking is still confirmed.
3. If the move already started and something went wrong, open a dispute after completion with photos.`,
  },
  {
    slug: "refunds-and-disputes",
    title: "How do refunds and disputes work?",
    summary: "File a dispute from a completed booking with evidence.",
    category: "Payments & refunds",
    body: `After a move is completed, open the booking and choose Dispute. Pick a category, describe what happened, and upload photos if you have them.

Admins review disputes and may offer a partial or full wallet credit. Cash-on-site jobs are handled case-by-case because the cash already changed hands with the mover.

Wallet payments and tips appear in Payments & tips with invoice downloads.`,
  },
  {
    slug: "driver-payouts",
    title: "How soon do drivers get paid after a job?",
    summary: "Wallet jobs credit earnings after customer payment; cash jobs stay with you on site.",
    category: "Driving & earnings",
    body: `If the customer chose Wallet, your mover wallet is credited (minus platform fee) when they pay after delivery.

If they chose Cash on site, you collect cash at the destination and tap “I received the cash” in the driver app so the job is marked paid.

Request a cash-out from the Wallet tab when you want to move available balance to your bank. Admins approve cash-out requests.`,
  },
  {
    slug: "become-a-driver",
    title: "How do I become a driver?",
    summary: "Complete driver signup with vehicle, documents, and base location.",
    category: "Driving & earnings",
    body: `Go to Drive → Become a driver to open the driver site's signup flow. You’ll create an account, add vehicle details, upload licence / insurance / vehicle photos, take a selfie for face match, and set your Google Places home base.

An admin verifies your profile before you can go online and receive jobs.`,
  },
  {
    slug: "reschedule-a-move",
    title: "Can I reschedule a move?",
    summary: "Yes, from Manage move while the booking is still active.",
    category: "Booking a move",
    body: `On the Track screen, open Manage move → Reschedule and pick a new date. The mover is notified. If the job is already in progress or completed, reschedule may not be available — contact support or file a dispute instead.`,
  },
];

export function getHelpArticle(slug: string) {
  return HELP_ARTICLES.find((a) => a.slug === slug) ?? null;
}
