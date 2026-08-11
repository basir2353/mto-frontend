export const HELP_ARTICLES = [
  {
    slug: "negotiate-quote",
    title: "How do I negotiate a quote with a driver?",
    category: "Booking a move",
    summary: "Counter-offer in chat until you both agree on a fair price.",
    body: [
      "After drivers send quotes on your request, open a quote and use Negotiate to propose a different price.",
      "You and the driver can go back and forth with counter-offers. When either side accepts, the price is locked.",
      "Tips: be clear about stairs, heavy items, and timing — that helps drivers price fairly the first time.",
    ],
  },
  {
    slug: "driver-running-late",
    title: "What happens if my driver is running late?",
    category: "During your move",
    summary: "Track live, chat in-app, and reschedule if needed.",
    body: [
      "Open your active booking to see live tracking and the driver’s ETA.",
      "Message them in-app if something changed on either side. Most delays are short traffic or previous-job overruns.",
      "If you need to reschedule or cancel, use the booking actions or contact support from Help → Contact support.",
    ],
  },
  {
    slug: "refunds-disputes",
    title: "How do refunds and disputes work?",
    category: "Payments & refunds",
    summary: "Open a dispute with evidence; support coordinates cash-on-site cases.",
    body: [
      "If something went wrong (damage, no-show, incorrect charge), open a dispute from the completed booking.",
      "Add photos and a short description. Our team reviews both sides.",
      "Because payment is cash on site, refunds are handled case-by-case with support.",
    ],
  },
  {
    slug: "cash-on-site",
    title: "How does cash on site payment work?",
    category: "Payments & refunds",
    summary: "Pay the mover in cash when the job finishes.",
    body: [
      "Bookings use cash on site. Pay the agreed amount to the mover at drop-off.",
      "The mover confirms “I received the cash” in the driver app so the job is marked paid.",
    ],
  },
] as const;

export type HelpArticleSlug = (typeof HELP_ARTICLES)[number]["slug"];

export function getHelpArticle(slug: string) {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
