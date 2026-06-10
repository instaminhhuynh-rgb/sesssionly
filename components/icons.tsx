import * as React from "react";

type P = React.SVGProps<SVGSVGElement>;
const base = (props: P) => ({ fill: "none", stroke: "currentColor", strokeWidth: 1.7, viewBox: "0 0 24 24", ...props });

export const Icon = {
  today: (p: P) => (<svg {...base(p)}><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></svg>),
  clients: (p: P) => (<svg {...base(p)}><circle cx="9" cy="8" r="3.2" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 6.5a3 3 0 0 1 0 5.8M17 14.5a5 5 0 0 1 3.5 5.5" /></svg>),
  calendar: (p: P) => (<svg {...base(p)}><rect x="3" y="4.5" width="18" height="16" rx="2" /><path d="M3 9h18M8 2.5v4M16 2.5v4" /><circle cx="8.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" /><circle cx="15.5" cy="13.5" r="1.2" fill="currentColor" stroke="none" /></svg>),
  services: (p: P) => (<svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h10" /></svg>),
  payments: (p: P) => (<svg {...base(p)}><rect x="2.5" y="6" width="19" height="12" rx="2" /><path d="M2.5 10h19" /></svg>),
  more: (p: P) => (<svg {...base(p)}><circle cx="5" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.6" fill="currentColor" stroke="none" /></svg>),
  settings: (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M12 2.5v3M12 18.5v3M21.5 12h-3M5.5 12h-3M18 6l-2 2M8 16l-2 2M18 18l-2-2M8 8 6 6" /></svg>),
  invite: (p: P) => (<svg {...base(p)}><path d="M3 5.5h18v13H3z" /><path d="m3 6 9 7 9-7" /></svg>),
  plus: (p: P) => (<svg {...base(p)} strokeWidth={2}><path d="M12 5v14M5 12h14" /></svg>),
  spark: (p: P) => (<svg {...base(p)} strokeWidth={1.6}><path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" /></svg>),
  bell: (p: P) => (<svg {...base(p)}><path d="M6 9a6 6 0 1 1 12 0c0 5 2 6 2 6H4s2-1 2-6M9.5 19a2.5 2.5 0 0 0 5 0" /></svg>),
  chevron: (p: P) => (<svg {...base(p)} strokeWidth={2}><path d="m9 6 6 6-6 6" /></svg>),
  check: (p: P) => (<svg {...base(p)} strokeWidth={2.2}><path d="m5 12 5 5L20 6" /></svg>),
  clock: (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  x: (p: P) => (<svg {...base(p)} strokeWidth={2}><path d="M6 6l12 12M18 6 6 18" /></svg>),
  risk: (p: P) => (<svg {...base(p)}><path d="M12 3 2 20h20L12 3zM12 9v5M12 17h.01" /></svg>),
  pencil: (p: P) => (<svg {...base(p)}><path d="M3 21l4-1L20 7a2 2 0 0 0-3-3L4 17l-1 4z" /><path d="M14 6l3 3" /></svg>),
  refresh: (p: P) => (<svg {...base(p)}><path d="M4 9a8 8 0 0 1 13.5-3.5L20 8M20 4v4h-4" /><path d="M20 15a8 8 0 0 1-13.5 3.5L4 16M4 20v-4h4" /></svg>),
  help: (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-.9.7-.9 1.4v.3" /><path d="M12 17h.01" /></svg>),
};

export type IconName = keyof typeof Icon;
