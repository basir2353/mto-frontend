export type HelpArticle = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  body: string;
};

export const HELP_CATEGORIES = [
  { id: "1", title: "Booking a move", body: "Requests, quotes, negotiating, and scheduling." },
  { id: "2", title: "Payments & refunds", body: "Cash on site, receipts, tips, and disputes." },
  { id: "3", title: "During your move", body: "Tracking, chat, delays, and completion." },
  { id: "4", title: "Account & app", body: "Login, notifications, privacy, and settings." },
  { id: "5", title: "Safety & trust", body: "Coverage, reporting, and verified movers." },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "negotiate-a-quote",
    title: "How do I negotiate a quote with a mover?",
    summary: "Send a counteroffer and wait for the mover to accept or reply.",
    category: "Booking a move",
    body: `After movers send quotes, open a quote and use Counteroffer to propose a different price. The mover can accept, decline, or counter again. Once you both agree, confirm the booking and pay the mover in cash on site when the job finishes.

Tips:
• Be specific about stairs, elevators, and fragile items so quotes stay fair.
• Counter once with a realistic number rather than many tiny changes.
• If timing matters, mention it in the counter note.`,
  },
  {
    slug: "mover-running-late",
    title: "What happens if my mover is running late?",
    summary: "Track live GPS, message the mover, and reschedule if needed.",
    category: "During your move",
    body: `Open Track in the customer app to see live status and ETA. Use in-app chat or call if a phone number is shown.

If the mover is significantly delayed:
1. Message them with a new preferred window.
2. Use Manage move → Reschedule while the booking is still confirmed.
3. If the move already started and something went wrong, open a dispute after completion with photos.`,
  },
  {
    slug: "refunds-and-disputes",
    title: "How do refunds and disputes work?",
    summary: "File a dispute from a completed booking with evidence.",
    category: "Payments & refunds",
    body: `After a move is completed, open the booking and choose Dispute. Pick a category, describe what happened, and upload photos if you have them.

Admins review disputes case-by-case. Because payment is cash on site, refunds are coordinated with support after both sides are reviewed.`,
  },
  {
    slug: "cash-on-site",
    title: "How does cash on site payment work?",
    summary: "Pay the mover in cash when the job finishes; they confirm receipt in the app.",
    category: "Payments & refunds",
    body: `MoveThisOut bookings use cash on site. When your move is complete, pay the agreed amount to the mover in cash.

The mover taps “I received the cash” in the driver app so the job is marked paid. Keep a receipt or chat note if you want a record of the amount.

Tips and disputes are handled through the booking and support if something goes wrong.`,
  },
  {
    slug: "reschedule-a-move",
    title: "Can I reschedule a move?",
    summary: "Yes, from Manage move while the booking is still active.",
    category: "Booking a move",
    body: `On the Track screen, open Manage move → Reschedule and pick a new date. The mover is notified. If the job is already in progress or completed, rescheduling may not be available—contact support or file a dispute instead.`,
  },
];

export function getHelpArticle(slug: string) {
  return HELP_ARTICLES.find((article) => article.slug === slug) ?? null;
}
