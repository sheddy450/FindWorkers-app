import { describe, it, expect } from "vitest";
import { sniffFileType } from "../src/lib/validation/upload";
import { canDecide, canSubmit, SUBMITTABLE } from "../src/lib/verification/rules";
import { profileSchema } from "../src/lib/validation/artisan";

const base = { businessName: "Emeka Plumbing", yearsExperience: 5, categoryIds: ["c1"], state: "FCT (Abuja)", lga: "Gwarinpa", serviceRadiusKm: 15, availability: "AVAILABLE_NOW" };
describe("file sniffing", () => {
  it("accepts real JPG/PNG/PDF signatures", () => {
    expect(sniffFileType(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0]))?.ext).toBe("jpg");
    expect(sniffFileType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0]))?.ext).toBe("png");
    expect(sniffFileType(Buffer.from("%PDF-1.7 ..."))?.ext).toBe("pdf");
  });
  it("rejects disguised files", () => expect(sniffFileType(Buffer.from("<script>alert(1)</script>"))).toBeNull());
});
describe("verification rules", () => {
  it("only lets pending records be decided", () => {
    expect(canDecide("PENDING")).toBe(true);
    for (const s of ["NONE", "APPROVED", "REJECTED", "EXPIRED"] as const) expect(canDecide(s)).toBe(false);
  });
  it("blocks resubmitting while pending or approved", () => {
    expect(canSubmit("PENDING")).toBe(false); expect(canSubmit("APPROVED")).toBe(false); expect(canSubmit("REJECTED")).toBe(true);
  });
  it("never allows BACKGROUND or PHONE by document upload", () => {
    expect(SUBMITTABLE).not.toContain("BACKGROUND"); expect(SUBMITTABLE).not.toContain("PHONE");
  });
});
describe("artisan profile", () => {
  it("accepts a valid profile", () => expect(profileSchema.safeParse(base).success).toBe(true));
  it("rejects inverted price range", () => expect(profileSchema.safeParse({ ...base, priceMinNaira: 9000, priceMaxNaira: 5000 }).success).toBe(false));
  it("rejects coordinates outside Nigeria", () => expect(profileSchema.safeParse({ ...base, lat: 51.5, lng: -0.1 }).success).toBe(false));
  it("rejects half a coordinate pair", () => expect(profileSchema.safeParse({ ...base, lat: 9.07 }).success).toBe(false));
});
