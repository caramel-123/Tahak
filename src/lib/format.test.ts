import { describe, it, expect } from "vitest";
import { formatPeso, formatWallet } from "./format";

describe("formatPeso", () => {
  it("adds the peso sign and thousands separators", () => {
    expect(formatPeso(2800)).toBe("₱2,800");
  });

  it("handles amounts under a thousand", () => {
    expect(formatPeso(500)).toBe("₱500");
  });

  it("handles zero", () => {
    expect(formatPeso(0)).toBe("₱0");
  });
});

describe("formatWallet", () => {
  it("truncates a Stellar public key to first 4 and last 4 characters", () => {
    expect(formatWallet("GCTNPPIKSSFQTMSLOBISTJ7MOQRKI3RZ55IOC6FFP6JXYSQ7OKBCYOOM")).toBe("GCTN…YOOM");
  });

  it("leaves short strings untouched", () => {
    expect(formatWallet("GCTN")).toBe("GCTN");
  });
});
