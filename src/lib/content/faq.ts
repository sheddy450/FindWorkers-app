/**
 * Frequently asked questions. Plain, friendly Nigerian English; only promises the app actually keeps.
 * Shown on the home page now, and in the help centre later (customers and artisans grouped separately).
 */
export type Faq = { q: string; a: string; for: "customers" | "artisans" };

export const FAQS: Faq[] = [
  { for: "customers", q: "Is FindWorkers free to use?",
    a: "Yes. Searching, contacting artisans, posting a job and getting quotes are all free for customers. You pay the artisan you hire for the work they do." },
  { for: "customers", q: "How do I know an artisan can be trusted?",
    a: "Look for the green verified badges: they mean our team has checked that artisan's details, such as their ID or phone number. Reviews can only be left by customers who booked the artisan through FindWorkers, so you're reading about real jobs. Photos of their work are checked by our team before they appear." },
  { for: "customers", q: "How do I pay the artisan?",
    a: "You pay the artisan directly, the way you both agree. Agree the full price before work starts, ask for receipts when you pay for materials, and avoid paying everything up front: pay part at the start and the rest when the job is done." },
  { for: "customers", q: "What is \"Post a job\"?",
    a: "Describe what you need and where, and artisans who offer that service in your state can send you a price. Compare their quotes, ratings and photos, then hire the one you like. Your job stays open for 14 days." },
  { for: "customers", q: "Do I have to share my address?",
    a: "Not until you hire someone. Job posts only show your area, like \"Ikeja, Lagos\". Share your exact address in the chat with the artisan you choose." },
  { for: "customers", q: "What if something goes wrong?",
    a: "Talk to the artisan first in the app chat; most problems are sorted out that way. If you feel unsafe or were cheated, use \"Report this artisan\" on their profile and our team will look into it." },
  { for: "artisans", q: "How do I get more jobs on FindWorkers?",
    a: "Complete your profile, add clear photos of your best work, get verified, and reply to customers quickly. Check the job board often: customers post jobs and choose from the quotes they receive." },
  { for: "artisans", q: "Does it cost anything to join as an artisan?",
    a: "Joining, getting verified, receiving requests and sending quotes are free. There's an optional Pro plan that puts you in the Featured spot and shows how many people viewed your profile." },
];
