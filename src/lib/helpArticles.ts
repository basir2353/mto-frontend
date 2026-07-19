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
    summary: "Open a dispute with evidence; wallet refunds when approved.",
    body: [
      "If something went wrong (damage, no-show, incorrect charge), open a dispute from the completed booking.",
      "Add photos and a short description. Our team reviews both sides and may credit a refund to your wallet.",
      "Wallet refunds can be used on a future MoveThisOut booking. Cash-on-site jobs may require direct coordination with support.",
    ],
  },
  {
    slug: "driver-payouts",
    title: "How soon do drivers get paid after a job?",
    category: "Driving & earnings",
    summary: "Earnings hit your mover wallet after the job payment is released.",
    body: [
      "When a customer pays (wallet) or you confirm cash on site, earnings (minus the platform fee) are credited to your mover wallet.",
      "Tips are included when the customer adds them.",
      "Request a cash-out from the Pay tab when you want funds sent to your bank / e-transfer details on file.",
    ],
  },
] as const;

export type HelpArticleSlug = (typeof HELP_ARTICLES)[number]["slug"];

export function getHelpArticle(slug: string) {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}
