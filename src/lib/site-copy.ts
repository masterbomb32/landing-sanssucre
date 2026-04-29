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
  social: {
    instagramUrl: "https://instagram.com/sanssucre.ph",
    facebookUrl: "https://facebook.com/sanssucre.ph",
    followPrompt: "Follow us for sweet updates",
  },
  mailingList: {
    headingNoEmail: "Get future rewards & event invites",
    bodyNoEmail: "Join our mailing list — be first to know about new treats and members-only events.",
    placeholder: "you@example.com",
    submit: "Count me in",
    success: "You're on the list!",
    headingHasEmail: "You're on the list",
    bodyHasEmail: "We'll email future rewards and event invites to {email}.",
  },
  findMyReward: {
    linkLabel: "Already signed up? Find my reward →",
    heading: "Find my reward",
    body: "Lost your link? Enter the mobile number you signed up with and we'll show your QR code.",
    submit: "Find my reward",
    notFound: "We couldn't find a reward for that number. Double-check it, or sign up at the home page.",
    placeholder: "09171234567",
  },
} as const;