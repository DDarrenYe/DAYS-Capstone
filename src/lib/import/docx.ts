import "server-only";
import { inflateRawSync } from "node:zlib";

import { MAX_DOCX_BYTES, MAX_TEXT } from "@/lib/data/schemas";

const END_OF_DIRECTORY = 0x06_05_4b_50;
const DIRECTORY_ENTRY = 0x02_01_4b_50;
const LOCAL_ENTRY = 0x04_03_4b_50;
const END_RECORD_BYTES = 22;
const MAX_COMMENT_BYTES = 0xff_ff;
const MAX_XML_BYTES = 32 * 1024 * 1024;
const MAX_CODE_POINT = 0x10_ff_ff;
const STORED = 0;
const DEFLATED = 8;
const BODY = "word/document.xml";

const messages = {
  corrupt:
    "We couldn't read that document. Check that it opens in Word, then save it as .docx and try again.",
  empty: "That document has no text in it.",
  too_large: `That file is larger than ${MAX_DOCX_BYTES / 1_000_000} MB.`,
  too_long: `That document is longer than ${MAX_TEXT.toLocaleString("en")} characters.`,
  wrong_type: "Choose a Word document (.docx).",
};

export class DocxError extends Error {
  constructor(reason: keyof typeof messages, cause?: unknown) {
    super(messages[reason], { cause });
    this.name = "DocxError";
  }
}

const findEndRecord = (zip: Buffer) => {
  const earliest = Math.max(
    0,
    zip.length - END_RECORD_BYTES - MAX_COMMENT_BYTES
  );
  for (let at = zip.length - END_RECORD_BYTES; at >= earliest; at -= 1) {
    if (zip.readUInt32LE(at) === END_OF_DIRECTORY) {
      return at;
    }
  }
  throw new RangeError("Not a zip archive");
};

const unpack = (zip: Buffer, entryAt: number) => {
  const method = zip.readUInt16LE(entryAt + 10);
  const size = zip.readUInt32LE(entryAt + 20);
  const local = zip.readUInt32LE(entryAt + 42);
  if (zip.readUInt32LE(local) !== LOCAL_ENTRY) {
    throw new RangeError("Broken zip entry");
  }
  const start =
    local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
  const packed = zip.subarray(start, start + size);
  if (packed.length !== size) {
    throw new RangeError("Truncated zip entry");
  }
  if (method === STORED && size <= MAX_XML_BYTES) {
    return packed;
  }
  if (method === DEFLATED) {
    return inflateRawSync(packed, { maxOutputLength: MAX_XML_BYTES });
  }
  throw new RangeError("Unsupported zip entry");
};

const readBody = (zip: Buffer) => {
  const end = findEndRecord(zip);
  let entryAt = zip.readUInt32LE(end + 16);
  for (let left = zip.readUInt16LE(end + 10); left > 0; left -= 1) {
    if (zip.readUInt32LE(entryAt) !== DIRECTORY_ENTRY) {
      throw new RangeError("Broken zip directory");
    }
    const nameLength = zip.readUInt16LE(entryAt + 28);
    const name = zip.toString("utf-8", entryAt + 46, entryAt + 46 + nameLength);
    if (name === BODY) {
      return unpack(zip, entryAt).toString("utf-8");
    }
    entryAt +=
      46 +
      nameLength +
      zip.readUInt16LE(entryAt + 30) +
      zip.readUInt16LE(entryAt + 32);
  }
  throw new RangeError("Not a Word document");
};

const ENTITIES = new Map([
  ["amp", "&"],
  ["apos", "'"],
  ["gt", ">"],
  ["lt", "<"],
  ["quot", '"'],
]);

const decodeEntity = (whole: string) => {
  const entity = whole.slice(1, -1);
  const named = ENTITIES.get(entity);
  if (named) {
    return named;
  }
  const code = /^#x/iu.test(entity)
    ? Number.parseInt(entity.slice(2), 16)
    : Number(entity.slice(1));
  return code <= MAX_CODE_POINT ? String.fromCodePoint(code) : whole;
};

const decode = (text: string) =>
  text.replaceAll(/&(?:#x[\da-f]+|#\d+|\w+);/giu, decodeEntity);

const RUN =
  /<w:t(?:\s[^>]*)?>[^<]*<\/w:t>|<w:tab\s*\/>|<w:(?:br|cr|p)\b[^>]*\/>|<\/w:p>/gu;

const runText = (run: string) => {
  if (/^<w:t[\s>]/u.test(run)) {
    return decode(run.slice(run.indexOf(">") + 1, -"</w:t>".length));
  }
  return run.startsWith("<w:tab") ? "\t" : "\n";
};

const plainText = (xml: string) =>
  (xml.match(RUN) ?? [])
    .map((run) => runText(run))
    .join("")
    .replaceAll(/\n{3,}/gu, "\n\n")
    .trim();

export const extractDocx = (bytes: Uint8Array) => {
  let xml: string;
  try {
    xml = readBody(Buffer.from(bytes.buffer, bytes.byteOffset, bytes.length));
  } catch (error) {
    throw new DocxError("corrupt", error);
  }
  const text = plainText(xml);
  if (text === "") {
    throw new DocxError("empty");
  }
  if (text.length > MAX_TEXT) {
    throw new DocxError("too_long");
  }
  return text;
};

export const readDocument = async (file: File) => {
  if (!/\.docx$/iu.test(file.name)) {
    throw new DocxError("wrong_type");
  }
  if (file.size > MAX_DOCX_BYTES) {
    throw new DocxError("too_large");
  }
  return {
    filename: file.name.trim(),
    text: extractDocx(new Uint8Array(await file.arrayBuffer())),
  };
};
