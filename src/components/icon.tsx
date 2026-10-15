import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/*
  Pentimento icons. Duotone on a 20px grid: a 1.5 stroke, a soft body tinted from the same colour, and one accent
  (--icon-accent, cobalt where it means something) on the detail worth noticing. Containers use 2.25 radii and a
  3.25 to 16.75 live area. The flag waves, the lens has a shine, finished log steps are filled.
*/

const Tint = ({ d }: { d: string }) => (
  <path d={d} fill="currentColor" fillOpacity={0.14} stroke="none" />
);

const Dot = ({
  cx,
  cy,
  r = 1.1,
  plain = false,
}: {
  cx: number;
  cy: number;
  r?: number;
  plain?: boolean;
}) => (
  <circle
    cx={cx}
    cy={cy}
    r={r}
    className={plain ? "icon-solid" : "icon-accent-fill"}
  />
);

const SHEET =
  "M11 2.75H6.25A2.25 2.25 0 0 0 4 5v10a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 16 15V7.75z";
const FOLD = "M11 2.75v2.75a2.25 2.25 0 0 0 2.25 2.25H16";

const Sheet = ({ children }: { children: ReactNode }) => (
  <>
    <Tint d={`${FOLD}z`} />
    <path d={SHEET} />
    <path d={FOLD} />
    {children}
  </>
);

const EXPORT_TRAY =
  "M3.75 11.75h3.1l.62 1.24c.17.34.52.56.9.56h3.26c.38 0 .73-.22.9-.56l.62-1.24h3.1v2.5a2.5 2.5 0 0 1-2.5 2.5h-7.5a2.5 2.5 0 0 1-2.5-2.5z";
const FLAG =
  "M5 4.75c1.6-1 3.2-1 4.8 0s3.2 1 4.8 0v6.5c-1.6 1-3.2 1-4.8 0S6.6 10.25 5 11.25z";
const LENS = "M8.75 14a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5z";
const RING = "M10 16.75a6.75 6.75 0 1 0 0-13.5 6.75 6.75 0 0 0 0 13.5z";
const BAR = (x: number, top: number) =>
  `M${x} ${top + 1.25}a1.25 1.25 0 0 1 1.25-1.25h.5a1.25 1.25 0 0 1 1.25 1.25v${15.5 - top - 1.25}a1.25 1.25 0 0 1-1.25 1.25h-.5A1.25 1.25 0 0 1 ${x} ${15.5}z`;
const EYE =
  "M2.75 10S5.5 4.75 10 4.75 17.25 10 17.25 10 14.5 15.25 10 15.25 2.75 10 2.75 10z";
const BUBBLE =
  "M5.75 3.75h8.5a2.25 2.25 0 0 1 2.25 2.25v5.5a2.25 2.25 0 0 1-2.25 2.25H10l-3.5 2.75v-2.75h-.75A2.25 2.25 0 0 1 3.5 11.5V6a2.25 2.25 0 0 1 2.25-2.25z";
const BOOK =
  "M10 5.5C8.6 4.3 6.6 3.75 3.75 3.75v11c2.85 0 4.85.55 6.25 1.75 1.4-1.2 3.4-1.75 6.25-1.75v-11C13.4 3.75 11.4 4.3 10 5.5z";
const USED =
  "M9 3.25H6.25A2.25 2.25 0 0 0 4 5.5v9.25A2.25 2.25 0 0 0 6.25 17h7.5A2.25 2.25 0 0 0 16 14.75v-3";

const TRASH =
  "M5.5 7h9l-.7 8.1a1.75 1.75 0 0 1-1.75 1.65h-4.1a1.75 1.75 0 0 1-1.75-1.65z";
const PENCIL = "M13.2 3.8a1.9 1.9 0 0 1 2.7 2.7L7.4 15l-3.65 1.25L5 12.6z";

const glyphs = {
  submissions: (
    <>
      <Tint d="M7 4.75V4.5a2 2 0 0 1 2-2h5.25a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H13.5V6.75a2 2 0 0 0-2-2z" />
      <path d="M7 4.75V4.5a2 2 0 0 1 2-2h5.25a2 2 0 0 1 2 2V13a2 2 0 0 1-2 2H13.5" />
      <path d="M5.75 4.75h5.75a2 2 0 0 1 2 2v8.5a2 2 0 0 1-2 2H5.75a2 2 0 0 1-2-2v-8.5a2 2 0 0 1 2-2z" />
      <path d="M8.5 9.25h2.25 M8.5 12.5h1.25" />
      <Dot cx={6.4} cy={9.25} r={0.95} />
    </>
  ),
  flag: (
    <>
      <Tint d={FLAG} />
      <path d={FLAG} />
      <path d="M5 17.25V4.25" />
      <Dot cx={5} cy={3} r={1.3} />
    </>
  ),
  report: (
    <Sheet>
      <path d="M7.5 14.25v-1.25 M12.5 14.25v-2.25" />
      <path d="M10 14.25v-4" className="icon-accent-stroke" />
    </Sheet>
  ),
  essay: (
    <Sheet>
      <path d="M9 11h3.75 M9 14h2.25" />
      <Dot cx={7} cy={11} r={1} />
    </Sheet>
  ),
  search: (
    <>
      <Tint d={LENS} />
      <path d={LENS} />
      <path
        d="M6.4 7.6a2.6 2.6 0 0 1 1.7-1.75"
        className="icon-accent-stroke"
      />
      <path d="M12.75 12.75 16.5 16.5" strokeWidth={2.25} />
    </>
  ),
  down: <path d="M6 8.25l4 4 4-4" />,
  left: <path d="M11.75 6l-4 4 4 4" />,
  right: <path d="M8.25 6l4 4-4 4" />,
  updown: <path d="M7 7.75l3-3 3 3 M7 12.25l3 3 3-3" />,
  export: (
    <>
      <Tint d={EXPORT_TRAY} />
      <path d={EXPORT_TRAY} />
      <path
        d="M10 10V3.25 M7.25 6 10 3.25 12.75 6"
        className="icon-accent-stroke"
      />
    </>
  ),
  check: <path d="M5 10.25l3.25 3.25L15 6.75" strokeWidth={1.75} />,
  caught: (
    <>
      <Tint d={RING} />
      <path d={RING} />
      <path d="M7 10.25l2 2 4-4.25" />
    </>
  ),
  x: <path d="M6.25 6.25l7.5 7.5 M13.75 6.25l-7.5 7.5" />,
  log: (
    <>
      <Dot cx={5.75} cy={4.75} r={1.75} />
      <Dot cx={5.75} cy={10} r={1.75} />
      <circle cx={5.75} cy={15.25} r={1.4} />
      <path d="M5.75 7.25v.25 M5.75 12.5v.25 M9.5 4.75h6.25 M9.5 10h5 M9.5 15.25h3.25" />
    </>
  ),
  progress: (
    <>
      <Tint d={`${BAR(4.25, 11)} ${BAR(8.5, 7.5)}`} />
      <path d={`${BAR(4.25, 11)} ${BAR(8.5, 7.5)}`} />
      <rect
        className="icon-accent-fill"
        height="15"
        rx="2"
        width="4.5"
        x="12"
        y="2.5"
      />
    </>
  ),
  link: (
    <>
      <path d="M8.25 11.75 11.75 8.25 M9.4 5.85l1.15-1.15a3.05 3.05 0 0 1 4.3 4.3l-1.15 1.15" />
      <path
        d="M10.6 14.15l-1.15 1.15a3.05 3.05 0 0 1-4.3-4.3l1.15-1.15"
        className="icon-accent-stroke"
      />
    </>
  ),
  sort: (
    <path d="M6.5 4.25v11.5 M3.75 13l2.75 2.75L9.25 13 M13.5 15.75V4.25 M10.75 7l2.75-2.75L16.25 7" />
  ),
  eye: (
    <>
      <Tint d={EYE} />
      <path d={EYE} />
      <Dot cx={10} cy={10} r={2.5} />
      <circle className="icon-shine" cx={10.85} cy={9.15} r={0.65} />
    </>
  ),
  note: (
    <>
      <Tint d={BUBBLE} />
      <path d={BUBBLE} />
      <Dot cx={7} cy={8.75} r={0.95} plain />
      <Dot cx={10} cy={8.75} r={0.95} plain />
      <Dot cx={13} cy={8.75} r={0.95} />
    </>
  ),
  wrong: (
    <>
      <path d="M4.75 5.5h10.5 M4.75 9h7" />
      <path
        d="M4.25 14c.9-.9 1.85-.9 2.75 0s1.85.9 2.75 0 1.85-.9 2.75 0 1.85.9 2.75 0"
        strokeWidth={1.75}
        className="icon-accent-stroke"
      />
    </>
  ),
  unsourced: (
    <>
      <path d="M8.5 12.5l-1.25 1.25a2.5 2.5 0 0 1-3.54-3.54L4.96 9 M11.5 7.5l1.25-1.25a2.5 2.5 0 0 1 3.54 3.54L15.04 11" />
      <path
        d="M7 3.75V5.5 M3.75 7H5.5 M13 16.25V14.5 M16.25 13H14.5"
        className="icon-accent-stroke"
      />
    </>
  ),
  used: (
    <>
      <Tint d={`${USED}z`} />
      <path d={USED} />
      <path
        d="M16.5 3.5l-5.25 5.25 M11.25 5.25v3.5h3.5"
        className="icon-accent-stroke"
      />
    </>
  ),
  book: (
    <>
      <Tint d={BOOK} />
      <path d={`${BOOK} M10 5.5v10.75`} />
      <path
        d="M12.25 4.4h2.25v4.85l-1.13-.9-1.12.9z"
        className="icon-accent-fill"
      />
    </>
  ),
  trash: (
    <>
      <Tint d={TRASH} />
      <path d={TRASH} />
      <path d="M4 5.25h12 M8 5.25V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.25" />
      <path d="M8.5 9.5v4 M11.5 9.5v4" className="icon-accent-stroke" />
    </>
  ),
  edit: (
    <>
      <Tint d={`${PENCIL}z`} />
      <path d={PENCIL} />
      <path d="M11.5 5.5l3 3" className="icon-accent-stroke" />
    </>
  ),
  more: (
    <>
      <Dot cx={4.5} cy={10} r={1.4} plain />
      <Dot cx={10} cy={10} r={1.4} plain />
      <Dot cx={15.5} cy={10} r={1.4} plain />
    </>
  ),
  lock: (
    <>
      <path d="M6.75 8.75V6.75a3.25 3.25 0 0 1 6.5 0v2" />
      <Tint d="M6 8.75h8a1.5 1.5 0 0 1 1.5 1.5v4.75a1.75 1.75 0 0 1-1.75 1.75h-7.5A1.75 1.75 0 0 1 4.5 15v-4.75A1.5 1.5 0 0 1 6 8.75z" />
      <path d="M6 8.75h8a1.5 1.5 0 0 1 1.5 1.5v4.75a1.75 1.75 0 0 1-1.75 1.75h-7.5A1.75 1.75 0 0 1 4.5 15v-4.75A1.5 1.5 0 0 1 6 8.75z" />
      <Dot cx={10} cy={12.25} r={1.15} />
    </>
  ),
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof glyphs;

export const Icon = ({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) => (
  <svg
    aria-hidden="true"
    className={cn("size-4 shrink-0", className)}
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth={1.5}
    viewBox="0 0 20 20"
  >
    {glyphs[name]}
  </svg>
);
