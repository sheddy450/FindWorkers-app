import { describe, it as test, expect } from "vitest";
import { createHash } from "node:crypto";
import { buildServerEvent, cleanEventId, consentFrom, cookieValue, normalizeEmail, normalizePhoneNG } from "../src/lib/meta/rules";

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

describe("Meta tracking rules", () => {
  test("Nigerian phones become 234… in every common format", () => {
    for (const p of ["08031234567", "0803 123 4567", "+234 803 123 4567", "2348031234567", "8031234567", "+234-803-123-4567"])
      expect(normalizePhoneNG(p)).toBe("2348031234567");
    expect(normalizePhoneNG("12345")).toBeNull();
    expect(normalizePhoneNG("")).toBeNull();
    expect(normalizePhoneNG(null)).toBeNull();
  });

  test("emails are trimmed and lower-cased", () => {
    expect(normalizeEmail("  Ada@Example.COM ")).toBe("ada@example.com");
    expect(normalizeEmail("not-an-email")).toBeNull();
  });

  test("consent comes only from our cookie, and only two values count", () => {
    expect(consentFrom("a=1; fw_consent=granted; b=2")).toBe("granted");
    expect(consentFrom("fw_consent=denied")).toBe("denied");
    expect(consentFrom("fw_consent=yes")).toBeNull();
    expect(consentFrom(null)).toBeNull();
    expect(cookieValue("_fbp=fb.1.123.456; _fbc=fb.1.1.abc", "_fbc")).toBe("fb.1.1.abc");
  });

  test("event ids from the browser must be short and plain", () => {
    expect(cleanEventId("job.6f1c2a9e-1b2c-4d5e-8f90-123456789abc")).toBe("job.6f1c2a9e-1b2c-4d5e-8f90-123456789abc");
    expect(cleanEventId("x")).toBeNull();
    expect(cleanEventId("bad id with spaces")).toBeNull();
    expect(cleanEventId("a".repeat(101))).toBeNull();
  });

  test("server event: identifiers hashed, browser ids and IP passed through, empties dropped", () => {
    const e = buildServerEvent({
      name: "CompleteRegistration", eventId: "reg.123456789", timeSec: 1760000000,
      sourceUrl: "https://findworkersapp.com/register", ip: "102.89.1.2", userAgent: "UA",
      fbp: "fb.1.1.2", fbc: null, email: " Ada@Example.com", phone: "0803 123 4567", externalId: "user_1",
      customData: { content_name: "artisan", status: true, empty: "", missing: undefined },
    }, sha);
    expect(e.event_name).toBe("CompleteRegistration");
    expect(e.event_id).toBe("reg.123456789");
    expect(e.action_source).toBe("website");
    expect(e.user_data.em).toEqual([sha("ada@example.com")]);
    expect(e.user_data.ph).toEqual([sha("2348031234567")]);
    expect(e.user_data.external_id).toEqual([sha("user_1")]);
    expect(e.user_data.client_ip_address).toBe("102.89.1.2");
    expect(e.user_data.fbp).toBe("fb.1.1.2");
    expect("fbc" in e.user_data).toBe(false);
    expect(e.custom_data).toEqual({ content_name: "artisan", status: true });
    // Nothing readable leaks: the raw phone and email never appear in the payload.
    const json = JSON.stringify(e);
    expect(json.includes("0803")).toBe(false);
    expect(json.toLowerCase().includes("ada@")).toBe(false);
  });

  test("unknown IP is left out rather than sent as junk", () => {
    const e = buildServerEvent({ name: "Lead", eventId: "job.123456789", timeSec: 1, ip: "unknown" }, sha);
    expect("client_ip_address" in e.user_data).toBe(false);
    expect("custom_data" in e).toBe(false);
  });
});
