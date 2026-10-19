import type { PackageCategory, PayRouting } from "@/db/schema";

export type PackageSeed = {
  legacyId: number;
  name: string;
  category: PackageCategory;
  unitPrice: string;
  description: string;
  payRouting: PayRouting;
};

/**
 * Price list migrated from the legacy `pricing` table. `payRouting` is
 * assigned by hand here; the legacy site inferred it from name substrings.
 * "Wireless Lighting" was routed as wireless mics by that rule; it is
 * standard here.
 */
export const packageSeeds: PackageSeed[] = [
  { legacyId: 1, name: "Monitor", category: "audio", unitPrice: "50.00", payRouting: "standard", description: "Individual speaker for audio monitor located on stage" },
  { legacyId: 2, name: "Basic PA", category: "audio", unitPrice: "175.00", payRouting: "standard", description: "2 speakers, a mixer, and a microphone" },
  { legacyId: 3, name: "Extended PA", category: "audio", unitPrice: "250.00", payRouting: "standard", description: "4 speakers, a mixer, and a microphone" },
  { legacyId: 4, name: "Half-Stack PA", category: "audio", unitPrice: "325.00", payRouting: "standard", description: "6 speakers, a mixer, and a microphone" },
  { legacyId: 5, name: "Full-Stack PA", category: "audio", unitPrice: "400.00", payRouting: "standard", description: "8 speakers, a mixer, and a microphone" },
  { legacyId: 6, name: "Wireless Mics", category: "audio", unitPrice: "15.00", payRouting: "wireless", description: "Cost per wireless microphone" },
  { legacyId: 9, name: "Uplighting", category: "lighting", unitPrice: "100.00", payRouting: "standard", description: "12 lighting fixtures that are wireless and utilized as accent lighting" },
  { legacyId: 11, name: "Spotlight", category: "lighting", unitPrice: "150.00", payRouting: "standard", description: "1 manned spotlight" },
  { legacyId: 13, name: "Movers", category: "lighting", unitPrice: "100.00", payRouting: "standard", description: "1 lighting fixture that is able to pan and tilt" },
  { legacyId: 14, name: "Light Op - Production", category: "op_time", unitPrice: "45.00", payRouting: "op_light", description: "Hourly cost for a lighting operator to manage large scale custom lighting designs and setups" },
  { legacyId: 15, name: "Audio Op - Basic", category: "op_time", unitPrice: "20.00", payRouting: "op_audio", description: "Hourly cost for an audio operator to play and control pre-recorded audio" },
  { legacyId: 16, name: "Audio Op - Advanced", category: "op_time", unitPrice: "30.00", payRouting: "op_audio", description: "Hourly cost for an audio operator to mix small live performances" },
  { legacyId: 17, name: "Audio Op - Production", category: "op_time", unitPrice: "45.00", payRouting: "op_audio", description: "Hourly cost for an audio operator to mix large live performances" },
  { legacyId: 18, name: "DJ", category: "op_time", unitPrice: "30.00", payRouting: "op_dj", description: "Hourly cost for a DJ to mix soundtracks and perform for lives audiences" },
  { legacyId: 20, name: "Light Op - Advanced", category: "op_time", unitPrice: "30.00", payRouting: "op_light", description: "Hourly cost for a lighting operator to manage advanced lighting setups that require specific dynamic effects" },
  { legacyId: 21, name: "Spot Op", category: "op_time", unitPrice: "25.00", payRouting: "op_spot", description: "Hourly cost for a dedicated spotlight operator" },
  { legacyId: 22, name: "Multitracks", category: "audio", unitPrice: "20.00", payRouting: "standard", description: "Recording an event and providing individual track recordings" },
  { legacyId: 23, name: "Event Recording", category: "audio", unitPrice: "10.00", payRouting: "standard", description: "Recording an event and providing the audio recording" },
  { legacyId: 25, name: "Pipe and Drape", category: "other", unitPrice: "300.00", payRouting: "standard", description: "Black drape 10-16 feet tall, 40 feet wide. Half package 10-16 feet tall, 20 feet wide." },
  { legacyId: 26, name: "Rental Pickup/Drop-off", category: "other", unitPrice: "50.00", payRouting: "rental", description: "Pickup/drop-off for rental equipment based on assessing trips and personnel needed" },
  { legacyId: 28, name: "Projectors", category: "video", unitPrice: "250.00", payRouting: "standard", description: "Video projection system to be cast on a projector screen or wall" },
  { legacyId: 31, name: "Karaoke", category: "other", unitPrice: "25.00", payRouting: "standard", description: "Karaoke setup, to be paired with other audio/video packages" },
  { legacyId: 32, name: "Audio Op - Mixed", category: "op_time", unitPrice: "25.00", payRouting: "op_audio", description: "Hourly cost for an audio operator to manage multiple audio tracks" },
  { legacyId: 33, name: "Labor", category: "other", unitPrice: "40.00", payRouting: "standard", description: "Cost for labor billed per man-hour" },
  { legacyId: 35, name: "Reduced PA", category: "audio", unitPrice: "100.00", payRouting: "standard", description: "A mixer and a microphone for use with in-house speakers or audio transmitters" },
  { legacyId: 36, name: "Cancellation Fee", category: "other", unitPrice: "1.00", payRouting: "standard", description: "10% - 25% of event quote, or any work already completed before cancellation  (VUTC Policies for Clients)" },
  { legacyId: 37, name: "Video Op - Basic", category: "op_time", unitPrice: "20.00", payRouting: "op_video", description: "Hourly cost for a video operator to manage simple video setups" },
  { legacyId: 38, name: "Off Campus Charge (Rental)", category: "other", unitPrice: "40.00", payRouting: "rental", description: "Cost of transporting staff and equipment off campus, based on number of vehicles needed" },
  { legacyId: 42, name: "Late Night", category: "other", unitPrice: "50.00", payRouting: "standard", description: "Additional fee to accommodate for labor that takes place beyond reasonable hours for VUTC student workers, dependent on the scale of the event (VUTC Policies for Clients)" },
  { legacyId: 44, name: "Misc. Audio Equipment", category: "audio", unitPrice: "50.00", payRouting: "standard", description: "Misc. audio equipment" },
  { legacyId: 47, name: "Projector Screen", category: "video", unitPrice: "300.00", payRouting: "standard", description: "14ft x 8ft projection screen" },
  { legacyId: 53, name: "Miscellaneous", category: "other", unitPrice: "1.00", payRouting: "standard", description: "Any additional misc. expenses not covered in an existing package (parking, etc.)" },
  { legacyId: 54, name: "Misc. Lighting Equipment", category: "lighting", unitPrice: "50.00", payRouting: "standard", description: "Misc. lighting equipment" },
  { legacyId: 55, name: "Rush Fee - $50", category: "other", unitPrice: "50.00", payRouting: "standard", description: "The greater of $50 or 10% of the event quote, added for immediate event requests submitted 10 days or less prior to event date or rain plan calls once equipment has been set up (VUTC Policies for Clients)" },
  { legacyId: 56, name: "Production Video Services", category: "video", unitPrice: "75.00", payRouting: "standard", description: "Video hardware for integrating streamed video and/or TV programming" },
  { legacyId: 57, name: "Light Op - Basic", category: "op_time", unitPrice: "25.00", payRouting: "op_light", description: "Hourly cost for a lighting operator to manage simple lighting setups" },
  { legacyId: 58, name: "Video Op - Advanced", category: "op_time", unitPrice: "25.00", payRouting: "op_video", description: "Hourly cost for a video operator to manage multiple video sources and basic livestreams" },
  { legacyId: 59, name: "Event Coordination Services", category: "other", unitPrice: "25.00", payRouting: "standard", description: "Charge for pre-event production services towards coordinating large-scale rentals, attending production meetings, and/or other duties associated with event management, billed per man-hour" },
  { legacyId: 61, name: "Event Production Services", category: "other", unitPrice: "25.00", payRouting: "standard", description: "Charge for pre-event production planning done by head technicians such as production plot and complex show file generation, walkthroughs to discuss high-level event setup, and/or other duties associated with large event production, billed per man-hour" },
  { legacyId: 62, name: "Extended Mic Kit", category: "audio", unitPrice: "50.00", payRouting: "standard", description: "Includes up to 5 wired microphones" },
  { legacyId: 64, name: "Camera Op", category: "op_time", unitPrice: "25.00", payRouting: "op_camera", description: "Hourly cost for a dedicated camera operator" },
  { legacyId: 65, name: "Rush Fee - Percentage", category: "other", unitPrice: "1.00", payRouting: "standard", description: "The greater of $50 or 10% of the event quote, added for immediate event requests submitted 10 days or less prior to event date or rain plan calls once equipment has been set up (VUTC Policies for Clients)" },
  { legacyId: 67, name: "Mastering", category: "audio", unitPrice: "40.00", payRouting: "standard", description: "Request for mastered audio of a recorded song" },
  { legacyId: 68, name: "Flown Speakers", category: "audio", unitPrice: "600.00", payRouting: "standard", description: "Hardware and rigging equipment to be able to fly a PA setup in the air (does not include PA)" },
  { legacyId: 69, name: "Overhead Truss", category: "lighting", unitPrice: "250.00", payRouting: "standard", description: "1 overhead horizonal span of truss to hang fixtures from" },
  { legacyId: 70, name: "Video Op - Production", category: "op_time", unitPrice: "35.00", payRouting: "op_video", description: "Hourly cost for a video operator to manage camera directing, complex video routing, and other video production work" },
  { legacyId: 71, name: "Wired Lighting", category: "lighting", unitPrice: "250.00", payRouting: "standard", description: "1 set of lighting fixtures that must have power and control cabling" },
  { legacyId: 72, name: "2 Vertical Towers", category: "lighting", unitPrice: "200.00", payRouting: "standard", description: "2 vertical towers to hang fixtures from and/or support an overhead truss" },
  { legacyId: 73, name: "Wireless Lighting", category: "lighting", unitPrice: "150.00", payRouting: "standard", description: "12 lighting fixtures that are wireless but require to be hung from truss and angled properly" },
  { legacyId: 74, name: "Power Distribution", category: "other", unitPrice: "50.00", payRouting: "power", description: "Distribution equipment to provide power to various equipment" },
  { legacyId: 75, name: "Runner Op", category: "op_time", unitPrice: "25.00", payRouting: "op_runner", description: "Hourly cost for a runner or stagehand to assist the head technicians of an event" },
  { legacyId: 76, name: "Livestreaming", category: "video", unitPrice: "250.00", payRouting: "standard", description: "Livestream arrangements, streaming hardware, and a camera" },
  { legacyId: 77, name: "Network Services", category: "other", unitPrice: "50.00", payRouting: "standard", description: "Control network setup for operators to manage and control complex equipment setups" },
  { legacyId: 78, name: "Misc. Video Equipment", category: "video", unitPrice: "40.00", payRouting: "standard", description: "Misc. video equipment" },
  { legacyId: 79, name: "TV Screen", category: "video", unitPrice: "250.00", payRouting: "standard", description: "1 70in TV screen set on a 6ft truss stand" },
  { legacyId: 80, name: "Balloon Lights", category: "lighting", unitPrice: "150.00", payRouting: "standard", description: "2 6.5ft tall lighting fixtures that provide functional lighting for an outdoor space." },
  { legacyId: 81, name: "Inflatable Screen", category: "video", unitPrice: "125.00", payRouting: "standard", description: "14ft x 10ft Inflatable projector screen" },
  { legacyId: 82, name: "Gobo", category: "lighting", unitPrice: "75.00", payRouting: "standard", description: "One Gobo projection" },
];
