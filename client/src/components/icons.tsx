// Inline stroke icons — no icon dependency. Inherit currentColor.
import type { SVGProps } from "react";
type P = SVGProps<SVGSVGElement>;

function Base({ children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      width={16}
      height={16}
      aria-hidden="true"
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconGrid = (p: P) => (
  <Base {...p}>
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
  </Base>
);
export const IconList = (p: P) => (
  <Base {...p}>
    <line x1="8" y1="6" x2="20" y2="6" />
    <line x1="8" y1="12" x2="20" y2="12" />
    <line x1="8" y1="18" x2="20" y2="18" />
    <line x1="3.5" y1="6" x2="3.5" y2="6" />
    <line x1="3.5" y1="12" x2="3.5" y2="12" />
    <line x1="3.5" y1="18" x2="3.5" y2="18" />
  </Base>
);
export const IconReceipt = (p: P) => (
  <Base {...p}>
    <path d="M5 3h14v18l-2.5-1.5L14 21l-2-1.5L10 21l-2.5-1.5L5 21V3z" />
    <line x1="8.5" y1="8" x2="15.5" y2="8" />
    <line x1="8.5" y1="12" x2="15.5" y2="12" />
  </Base>
);
export const IconSearch = (p: P) => (
  <Base {...p}>
    <circle cx="11" cy="11" r="7" />
    <line x1="21" y1="21" x2="16.5" y2="16.5" />
  </Base>
);
export const IconClose = (p: P) => (
  <Base {...p}>
    <line x1="6" y1="6" x2="18" y2="18" />
    <line x1="18" y1="6" x2="6" y2="18" />
  </Base>
);
export const IconChevronLeft = (p: P) => (
  <Base {...p}>
    <polyline points="14 6 8 12 14 18" />
  </Base>
);
export const IconChevronRight = (p: P) => (
  <Base {...p}>
    <polyline points="10 6 16 12 10 18" />
  </Base>
);
export const IconImage = (p: P) => (
  <Base {...p}>
    <rect x="3" y="4" width="18" height="16" rx="1.5" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M21 16l-5-5L5 20" />
  </Base>
);
export const IconCheck = (p: P) => (
  <Base {...p}>
    <polyline points="4 12 10 18 20 6" />
  </Base>
);
export const IconAlert = (p: P) => (
  <Base {...p}>
    <path d="M12 4l9 16H3l9-16z" />
    <line x1="12" y1="10" x2="12" y2="14" />
    <line x1="12" y1="17.5" x2="12" y2="17.6" />
  </Base>
);
export const IconShield = (p: P) => (
  <Base {...p}>
    <path d="M12 3l7 3v5c0 4.4-3 8.2-7 9-4-.8-7-4.6-7-9V6l7-3z" />
    <polyline points="9 12 11 14 15 9.5" />
  </Base>
);
export const IconSettings = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1M18.4 18.4l-2.1-2.1M7.7 7.7L5.6 5.6" />
  </Base>
);
export const IconDownload = (p: P) => (
  <Base {...p}>
    <path d="M12 3v12" />
    <polyline points="7 11 12 16 17 11" />
    <path d="M5 20h14" />
  </Base>
);
export const IconInfo = (p: P) => (
  <Base {...p}>
    <circle cx="12" cy="12" r="9" />
    <line x1="12" y1="11" x2="12" y2="16" />
    <line x1="12" y1="8" x2="12" y2="8.1" />
  </Base>
);
