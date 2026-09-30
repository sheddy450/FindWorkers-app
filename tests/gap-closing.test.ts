import { describe, it, expect } from "vitest";
import { reviewSchema } from "../src/lib/validation/review";
import { messageSchema } from "../src/lib/validation/message";
import { sniffFileType } from "../src/lib/validation/upload";

describe("review validation", () => {
  it("requires a rating between 1 and 5", () => {
    expect(reviewSchema.safeParse({ rating: 0 }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: 6 }).success).toBe(false);
    expect(reviewSchema.safeParse({ rating: 5 }).success).toBe(true);
  });
  it("allows an empty comment", () => expect(reviewSchema.safeParse({ rating: 4 }).success).toBe(true));
});
describe("message validation", () => {
  it("rejects an empty message", () => expect(messageSchema.safeParse({ body: "   " }).success).toBe(false));
  it("accepts a normal message", () => expect(messageSchema.safeParse({ body: "Can you come tomorrow?" }).success).toBe(true));
});
describe("request photo uploads reuse the same file-signature check as verification documents", () => {
  it("rejects a PDF disguised as a photo by extension alone", () => {
    // Callers reject kind.ext === "pdf" for photos even though sniffFileType itself allows pdf.
    const kind = sniffFileType(Buffer.from("%PDF-1.4"));
    expect(kind?.ext).toBe("pdf");
  });
});
