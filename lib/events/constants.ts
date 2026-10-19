/** Checklist shown on the public request form. Stored on events.needs. */
export const EVENT_NEEDS = [
  "Large Audio Speaker System",
  "Microphone for Announcements",
  "Wireless Microphones",
  "Live VUTC DJ",
  "Client Provided DJ",
  "Background Music",
  "A Cappella Performance",
  "Live Musician (Singer/Songwriter)",
  "Live Band",
  "Preset Playlist",
  "Custom Stage Lighting (White)",
  "Custom Stage Lighting (Colors)",
  "Uplighting",
  "Dance/Party Lighting",
  "Karaoke",
  "Pipe & Drape",
  "Projector Setup",
  "Video Playback",
  "Livestream",
  "Charity Event",
] as const;

export type EventNeed = (typeof EVENT_NEEDS)[number];

/** Suggested venues for the location autocomplete. Free text is allowed. */
export const LOCATION_SUGGESTIONS = [
  "Villanova Room",
  "Jake Nevin",
  "Belle Aire Terrace",
  "Pavilion",
  "St. Mary Auditorium",
  "St. Mary Gym",
  "St. Mary Chapel",
  "Driscoll 124",
  "CEER 001",
  "PIT",
  "Dougherty West Lounge",
  "Dougherty East Lounge",
  "Connelly Cinema",
  "Cafe Nova",
  "Sheehan Beach",
  "Oreo - Cafe Nova Stage",
  "Oreo - Main Steps",
  "Kennedy Ellipse",
  "Campus Green - Coor Steps",
  "Mendel Field",
  "Bartley Steps",
  "Quad",
  "SPIT",
  "Butler Annex",
  "Tolentine Field",
  "Cyber Lounge",
  "Connelly - Holy Grounds/Freshens",
] as const;

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_ATTACHMENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    "docx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation":
    "pptx",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "image/png": "png",
  "image/jpeg": "jpg",
  "text/plain": "txt",
};
