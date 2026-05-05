/**
 * ID validation and normalization utilities
 * Prevents future mixing of text slugs and UUIDs in player references
 */

// Strict UUID regex matching RFC 4122 format
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Player slug format: lowercase letters, numbers, hyphens (e.g. "jeffrey-rijkse")
const SLUG_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

/** Check if a string is a valid UUID */
export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

/** Check if a string is a valid player slug */
export function isValidSlug(value: string): boolean {
  return SLUG_REGEX.test(value) && value.length <= 64;
}

/** Determine the ID format type */
export function getIdType(value: string): "uuid" | "slug" | "invalid" {
  if (isValidUUID(value)) return "uuid";
  if (isValidSlug(value)) return "slug";
  return "invalid";
}

/**
 * Validate round result player IDs
 * All IDs in a round should be the same format (all UUID or all slug)
 * After migration, all should be UUID
 */
export function validateRoundResultIds(
  playerIds: string[],
  context?: string
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const types = new Set<"uuid" | "slug" | "invalid">();

  for (const id of playerIds) {
    const type = getIdType(id);
    types.add(type);

    if (type === "invalid") {
      errors.push(`Invalid player ID format: ${id}${context ? ` in ${context}` : ""}`);
    }
  }

  // Check for mixed formats (should not happen after migration)
  if (types.has("uuid") && types.has("slug")) {
    errors.push(`Mixed UUID and slug formats detected${context ? ` in ${context}` : ""}. All must be migrated to UUID.`);
  }

  // Check for any invalid types
  if (types.has("invalid")) {
    errors.push(`Contains invalid ID format${context ? ` in ${context}` : ""}.`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate season_history player references
 * champion_player_id and initial_badge_holder_player_id should be UUID (or null)
 */
export function validateSeasonHistoryIds(
  championId: string | null | undefined,
  badgeHolderId: string | null | undefined,
  season: number
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (championId && !isValidUUID(championId)) {
    errors.push(
      `Season ${season}: champion_player_id "${championId}" is not a valid UUID. ` +
        "All player IDs must be migrated to UUID format."
    );
  }

  if (badgeHolderId && !isValidUUID(badgeHolderId)) {
    errors.push(
      `Season ${season}: initial_badge_holder_player_id "${badgeHolderId}" is not a valid UUID. ` +
        "All player IDs must be migrated to UUID format."
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validate that auth.users.id references are valid UUIDs
 * Used by bag_discs and disc_throws which reference auth.users(id)
 */
export function validateAuthUserId(userId: string, context?: string): { valid: boolean; error?: string } {
  if (!isValidUUID(userId)) {
    return {
      valid: false,
      error: `Invalid auth.users.id reference: ${userId}${context ? ` in ${context}` : ""}`,
    };
  }
  return { valid: true };
}

/**
 * Report on ID format distribution in a dataset
 * Useful for debugging mixed format issues
 */
export function analyzeIdFormats(
  playerIds: string[]
): {
  total: number;
  uuids: string[];
  slugs: string[];
  invalid: string[];
} {
  const uuids: string[] = [];
  const slugs: string[] = [];
  const invalid: string[] = [];

  for (const id of playerIds) {
    const type = getIdType(id);
    if (type === "uuid") uuids.push(id);
    else if (type === "slug") slugs.push(id);
    else invalid.push(id);
  }

  return {
    total: playerIds.length,
    uuids,
    slugs,
    invalid,
  };
}
