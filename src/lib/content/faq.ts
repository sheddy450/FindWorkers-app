/**
 * Frequently asked questions for the home page and the help centre (/help).
 * Plain, friendly Nigerian English; only promises the app actually keeps.
 * `home: true` marks the few shown on the home page.
 */
export type Faq = { q: string; a: string; for: "customers" | "artisans"; topic: string; home?: boolean };

export const FAQS: Faq[] = [
  // ── Customers ──────────────────────────────────────────────────────────────
  { for: "customers", topic: "Getting started", home: true, q: "Is FindWorkers free to use?",
    a: "Yes. Searching, contacting artisans, posting a job and getting quotes are all free for customers. You pay the artisan you hire for the work they do." },
  { for: "customers", topic: "Getting started", q: "How do I find an artisan near me?",
    a: "Use the search on the home page (\"I need a … in …\"), or tap Search and allow your location to see artisans sorted by distance. You can also browse by service or city." },
  { for: "customers", topic: "Trust and safety", home: true, q: "How do I know an artisan can be trusted?",
    a: "Look for the green verified badges: they mean our team has checked that artisan's details, such as their ID or phone number. Reviews can only be left by customers who booked the artisan through FindWorkers, so you're reading about real jobs. Photos of their work are checked by our team before they appear." },
  { for: "customers", topic: "Trust and safety", q: "What does \"Example photo\" mean on a card?",
    a: "That artisan hasn't added photos of their own work yet, so we show a general photo of the trade. Open their profile to see their own photos once they're approved." },
  { for: "customers", topic: "Trust and safety", q: "What does \"Featured\" mean?",
    a: "Featured artisans pay for a Pro plan to appear in the labelled Featured spot. It doesn't change the order of the normal results, which are based on distance, ratings, verification and reviews." },
  { for: "customers", topic: "Prices and payment", home: true, q: "How do I pay the artisan?",
    a: "You pay the artisan directly, the way you both agree. Agree the full price before work starts, ask for receipts when you pay for materials, and avoid paying everything up front: pay part at the start and the rest when the job is done." },
  { for: "customers", topic: "Prices and payment", q: "Are the prices on profiles and guides fixed?",
    a: "No. An artisan's price range is a guide to what they usually charge, and the prices in our hiring guides are estimates. The real price depends on the job, so agree it in the chat before work starts." },
  { for: "customers", topic: "Posting a job", home: true, q: "What is \"Post a job\"?",
    a: "Describe what you need and where, and artisans who offer that service in your state can send you a price. Compare their quotes, ratings and photos, then hire the one you like. Your job stays open for 14 days." },
  { for: "customers", topic: "Posting a job", q: "How do quotes work?",
    a: "Each artisan can send one quote with their price, a message and when they can start. You'll get a notification for each one. When you tap Hire, the job becomes a request with that artisan and the others are told you chose someone else." },
  { for: "customers", topic: "Posting a job", home: true, q: "Do I have to share my address?",
    a: "Not until you hire someone. Job posts only show your area, like \"Ikeja, Lagos\". Share your exact address in the chat with the artisan you choose." },
  { for: "customers", topic: "After the job", q: "How do I leave a review?",
    a: "When the artisan has finished, open the request and mark it complete. You'll then be able to rate the work and write a short review. Honest reviews help other customers." },
  { for: "customers", topic: "After the job", home: true, q: "What if something goes wrong?",
    a: "Talk to the artisan first in the app chat; most problems are sorted out that way. If you feel unsafe or were cheated, use \"Report this artisan\" on their profile and our team will look into it." },
  { for: "customers", topic: "Your account", q: "I forgot my password. What do I do?",
    a: "On the login page, tap \"Forgot password?\" and enter the email you registered with. We'll send you a link to set a new password." },

  // ── Artisans ───────────────────────────────────────────────────────────────
  { for: "artisans", topic: "Getting started", home: true, q: "Does it cost anything to join as an artisan?",
    a: "Joining, getting verified, receiving requests and sending quotes are free. There's an optional Pro plan that puts you in the Featured spot and shows how many people viewed your profile." },
  { for: "artisans", topic: "Getting jobs", home: true, q: "How do I get more jobs on FindWorkers?",
    a: "Complete your profile, add clear photos of your best work, get verified, and reply to customers quickly. Check the job board often: customers post jobs and choose from the quotes they receive. Read our guide \"How to get more jobs on FindWorkers\" for more." },
  { for: "artisans", topic: "Getting jobs", q: "Why don't I see any jobs on the job board?",
    a: "The job board shows open jobs for the services on your profile, in the state on your profile. Check that both are set. If they are, there may be no open jobs in your state right now: we'll notify you when one is posted." },
  { for: "artisans", topic: "Getting jobs", q: "How many quotes can a job get?",
    a: "Up to 10. Quote early with a clear message about what your price covers. You can update or withdraw your quote while the job is open." },
  { for: "artisans", topic: "Photos", q: "Why is my photo \"Awaiting review\"?",
    a: "Every photo is checked by our team before customers see it, usually within a day. If one isn't approved, you'll see the reason on your photos page and can upload a better one." },
  { for: "artisans", topic: "Photos", q: "What photos get approved?",
    a: "Clear photos of work you did yourself, with a caption saying what the job was. Stock photos, photos copied from the internet, blurry photos and photos showing people's personal details are not approved." },
  { for: "artisans", topic: "Verification", q: "How do I get the verified badge?",
    a: "Go to Verification from your dashboard and submit your details, such as your ID. Our team reviews them and you'll get a notification when it's done." },
  { for: "artisans", topic: "Pro plan", q: "What does the Pro plan give me?",
    a: "Pro artisans appear in the labelled Featured spot in search and on the home page, can see how many people viewed their profile, and get faster verification reviews. It's optional, and your normal ranking doesn't change." },
];
