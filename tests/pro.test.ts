import { describe, it, expect } from "vitest";
import { createHmac } from "crypto";
import {
  DEFAULT_PRO_PRICE_KOBO, extendProUntil, isPro, isValidPaystackSignature, parseNairaPrice, paymentMatches,
  pickRandom, priceFromSetting, proDaysLeft, statDay,
} from "../src/lib/pro/rules";

const now = new Date("2026-10-02T12:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);

describe("pro status", () => {
  it("is Pro only while proUntil is in the future", () => {
    expect(isPro(days(1), now)).toBe(true);
    expect(isPro(days(-1), now)).toBe(false);
    expect(isPro(null, now)).toBe(false);
  });
  it("counts days left, rounded up", () => {
    expect(proDaysLeft(days(29.2), now)).toBe(30);
    expect(proDaysLeft(days(-3), now)).toBe(0);
  });
});

describe("extending Pro", () => {
  it("starts 30 days from now when not Pro", () => expect(extendProUntil(null, now)).toEqual(days(30)));
  it("starts from now when Pro has expired", () => expect(extendProUntil(days(-10), now)).toEqual(days(30)));
  it("stacks on top of remaining days when paying early", () => expect(extendProUntil(days(5), now)).toEqual(days(35)));
});

describe("price setting", () => {
  it("parses naira input into kobo", () => {
    expect(parseNairaPrice("3000")).toBe(300_000);
    expect(parseNairaPrice("₦3,500")).toBe(350_000);
    expect(parseNairaPrice("2500.50")).toBe(250_050);
  });
  it("rejects nonsense and out-of-range prices", () => {
    for (const bad of ["", "abc", "-5", "0", "50", "1e9", "200000"]) expect(parseNairaPrice(bad)).toBeNull();
  });
  it("falls back to the default when the stored value is missing or corrupt", () => {
    expect(priceFromSetting(undefined)).toBe(DEFAULT_PRO_PRICE_KOBO);
    expect(priceFromSetting("oops")).toBe(DEFAULT_PRO_PRICE_KOBO);
    expect(priceFromSetting("500000")).toBe(500_000);
  });
});

describe("paystack webhook signature", () => {
  const secret = "sk_test_abc", body = JSON.stringify({ event: "charge.success", data: { reference: "r1" } });
  const good = createHmac("sha512", secret).update(body).digest("hex");
  it("accepts the right signature", () => expect(isValidPaystackSignature(body, good, secret)).toBe(true));
  it("rejects a wrong or missing signature", () => {
    expect(isValidPaystackSignature(body, good.replace(/.$/, "0"), secret)).toBe(false);
    expect(isValidPaystackSignature(body, null, secret)).toBe(false);
    expect(isValidPaystackSignature(body + " ", good, secret)).toBe(false);
  });
  it("rejects everything when no secret is configured", () => expect(isValidPaystackSignature(body, good, "")).toBe(false));
});

describe("payment verification", () => {
  const expected = { reference: "r1", amountKobo: 300_000 };
  const ok = { status: "success", amount: 300_000, currency: "NGN", reference: "r1" };
  it("accepts an exact successful naira payment", () => expect(paymentMatches(ok, expected)).toBe(true));
  it("rejects failed, short, wrong-currency or wrong-reference payments", () => {
    expect(paymentMatches({ ...ok, status: "failed" }, expected)).toBe(false);
    expect(paymentMatches({ ...ok, amount: 100 }, expected)).toBe(false);
    expect(paymentMatches({ ...ok, currency: "USD" }, expected)).toBe(false);
    expect(paymentMatches({ ...ok, reference: "other" }, expected)).toBe(false);
  });
});

describe("featured pick", () => {
  it("returns at most n distinct items from the list", () => {
    const picked = pickRandom(["a", "b", "c", "d"], 2);
    expect(picked).toHaveLength(2);
    expect(new Set(picked).size).toBe(2);
    expect(picked.every((x) => ["a", "b", "c", "d"].includes(x))).toBe(true);
  });
  it("handles short lists and n = 0", () => {
    expect(pickRandom(["a"], 2)).toEqual(["a"]);
    expect(pickRandom(["a", "b"], 0)).toEqual([]);
  });
  it("gives everyone a turn over many picks", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) pickRandom(["a", "b", "c", "d", "e"], 2).forEach((x) => seen.add(x));
    expect(seen.size).toBe(5);
  });
});

describe("stat day", () => it("uses the UTC calendar day", () =>
  expect(statDay(new Date("2026-10-02T23:59:00Z")).toISOString()).toBe("2026-10-02T00:00:00.000Z")));
