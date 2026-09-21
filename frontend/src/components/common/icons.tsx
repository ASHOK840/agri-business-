import type { SVGProps } from 'react';

// One small, hand-drawn icon set (outline style: 1.75px stroke, round
// joins, 24x24 box) so every icon in the app — sidebar, KPI cards, alert
// summaries — comes from a single consistent visual language instead of
// mixing icon libraries or font-icon glyphs.
type IconProps = SVGProps<SVGSVGElement>;

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export const IconDashboard = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.5" />
    <rect x="13" y="3.5" width="7.5" height="4.5" rx="1.5" />
    <rect x="13" y="10.5" width="7.5" height="10" rx="1.5" />
    <rect x="3.5" y="13.5" width="7.5" height="7" rx="1.5" />
  </svg>
);

export const IconUsers = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="9" cy="8" r="3" />
    <path d="M3.5 19c.7-3 2.8-4.5 5.5-4.5s4.8 1.5 5.5 4.5" />
    <circle cx="17" cy="8.5" r="2.3" />
    <path d="M15.8 14.2c2.2.2 3.7 1.6 4.2 3.8" />
  </svg>
);

export const IconBag = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M7 8h10l1.2 11.2a1.5 1.5 0 0 1-1.5 1.8H7.3a1.5 1.5 0 0 1-1.5-1.8L7 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </svg>
);

export const IconTruck = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="2.5" y="7.5" width="11" height="8.5" rx="1" />
    <path d="M13.5 10h3.3L19.5 13v3h-6z" />
    <circle cx="7" cy="18" r="1.8" />
    <circle cx="16.5" cy="18" r="1.8" />
  </svg>
);

export const IconWallet = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="6" width="18" height="13" rx="2" />
    <path d="M3 10h18" />
    <circle cx="16.5" cy="14" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export const IconBoxes = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 3.5 20 7.5 12 11.5 4 7.5Z" />
    <path d="M4 7.5v9L12 20.5" />
    <path d="M20 7.5v9L12 20.5" />
    <path d="M12 11.5v9" />
  </svg>
);

export const IconLeaf = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 19c-1-6 1.5-13 14-14 1 11-5.5 14-14 14Z" />
    <path d="M6 18c3-3.5 6-6.5 12.5-12" />
  </svg>
);

export const IconTag = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M11.5 3.5H5a1.5 1.5 0 0 0-1.5 1.5v6.5L13 21l7-7-9.5-10.5Z" />
    <circle cx="8" cy="8" r="1.4" />
  </svg>
);

export const IconBuilding = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="4" y="3.5" width="12" height="17" rx="1" />
    <path d="M16 10h4v10.5H16" />
    <path d="M7.5 7.5h1.5M11.5 7.5H13M7.5 11h1.5M11.5 11H13M7.5 14.5h1.5M11.5 14.5H13" />
    <path d="M9 20.5v-3h2v3" />
  </svg>
);

export const IconTrendingUp = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3.5 16.5 9.5 10.5 13.5 14.5 20.5 6.5" />
    <path d="M15 6.5h5.5V12" />
  </svg>
);

export const IconCreditCard = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
    <path d="M2.5 10h19" />
    <path d="M6 14.5h4" />
  </svg>
);

export const IconReceipt = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 3.5h12v17l-2.2-1.5L13.6 21l-1.6-1.5L10.4 21l-2.2-1.5L6 20.5Z" />
    <path d="M8.5 8h7M8.5 11.5h7M8.5 15h4.5" />
  </svg>
);

export const IconClipboardList = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="5" y="4.5" width="14" height="16" rx="2" />
    <rect x="9" y="3" width="6" height="3" rx="1" />
    <path d="M8.5 11h7M8.5 14.5h7M8.5 18h4.5" />
  </svg>
);

export const IconSettings = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2.4M12 18.1v2.4M20.5 12h-2.4M5.9 12H3.5M17.7 6.3l-1.7 1.7M8 16l-1.7 1.7M17.7 17.7 16 16M8 8 6.3 6.3" />
  </svg>
);

export const IconFileBarChart = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 3.5h8l4 4v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-16a1 1 0 0 1 1-1Z" />
    <path d="M14 3.5V7.5h4" />
    <path d="M8.5 17v-3M12 17v-5M15.5 17v-2" />
  </svg>
);

export const IconHistory = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 9a8 8 0 1 1 1.3 6.4" />
    <path d="M4 4v5h5" />
    <path d="M12 8v4.5l3 1.8" />
  </svg>
);

export const IconUserCircle = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path d="M5.8 18.2c1-2.6 3.2-4 6.2-4s5.2 1.4 6.2 4" />
  </svg>
);

export const IconAlertTriangle = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 3.5 21.5 20h-19Z" />
    <path d="M12 9.5v4.2" />
    <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
  </svg>
);

export const IconXCircle = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </svg>
);

export const IconClock = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </svg>
);

export const IconChevronRight = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 5.5 15.5 12 9 18.5" />
  </svg>
);

export const IconArrowRight = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 12h15.5" />
    <path d="M13.5 6l6 6-6 6" />
  </svg>
);

export const IconPackage = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M3.5 8 12 3.5 20.5 8v8L12 20.5 3.5 16Z" />
    <path d="M3.5 8 12 12.5 20.5 8" />
    <path d="M12 12.5v8" />
  </svg>
);

export const IconLogOut = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 20H5.5a1.5 1.5 0 0 1-1.5-1.5v-13A1.5 1.5 0 0 1 5.5 4H9" />
    <path d="M15.5 16l4-4-4-4" />
    <path d="M19 12H9" />
  </svg>
);

export const IconCheckCircle = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 12.5l2.5 2.5L16 9.5" />
  </svg>
);
