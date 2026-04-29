/**
 * Single source of truth for all user-facing copy on the landing page.
 * Edit any string here to update it across the site.
 */
export const siteCopy = {
  brand: {
    name: "Sans Sucre",
    tagline: "Opening Day Rewards",
    shareText: "Join Sans Sucre's opening day and claim a sweet treat!",
  },
  hero: {
    eyebrow: "Grand Opening",
    headline: { line1: "A sweet welcome,", line2: "just for you." },
    sub: "Pick your treat. Show up on opening day. We'll have it waiting.",
    location: "Find us inside Metro Supermarket — Alabang Town Center.",
    primaryCta: "Pick my treat →",
  },
  stickyCta: "Pick my treat",
  form: {
    heading: "Almost there — just your details",
    sub: "Tell us where to send your unique code. Show it at the shop on opening day.",
    consentPrefix: "By submitting, you agree to our",
    consentLinkLabel: "privacy notice",
    fineprint: "One reward per person.",
    submit: "Claim my reward",
    privacyMicrocopy: "We use your details only to deliver your treat — never shared.",
  },
  footer: {
    location: "You'll find Sans Sucre tucked inside Metro Supermarket at Alabang Town Center.",
    privacyLabel: "Privacy",
  },
  meta: {
    title: "Sans Sucre — Opening Day Rewards",
    description:
      "Sign up, pick a treat, and visit Sans Sucre on opening day at Metro Supermarket, Alabang Town Center.",
  },
  thankYou: {
    headline: "Enjoy your treat!",
    sub: "Thanks for celebrating opening day with us.",
    feedbackPrompt: "How was your visit?",
    feedbackPlaceholder: "Anything you'd like us to know? (optional)",
    feedbackSubmit: "Send feedback",
    feedbackThanks: "Thank you for your feedback!",
    shareText: "I just claimed my Sans Sucre opening day treat 🧁",
  },
  futureRewards: {
    heading: "What's next at Sans Sucre",
    body: "We'll be posting weekly specials and members-only previews. Watch this space — and your inbox.",
  },
} as const;