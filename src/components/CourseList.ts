export type CourseEntry = {
  name: string;
  city: string;
  slug: string;
  lat?: number;
  lng?: number;
};

export const COURSES: { province: string; courses: CourseEntry[] }[] = [
  {
    province: "NB — Greater Moncton / Southeast",
    courses: [
      { name: "CDT Disc Golf Course",         city: "Riverview",        slug: "cdt-disc-golf-course-aywp",              lat: 46.061, lng: -64.819 },
      { name: "Dieppe DGC",                   city: "Dieppe",           slug: "dieppe-dgc-BDhY",                        lat: 46.099, lng: -64.720 },
      { name: "RHS Tricky Trail",             city: "Riverview",        slug: "rhs-tricky-trail-DNKZ",                  lat: 46.061, lng: -64.819 },
      { name: "Disque Golf Memramcook",       city: "Memramcook",       slug: "disque-golf-memramcook-qLFD",            lat: 45.987, lng: -64.684 },
      { name: "École Mathieu-Martin",         city: "Dieppe",           slug: "ecole-mathieu-martin-8tur",              lat: 46.099, lng: -64.720 },
      { name: "Hillsborough Disc Golf",       city: "Hillsborough",     slug: "hillsborough-disc-golf-course-ojJ2",     lat: 45.925, lng: -64.656 },
      { name: "Beech Hill Park",             city: "Sackville",        slug: "beech-hill-park-disc-golf-course-wuGf",  lat: 45.900, lng: -64.370 },
      { name: "Cap-Acadie Disc Golf",         city: "Beaubassin East",  slug: "cap-acadie-disc-golf-EIpY",              lat: 46.030, lng: -64.480 },
      { name: "Maple Park Future Forest",     city: "Petitcodiac",      slug: "maple-park-future-forest-course-n3eW",   lat: 45.940, lng: -65.170 },
      { name: "Notre Centre",                 city: "Grande-Digue",     slug: "notre-centre-aX4R",                      lat: 46.175, lng: -64.618 },
      { name: "Port Elgin Regional School",   city: "Port Elgin",       slug: "port-elgin-regional-school-dgc-rq91",    lat: 46.055, lng: -64.077 },
      { name: "Cambridge-Narrows DGC",        city: "Cambridge-Narrows",slug: "cambridge-narrows-dgc-FsLW",             lat: 45.905, lng: -65.945 },
    ],
  },
  {
    province: "NS — Halifax / Valley",
    courses: [
      { name: "Hammonds Plains Disc Golf",    city: "Hammonds Plains",  slug: "hammonds-plains-disc-golf-JNwi",         lat: 44.716, lng: -63.814 },
      { name: "Dartmouth Commons DGC",        city: "Dartmouth",        slug: "dartmouth-commons-disc-golf-course-OrIl",lat: 44.671, lng: -63.576 },
      { name: "Bennett Park DGC",            city: "Mineville",        slug: "bennett-park-disc-golf-course-2oY4",     lat: 44.665, lng: -63.475 },
      { name: "Prospect Road CC",            city: "Hatchet Lake",     slug: "prospect-road-community-centre-30FR",    lat: 44.598, lng: -63.774 },
      { name: "Blandford Community Centre",  city: "Hubbards",         slug: "blandford-community-centre-hgqF",        lat: 44.557, lng: -64.090 },
      { name: "The Links - New Minas",       city: "New Minas",        slug: "the-links-new-minas-nova-scotia-aqx0",   lat: 45.062, lng: -64.405 },
      { name: "Ravenwood DiscGolfPark",      city: "Kingston",         slug: "ravenwood-disc-golf-park-course-kingston-u6Uj", lat: 44.972, lng: -64.958 },
      { name: "HMCC Disc Golf",              city: "Hantsport",        slug: "hmcc-disc-golf-course-K7N8",             lat: 45.065, lng: -64.176 },
      { name: "Old Orchard Inn",             city: "Wolfville Ridge",  slug: "old-orchard-inn-9qw8",                   lat: 45.096, lng: -64.372 },
      { name: "Clifton Estate Disc Golf",    city: "Windsor",          slug: "clifton-estate-disc-golf-windsor-ns-FV7E", lat: 44.985, lng: -64.136 },
      { name: "Ontree Disc Golf Park",       city: "Windsor",          slug: "ontree-disc-golf-park-MbM8",             lat: 44.985, lng: -64.136 },
      { name: "Waterville DGC",             city: "Waterville",       slug: "waterville-disc-golf-course-5VkN",        lat: 45.035, lng: -64.668 },
      { name: "MARC Lunenburg",             city: "Dayspring",        slug: "marc-lunenburg-5B7M",                     lat: 44.385, lng: -64.310 },
      { name: "Deerfield Disc Golf",        city: "South Ohio",       slug: "deerfield-disc-golf-nrdB",               lat: 44.175, lng: -65.370 },
      { name: "Forest Heights",             city: "Chester Basin",    slug: "forest-heights-chester-0m4k",            lat: 44.541, lng: -64.248 },
    ],
  },
  {
    province: "NS — Northern / Cape Breton",
    courses: [
      { name: "Bible Hill",                  city: "Truro",            slug: "bible-hill-d1sS",                         lat: 45.378, lng: -63.277 },
      { name: "Keppoch Mountain",            city: "Antigonish",       slug: "keppoch-mountain-2246",                   lat: 45.624, lng: -61.998 },
      { name: "Tiny Changes Disc Golf",      city: "Westchester Stn",  slug: "tiny-changes-disc-golf-FRHk",             lat: 45.617, lng: -63.464 },
      { name: "Wallace River Winter",        city: "Wallace",          slug: "wallace-river-winter-course-5cLe",        lat: 45.851, lng: -63.567 },
      { name: "NRHS Disc Golf",             city: "Westville",        slug: "nrhs-disc-golf-course-LE82",              lat: 45.590, lng: -62.706 },
      { name: "SCA Wolves DGC",            city: "Brookfield",       slug: "sca-wolves-disc-golf-course-wd08",        lat: 45.313, lng: -63.045 },
      { name: "Sunset DGC",               city: "Pugwash",          slug: "sunset-dgc-jIDl",                         lat: 45.847, lng: -63.662 },
      { name: "2 Rivers Disc Golf",        city: "Huntington",       slug: "2-rivers-disc-golf-Y9lY",                 lat: 45.235, lng: -64.942 },
      { name: "Ski Wentworth Blue",        city: "Wentworth",        slug: "ski-wentworth-blue-course-SzTy",          lat: 45.616, lng: -63.561 },
      { name: "Ski Wentworth Red",         city: "Wentworth",        slug: "ski-wentworth-red-course-4E97",           lat: 45.616, lng: -63.561 },
      { name: "Rotary Park DGC",          city: "Sydney",           slug: "rotary-park-dgc-LuAW",                    lat: 46.136, lng: -60.194 },
      { name: "Colliery Lands DGC",       city: "New Waterford",    slug: "colliery-lands-disc-golf-Ifa4",           lat: 46.247, lng: -60.073 },
      { name: "Cape Breton University",   city: "Sydney",           slug: "cape-breton-university-disc-golf-park-X2lL", lat: 46.136, lng: -60.194 },
    ],
  },
  {
    province: "PEI",
    courses: [
      { name: "Raider Disc Golf",             city: "Charlottetown",  slug: "raider-disc-golf-4yI5",                   lat: 46.238, lng: -63.128 },
      { name: "Mulberry Park",               city: "Charlottetown",  slug: "mulberry-park-back-corner-9IXy",          lat: 46.238, lng: -63.128 },
      { name: "Stratford Town Hall",         city: "Stratford",      slug: "stratford-town-hall-mmp0",                lat: 46.229, lng: -63.076 },
      { name: "Pondside Park",              city: "Stratford",      slug: "pondside-park-Wicg",                      lat: 46.229, lng: -63.076 },
      { name: "The Fox Hole",               city: "Cornwall",       slug: "the-fox-hole-F0x5",                       lat: 46.227, lng: -63.213 },
      { name: "The Three Rivers DGC",       city: "Georgetown",     slug: "the-three-rivers-dgc-0Gvy",               lat: 46.183, lng: -62.536 },
      { name: "Mill River DGC",            city: "Bloomfield",     slug: "mill-river-disc-golf-course-Fhbi",        lat: 46.875, lng: -64.044 },
      { name: "Englewood Disc Golf",        city: "Crapaud",        slug: "englewood-disc-golf-7fHZ",                lat: 46.219, lng: -63.590 },
      { name: "Panther Plains",             city: "Freetown",       slug: "panther-plains-48eG",                     lat: 46.280, lng: -63.510 },
      { name: "Darnley Disc Golf",          city: "Kensington",     slug: "darnley-disc-golf-hp4U",                  lat: 46.440, lng: -63.720 },
      { name: "Alberton DGC",              city: "Alberton",       slug: "alberton-huvA",                           lat: 46.817, lng: -64.063 },
      { name: "Lennox Island DGC",         city: "Lennox Island",  slug: "lennox-island-disc-golf-course-7atP",     lat: 46.620, lng: -63.890 },
      { name: "Huck-It Disc Golf",          city: "Kinkora",        slug: "huck-it-disc-golf-j0d5",                  lat: 46.277, lng: -63.699 },
      { name: "Belfast Disc Golf",          city: "Belfast",        slug: "belfast-disc-golf-IPHc",                  lat: 46.045, lng: -62.840 },
      { name: "Glenaladale DGC",           city: "Mount Stewart",  slug: "glenaladale-disc-golf-course-gl5b",       lat: 46.367, lng: -62.854 },
      { name: "Kings Pine DiscGolfPark",   city: "Mount Stewart",  slug: "kings-pine-disc-golf-park-96bO",          lat: 46.367, lng: -62.854 },
      { name: "Forest Hills DGC",         city: "New Glasgow",    slug: "forest-hills-disc-golf-course-CoFT",      lat: 46.411, lng: -63.413 },
      { name: "Rose Valley Disc Golf",    city: "Breadalbane",    slug: "rose-valley-disc-golf-dgBb",              lat: 46.302, lng: -63.473 },
      { name: "Hillcrest Farm DGC",       city: "Bonshaw",        slug: "hillcrest-farm-disc-golf-uWDj",           lat: 46.187, lng: -63.365 },
    ],
  },
];
