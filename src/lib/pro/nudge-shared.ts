/** Browser-safe Pro pricing helpers (no server imports). */

/**
 * Launch of the lower Pro price. While the live price (admin setting) is below the old one and the
 * window hasn't ended, the Pro page says "New lower price" and shows the old price struck out.
 * After the end date, or if the price goes back up, it returns to normal on its own.
 */
export const PREVIOUS_PRICE_KOBO = 300_000; // ₦3,000
export const NEW_PRICE_UNTIL = new Date("2026-12-08T00:00:00+01:00"); // midnight, Lagos time
export const newPriceActive = (priceKobo: number, now = new Date()) =>
  priceKobo < PREVIOUS_PRICE_KOBO && now.getTime() < NEW_PRICE_UNTIL.getTime();

/** Browser copy of "closed recently", so the pop-up can't flash back before the account record loads. */
export const POPUP_STORAGE_KEY = "fw:pro-popup";
