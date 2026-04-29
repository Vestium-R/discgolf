/** What each AI feature considers — shown in the UI hover tooltip. */
export const AI_FACTORS = {
  bagAnalysis: [
    "All in-bag discs with flight numbers",
    "Disc weight (heavier = more OS, lighter = more US)",
    "Plastic type & stability offset",
    "Disc condition (beat-in, fresh, etc.)",
    "Stability distribution (OS/neutral/US)",
    "Play style & throw style",
    "Max distance / skill level",
    "Years playing",
  ],
  whatToThrow: [
    "All in-bag discs with flight numbers",
    "Disc weight (heavier = more OS, lighter = more US)",
    "Plastic type & stability offset",
    "Disc condition",
    "Hole distance",
    "Wind conditions (type + strength)",
    "Play style & throw style",
    "Max distance / skill level",
  ],
  coursePlanner: [
    "In-bag + storage discs",
    "Disc weight (heavier = more OS, lighter = more US)",
    "Plastic type & stability offset",
    "Disc condition",
    "UDisc hole distances (when available)",
    "Course name & conditions",
    "Play style & throw style",
    "Max distance / skill level",
    "Years playing",
  ],
} as const;
