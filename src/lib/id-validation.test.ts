import { describe, it, expect } from "vitest";
import {
  isValidUUID,
  isValidSlug,
  getIdType,
  validateRoundResultIds,
  validateSeasonHistoryIds,
  validateAuthUserId,
  analyzeIdFormats,
  asPlayerId,
  asAuthUserId,
} from "./id-validation";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
const VALID_UUID_UPPERCASE = "550E8400-E29B-41D4-A716-446655440000";
const VALID_SLUG = "jeffrey-rijkse";
const ANOTHER_UUID = "6ba7b810-9dad-11d1-80b4-00c04fd430c8";

describe("isValidUUID", () => {
  it("accepts valid UUID", () => {
    expect(isValidUUID(VALID_UUID)).toBe(true);
  });

  it("accepts uppercase UUID", () => {
    expect(isValidUUID(VALID_UUID_UPPERCASE)).toBe(true);
  });

  it("rejects slug", () => {
    expect(isValidUUID(VALID_SLUG)).toBe(false);
  });

  it("rejects truncated UUID", () => {
    expect(isValidUUID("550e8400-e29b-41d4-a716-44665544000")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidUUID("")).toBe(false);
  });

  it("rejects UUID with wrong separators", () => {
    expect(isValidUUID("550e8400e29b41d4a716446655440000")).toBe(false);
  });
});

describe("isValidSlug", () => {
  it("accepts valid slug", () => {
    expect(isValidSlug(VALID_SLUG)).toBe(true);
  });

  it("accepts single character", () => {
    expect(isValidSlug("a")).toBe(true);
  });

  it("accepts slug with digits", () => {
    expect(isValidSlug("player-123")).toBe(true);
  });

  it("rejects empty string", () => {
    expect(isValidSlug("")).toBe(false);
  });

  it("rejects slug longer than 64 chars", () => {
    const tooLong = "a".repeat(65);
    expect(isValidSlug(tooLong)).toBe(false);
  });

  it("accepts slug exactly 64 chars", () => {
    const exactly64 = "a".repeat(64);
    expect(isValidSlug(exactly64)).toBe(true);
  });

  it("rejects uppercase", () => {
    expect(isValidSlug("Jeffrey-Rijkse")).toBe(false);
  });

  it("rejects leading hyphen", () => {
    expect(isValidSlug("-player")).toBe(false);
  });

  it("rejects trailing hyphen", () => {
    expect(isValidSlug("player-")).toBe(false);
  });

  it("rejects special characters", () => {
    expect(isValidSlug("player@name")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(isValidSlug("player name")).toBe(false);
  });
});

describe("getIdType", () => {
  it("identifies UUID", () => {
    expect(getIdType(VALID_UUID)).toBe("uuid");
  });

  it("identifies slug", () => {
    expect(getIdType(VALID_SLUG)).toBe("slug");
  });

  it("identifies invalid", () => {
    expect(getIdType("not-valid-uuid-or-slug!")).toBe("invalid");
  });

  it("handles empty string as invalid", () => {
    expect(getIdType("")).toBe("invalid");
  });
});

describe("validateRoundResultIds", () => {
  it("accepts all UUID", () => {
    const result = validateRoundResultIds([VALID_UUID, ANOTHER_UUID]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts all slug (legacy)", () => {
    const result = validateRoundResultIds(["player-1", "player-2"]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects mixed UUID and slug", () => {
    const result = validateRoundResultIds([VALID_UUID, "player-1"]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.some((e) => e.includes("Mixed UUID and slug"))).toBe(true);
  });

  it("rejects invalid format", () => {
    const result = validateRoundResultIds(["invalid!"]);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("handles empty array", () => {
    const result = validateRoundResultIds([]);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("includes context in error message", () => {
    const result = validateRoundResultIds(["invalid!"], "round 123");
    expect(result.errors.some((e) => e.includes("round 123"))).toBe(true);
  });
});

describe("validateSeasonHistoryIds", () => {
  it("accepts both UUID", () => {
    const result = validateSeasonHistoryIds(VALID_UUID, ANOTHER_UUID, 1);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts both null", () => {
    const result = validateSeasonHistoryIds(null, null, 1);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts both undefined", () => {
    const result = validateSeasonHistoryIds(undefined, undefined, 1);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects slug as champion", () => {
    const result = validateSeasonHistoryIds("player-1", null, 1);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("rejects slug as badge holder", () => {
    const result = validateSeasonHistoryIds(null, "player-1", 1);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it("reports both errors when both invalid", () => {
    const result = validateSeasonHistoryIds("invalid!", "also-invalid!", 1);
    expect(result.errors.length).toBe(2);
  });

  it("includes season number in error", () => {
    const result = validateSeasonHistoryIds("invalid", null, 5);
    expect(result.errors.some((e) => e.includes("Season 5"))).toBe(true);
  });
});

describe("validateAuthUserId", () => {
  it("accepts valid UUID", () => {
    const result = validateAuthUserId(VALID_UUID);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it("rejects slug", () => {
    const result = validateAuthUserId("player-1");
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it("includes context in error", () => {
    const result = validateAuthUserId("invalid", "bag_discs row 42");
    expect(result.error).toContain("bag_discs row 42");
  });
});

describe("analyzeIdFormats", () => {
  it("categorizes mixed array", () => {
    const analysis = analyzeIdFormats([
      VALID_UUID,
      "player-1",
      "invalid!",
      ANOTHER_UUID,
    ]);
    expect(analysis.total).toBe(4);
    expect(analysis.uuids).toHaveLength(2);
    expect(analysis.slugs).toHaveLength(1);
    expect(analysis.invalid).toHaveLength(1);
  });

  it("handles empty array", () => {
    const analysis = analyzeIdFormats([]);
    expect(analysis.total).toBe(0);
    expect(analysis.uuids).toHaveLength(0);
    expect(analysis.slugs).toHaveLength(0);
    expect(analysis.invalid).toHaveLength(0);
  });

  it("handles all UUID", () => {
    const analysis = analyzeIdFormats([VALID_UUID, ANOTHER_UUID]);
    expect(analysis.uuids).toHaveLength(2);
    expect(analysis.slugs).toHaveLength(0);
    expect(analysis.invalid).toHaveLength(0);
  });

  it("handles all slug", () => {
    const analysis = analyzeIdFormats(["player-1", "player-2"]);
    expect(analysis.slugs).toHaveLength(2);
    expect(analysis.uuids).toHaveLength(0);
    expect(analysis.invalid).toHaveLength(0);
  });
});

describe("asPlayerId", () => {
  it("returns PlayerId for valid UUID", () => {
    const id = asPlayerId(VALID_UUID);
    expect(id).toBe(VALID_UUID);
  });

  it("throws for slug", () => {
    expect(() => asPlayerId("player-1")).toThrow();
  });

  it("throws for invalid format", () => {
    expect(() => asPlayerId("invalid!")).toThrow();
  });

  it("includes context in error", () => {
    try {
      asPlayerId("invalid", "test context");
      expect.fail("Should have thrown");
    } catch (e) {
      expect((e as Error).message).toContain("test context");
    }
  });

  it("mentions PlayerId in error", () => {
    try {
      asPlayerId("not-a-uuid");
      expect.fail("Should have thrown");
    } catch (e) {
      expect((e as Error).message).toContain("PlayerId");
    }
  });
});

describe("asAuthUserId", () => {
  it("returns AuthUserId for valid UUID", () => {
    const id = asAuthUserId(VALID_UUID);
    expect(id).toBe(VALID_UUID);
  });

  it("throws for non-UUID", () => {
    expect(() => asAuthUserId("not-a-uuid")).toThrow();
  });

  it("includes context in error", () => {
    try {
      asAuthUserId("invalid", "auth context");
      expect.fail("Should have thrown");
    } catch (e) {
      expect((e as Error).message).toContain("auth context");
    }
  });

  it("mentions AuthUserId in error", () => {
    try {
      asAuthUserId("player-1");
      expect.fail("Should have thrown");
    } catch (e) {
      expect((e as Error).message).toContain("AuthUserId");
    }
  });
});
