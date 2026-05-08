// Inline SVG icons. No icon library dependency. Tree-shakable + zero-runtime.
import type { SVGProps } from "react";

const base = {
  width: 18, height: 18, viewBox: "0 0 24 24",
  fill: "none", stroke: "currentColor", strokeWidth: 1.6,
  strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
};

type P = SVGProps<SVGSVGElement>;

export const IconHome = (p: P) => (
  <svg {...base} {...p}><path d="M3 12l9-9 9 9"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>
);
export const IconBag = (p: P) => (
  <svg {...base} {...p}><path d="M6 7h12l-1 13a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>
);
export const IconUsers = (p: P) => (
  <svg {...base} {...p}><circle cx="9" cy="8" r="3.5"/><circle cx="17.5" cy="9" r="2.5"/><path d="M3 19c.7-2.5 3-4 6-4s5.3 1.5 6 4"/><path d="M15 19c.4-1.7 2-2.7 4-2.7s3.6 1 4 2.7"/></svg>
);
export const IconScissors = (p: P) => (
  <svg {...base} {...p}><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><line x1="20" y1="4" x2="8.5" y2="15.5"/><line x1="14" y1="14" x2="20" y2="20"/><line x1="8.5" y1="8.5" x2="20" y2="20"/></svg>
);
export const IconSparkles = (p: P) => (
  <svg {...base} {...p}><path d="M12 3l1.6 4.4 4.4 1.6-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/><path d="M19 15l.8 2.2 2.2.8-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z"/><path d="M5 14l.6 1.7 1.7.6-1.7.6L5 18.6 4.4 17l-1.7-.6 1.7-.6L5 14z"/></svg>
);
export const IconTag = (p: P) => (
  <svg {...base} {...p}><path d="M20.5 13.5l-7 7a2 2 0 0 1-2.8 0l-7.7-7.7V3h9.8l7.7 7.7a2 2 0 0 1 0 2.8z"/><circle cx="8" cy="8" r="1.4"/></svg>
);
export const IconBolt = (p: P) => (
  <svg {...base} {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/></svg>
);
export const IconImage = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="M21 15l-5-5L5 21"/></svg>
);
export const IconLayers = (p: P) => (
  <svg {...base} {...p}><polygon points="12 2 22 8 12 14 2 8 12 2"/><path d="M2 14l10 6 10-6"/><path d="M2 11l10 6 10-6"/></svg>
);
export const IconBell = (p: P) => (
  <svg {...base} {...p}><path d="M6 8a6 6 0 1 1 12 0v5l1.5 3h-15L6 13z"/><path d="M10 19a2 2 0 0 0 4 0"/></svg>
);
export const IconCalendar = (p: P) => (
  <svg {...base} {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><line x1="8" y1="3" x2="8" y2="7"/><line x1="16" y1="3" x2="16" y2="7"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
);
export const IconBox = (p: P) => (
  <svg {...base} {...p}><path d="M3 7.5l9-4.5 9 4.5v9L12 21 3 16.5z"/><line x1="3" y1="7.5" x2="12" y2="12"/><line x1="21" y1="7.5" x2="12" y2="12"/><line x1="12" y1="12" x2="12" y2="21"/></svg>
);
export const IconList = (p: P) => (
  <svg {...base} {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="0.8"/><circle cx="4" cy="12" r="0.8"/><circle cx="4" cy="18" r="0.8"/></svg>
);
export const IconFolder = (p: P) => (
  <svg {...base} {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 3h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/></svg>
);
export const IconCog = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>
);
export const IconLogout = (p: P) => (
  <svg {...base} {...p}><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/></svg>
);
export const IconPlus = (p: P) => (
  <svg {...base} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
);
export const IconSearch = (p: P) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.5" y2="16.5"/></svg>
);
export const IconArrowRight = (p: P) => (
  <svg {...base} {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 6 19 12 13 18"/></svg>
);
export const IconArrowLeft = (p: P) => (
  <svg {...base} {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="11 6 5 12 11 18"/></svg>
);
export const IconChevronDown = (p: P) => (
  <svg {...base} {...p}><polyline points="6 9 12 15 18 9"/></svg>
);
export const IconCheck = (p: P) => (
  <svg {...base} {...p}><polyline points="5 12 10 17 19 7"/></svg>
);
export const IconX = (p: P) => (
  <svg {...base} {...p}><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>
);
export const IconTrash = (p: P) => (
  <svg {...base} {...p}><polyline points="4 7 20 7"/><path d="M6 7l1 13a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-13"/><path d="M9 7V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v3"/></svg>
);
export const IconEdit = (p: P) => (
  <svg {...base} {...p}><path d="M14 4l6 6-11 11H3v-6L14 4z"/><line x1="14" y1="4" x2="20" y2="10"/></svg>
);
export const IconDuplicate = (p: P) => (
  <svg {...base} {...p}><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
);
export const IconDrag = (p: P) => (
  <svg {...base} {...p}><circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/></svg>
);
export const IconStar = (p: P) => (
  <svg {...base} {...p}><polygon points="12 2 14.7 8.6 22 9.3 16.5 14 18.2 21 12 17.3 5.8 21 7.5 14 2 9.3 9.3 8.6 12 2"/></svg>
);
export const IconStarFill = (p: P) => (
  <svg {...base} {...p} fill="currentColor"><polygon points="12 2 14.7 8.6 22 9.3 16.5 14 18.2 21 12 17.3 5.8 21 7.5 14 2 9.3 9.3 8.6 12 2"/></svg>
);
export const IconUpload = (p: P) => (
  <svg {...base} {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);
export const IconEye = (p: P) => (
  <svg {...base} {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>
);
export const IconEyeOff = (p: P) => (
  <svg {...base} {...p}><path d="M17.94 17.94A10 10 0 0 1 12 19c-6 0-10-7-10-7a18 18 0 0 1 4.4-5.4"/><path d="M22 12s-1.3-2.3-3.5-4.2"/><path d="M9.9 4.2A10 10 0 0 1 12 4c6 0 10 7 10 7"/><line x1="2" y1="2" x2="22" y2="22"/><path d="M14.1 14.1a3 3 0 0 1-4.2-4.2"/></svg>
);
export const IconCart = (p: P) => (
  <svg {...base} {...p}><path d="M2 3h2.5l3 14a2 2 0 0 0 2 1.5h9a2 2 0 0 0 2-1.5l1.5-8H6.5"/><circle cx="9" cy="21" r="1"/><circle cx="18" cy="21" r="1"/></svg>
);
export const IconUser = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/></svg>
);
export const IconClock = (p: P) => (
  <svg {...base} {...p}><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 16 14"/></svg>
);
