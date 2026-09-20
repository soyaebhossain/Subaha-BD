import { SVGProps } from "react";

const paths = {
  search: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 4.5 4.5" /></>,
  bag: <><path d="M5 7h14l1 14H4L5 7Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
  user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2" /></>,
  arrow: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
  chevron: <path d="m9 5 7 7-7 7" />,
  leaf: <><path d="M20 3c-9 0-16 2-16 10a6 6 0 0 0 6 6c8 0 10-7 10-16Z" /><path d="m4 21 11-11" /></>,
  store: <><path d="m4 3-2 6a3 3 0 0 0 5 2 3 3 0 0 0 5 0 3 3 0 0 0 5 0 3 3 0 0 0 5-2l-2-6H4Zm0 10v8h16v-8M9 21v-7h6v7" /></>,
  truck: <><path d="M2 5h12v12H2V5Zm12 5h4l4 4v3h-8" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  shield: <><path d="m12 2 9 4v6c0 5-9 10-9 10S3 17 3 12V6l9-4Z" /><path d="m8 12 3 3 5-6" /></>,
  box: <><path d="m12 2 10 5-10 5L2 7l10-5ZM2 7v10l10 5 10-5V7M12 12v10M7 4.5l10 5v4" /></>,
  grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  menu: <path d="M3 6h18M3 12h18M3 18h18" />,
  apple: <><path d="M12 7c-4-4-10-1-9 5s4 11 9 8c5 3 8-2 9-8s-5-9-9-5ZM12 7c0-4 3-5 5-5" /><path d="M12 6C9 6 7 4 7 2c3 0 5 1 5 4Z" /></>,
  cup: <><path d="M3 8h13v8a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5V8Zm13 1h2a3 3 0 0 1 0 6h-2M6 2v3M11 2v3" /></>,
  home: <><path d="m2 11 10-9 10 9M5 9v12h14V9M9 21v-7h6v7" /></>,
  filter: <><path d="M4 6h16M4 12h16M4 18h16" /><circle cx="8" cy="6" r="2" fill="currentColor" /><circle cx="16" cy="12" r="2" fill="currentColor" /><circle cx="9" cy="18" r="2" fill="currentColor" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
} as const;

export type IconName = keyof typeof paths;
export default function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{paths[name]}</svg>;
}
