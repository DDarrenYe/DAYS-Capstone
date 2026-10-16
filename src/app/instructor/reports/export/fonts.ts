import path from "node:path";

import { Font } from "@react-pdf/renderer";

const SUBSETS = [
  "latin",
  "latin-ext",
  "vietnamese",
  "greek",
  "cyrillic",
] as const;

const WEIGHTS = [400, 600] as const;

const MAX_WORD = 28;

export const REPLACEMENT = "?";

const INVISIBLE = /[\p{Cf}\uFE00-\uFE0F]/u;

const FONT_DIRECTORY = path.join(
  process.cwd(),
  "node_modules/@fontsource/inter/files"
);

export const FONT_STACK = SUBSETS.map((subset) => `Inter ${subset}`);

let registered = false;

let covers = (_codePoint: number) => true;

const registerFonts = () => {
  if (registered) {
    return;
  }
  for (const subset of SUBSETS) {
    Font.register({
      family: `Inter ${subset}`,
      fonts: WEIGHTS.map((fontWeight) => ({
        fontWeight,
        src: path.join(
          FONT_DIRECTORY,
          `inter-${subset}-${fontWeight}-normal.woff`
        ),
      })),
    });
  }
  Font.registerHyphenationCallback((word) =>
    word.length > MAX_WORD
      ? (word.match(new RegExp(`.{1,${MAX_WORD}}`, "gsu")) ?? [word])
      : [word]
  );
  registered = true;
};

export const loadFonts = async () => {
  registerFonts();
  const faces = await Promise.all(
    FONT_STACK.map(async (fontFamily) => {
      const descriptor = { fontFamily, fontWeight: 400 } as const;
      await Font.load(descriptor);
      return Font.getFont(descriptor).data;
    })
  );
  covers = (codePoint) =>
    faces.some((face) => face?.hasGlyphForCodePoint(codePoint));
};

const isUnshowable = (char: string) =>
  !INVISIBLE.test(char) &&
  !/\s/u.test(char) &&
  !covers(char.codePointAt(0) ?? 0);

export const printable = (value: string) =>
  Array.from(value, (char) => {
    if (INVISIBLE.test(char)) {
      return "";
    }
    return isUnshowable(char) ? REPLACEMENT : char;
  }).join("");

export const hasUnshowable = (value: string) => [...value].some(isUnshowable);
