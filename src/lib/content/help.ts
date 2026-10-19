/** Short explanations for the "?" help buttons next to things people may not understand. */
export const HELP = {
  verified: { title: "What \"verified\" means", body: "Our team has checked this artisan's details, such as their ID, phone number or business. Each green badge is one check that passed. It isn't a guarantee of their work: read reviews and look at their photos too." },
  priceRange: { title: "About price ranges", body: "This is what the artisan says they usually charge. The real price depends on your job, so agree it in the chat before work starts, including materials." },
  featured: { title: "Why some artisans are featured", body: "Featured artisans pay for a Pro plan to appear in this labelled spot. The normal results below aren't affected by payment." },
  quotes: { title: "How quotes work", body: "Artisans who offer this service in your state can each send one price. Compare their reviews, photos and badges, then tap Hire on the one you want. The others are told you chose someone else." },
  jobBoard: { title: "About the job board", body: "Customers in your state post jobs for the services on your profile. Send a clear quote: what your price covers, how long it takes and when you can start. The customer gets your contact if they hire you." },
  reviews: { title: "Where reviews come from", body: "Only customers who booked this artisan through FindWorkers can leave a review, after the job is marked complete." },
  examplePhoto: { title: "Example photo", body: "This artisan hasn't added approved photos of their own work yet, so we show a general photo of the trade." },
} as const;
export type HelpKey = keyof typeof HELP;
