import { describe, expect, it } from "vitest";
import { getNextStatus } from "@/lib/status-pipeline";

describe("getNextStatus", () => {
  it("advances through the hiring pipeline in order", () => {
    expect(getNextStatus("New")).toBe("Reviewing");
    expect(getNextStatus("Reviewing")).toBe("Shortlisted");
    expect(getNextStatus("Shortlisted")).toBe("Interview");
    expect(getNextStatus("Interview")).toBe("Hired");
  });

  it("returns null once a candidate is Hired (no further stage)", () => {
    expect(getNextStatus("Hired")).toBeNull();
  });

  it("returns null for Rejected, a separate terminal state outside the forward pipeline", () => {
    expect(getNextStatus("Rejected")).toBeNull();
  });
});
