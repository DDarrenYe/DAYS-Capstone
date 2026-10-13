import assert from "node:assert/strict";
import { test } from "node:test";
import { deflateRawSync } from "node:zlib";

import { MAX_DOCX_BYTES } from "@/lib/data/schemas";

import { extractDocx, readDocument } from "./docx";

const wordFile = Buffer.from(
  "UEsDBBQAAAAIADELTl3IZt/Q7AAAAK8BAAATAAAAW0NvbnRlbnRfVHlwZXNdLnhtbH1QyW7CMBC98xWWryhx6KGqqiQcuhzbHugHjOxJYuFNHkPh7zsByqGiPc68Va9dH7wTe8xkY+jkqm6kwKCjsWHs5OfmtXqQggoEAy4G7OQRSa77Rbs5JiTB4kCdnEpJj0qRntAD1TFhYGSI2UPhM48qgd7CiOquae6VjqFgKFWZPWTfPuMAO1fEy4Hf5yIZHUnxdCbOWZ2ElJzVUBhX+2B+pVSXhJqVJw5NNtGSCVLdTJiRvwMuundeJluD4gNyeQPPLPUVs1Em6p1nZf2/zY2ecRisxqt+dks5aiTiyb2rr4gHG376q9Pc/eIbUEsDBAoAAAAAADELTl0AAAAAAAAAAAAAAAAGAAAAX3JlbHMvUEsDBBQAAAAIADELTl06SRuAsQAAACsBAAALAAAAX3JlbHMvLnJlbHONzzsOwjAMBuC9p4i807QMCKGmXRBSV1QOECVuGtE8lIRHb08GBooYGG3//iw33dPM5I4hamcZ1GUFBK1wUlvF4DKcNnsgMXEr+ewsMlgwQtcWzRlnnvJOnLSPJCM2MphS8gdKo5jQ8Fg6jzZPRhcMT7kMinourlwh3VbVjoZPA9qVSXrJIPSyBjIsHv+x3ThqgUcnbgZt+nHiK5FlHhQmBg8XJJXvdplZoG1DVy+2xQtQSwMECgAAAAAAMQtOXQAAAAAAAAAAAAAAAAUAAAB3b3JkL1BLAwQUAAAACAAxC05dd8KJHhABAAD0AQAAEQAAAHdvcmQvZG9jdW1lbnQueG1sbZHPbsIwDMbvPIWVSZy2hoE2TS0NN07TTuwB0tS0lfJPcaDw9kthpRvi8iWWf7E/O+vNyWg4YqDO2ZK9ZgsGaJWrO9uU7Hu3fflgQFHaWmpnsWRnJLYRs3Wf104dDNoIqYKlvC9ZG6PPOSfVopGUOY825fYuGBlTGBreu1D74BQSpQZG8+Vi8c6N7CwTqWTl6vNw+kHCIFHsegdaWqRnSAYgHDRmaz5kBg0X9XePBks5eamSYR+QMByRiW1HLcyl8QWotvME/8qMb2XFr42VowhzHYs3mD8tV6sie8RX4Rf/wlME3Vm8o2rUNzjddwkTjbtiYzxNcqFvE/E/Ojnk95bFp6T4aCl8XCmfvkvMfgBQSwECHgMUAAAACAAxC05dyGbf0OwAAACvAQAAEwAAAAAAAAABAAAApIEAAAAAW0NvbnRlbnRfVHlwZXNdLnhtbFBLAQIeAwoAAAAAADELTl0AAAAAAAAAAAAAAAAGAAAAAAAAAAAAEADtQR0BAABfcmVscy9QSwECHgMUAAAACAAxC05dOkkbgLEAAAArAQAACwAAAAAAAAABAAAApIFBAQAAX3JlbHMvLnJlbHNQSwECHgMKAAAAAAAxC05dAAAAAAAAAAAAAAAABQAAAAAAAAAAABAA7UEbAgAAd29yZC9QSwECHgMUAAAACAAxC05dd8KJHhABAAD0AQAAEQAAAAAAAAABAAAApIE+AgAAd29yZC9kb2N1bWVudC54bWxQSwUGAAAAAAUABQAgAQAAfQMAAAAA",
  "base64"
);

const zipOf = (
  entries: { name: string; data: Buffer; deflate?: boolean }[]
) => {
  const parts: Buffer[] = [];
  const directory: Buffer[] = [];
  let offset = 0;
  for (const { name, data, deflate = true } of entries) {
    const packed = deflate ? deflateRawSync(data) : data;
    const label = Buffer.from(name);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04_03_4b_50, 0);
    local.writeUInt16LE(deflate ? 8 : 0, 8);
    local.writeUInt32LE(packed.length, 18);
    local.writeUInt32LE(data.length, 22);
    local.writeUInt16LE(label.length, 26);
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02_01_4b_50, 0);
    entry.writeUInt16LE(deflate ? 8 : 0, 10);
    entry.writeUInt32LE(packed.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(label.length, 28);
    entry.writeUInt32LE(offset, 42);
    directory.push(entry, label);
    parts.push(local, label, packed);
    offset += 30 + label.length + packed.length;
  }
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06_05_4b_50, 0);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(Buffer.concat(directory).length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...parts, ...directory, end]);
};

const body = (xml: string, deflate = true) =>
  zipOf([{ data: Buffer.from(xml), deflate, name: "word/document.xml" }]);

const rejects = (bytes: Uint8Array, message: RegExp) =>
  assert.throws(() => extractDocx(bytes), { message, name: "DocxError" });

test("a Word document comes back as plain text with its paragraphs, tabs and breaks", () => {
  assert.equal(
    extractDocx(wordFile),
    "Two lanes, one rule.\nFish & chips \tcost <5 é.\nNext line\n\nLast."
  );
});

test("stored and deflated entries read the same", () => {
  const xml = "<w:p><w:r><w:t>Same</w:t></w:r></w:p>";
  assert.equal(extractDocx(body(xml, false)), "Same");
  assert.equal(extractDocx(body(xml)), "Same");
});

test("text is read from the document body only", () => {
  const zip = zipOf([
    { data: Buffer.from("<w:t>Other</w:t>"), name: "word/footer1.xml" },
    {
      data: Buffer.from("<w:p><w:t>Body</w:t></w:p>"),
      name: "word/document.xml",
    },
  ]);
  assert.equal(extractDocx(zip), "Body");
});

test("files that are not Word documents are refused without a crash", () => {
  rejects(Buffer.from("plain text, not a zip"), /couldn't read/u);
  rejects(new Uint8Array(), /couldn't read/u);
  rejects(wordFile.subarray(0, -30), /couldn't read/u);
  rejects(wordFile.subarray(0, 200), /couldn't read/u);
  rejects(
    zipOf([{ data: Buffer.from("<w:t>x</w:t>"), name: "notes.txt" }]),
    /couldn't read/u
  );
  rejects(
    zipOf([
      {
        data: Buffer.from("not deflated"),
        deflate: false,
        name: "word/document.xml",
      },
    ]).fill(0x7f, 0, 4),
    /couldn't read/u
  );
});

test("a document that expands past the limit is refused", () => {
  const huge = "<w:p><w:r><w:t>x</w:t></w:r></w:p>".repeat(1_000_000);
  rejects(body(huge), /couldn't read/u);
});

test("an empty or overlong document is refused with a reason", () => {
  rejects(body("<w:p/>"), /no text/u);
  rejects(body(`<w:t>${"a".repeat(50_001)}</w:t>`), /longer than 50,000/u);
});

test("the file's name and size are checked before reading", async () => {
  const docx = new File([wordFile], "essay2-final.DOCX");
  assert.deepEqual(await readDocument(docx), {
    filename: "essay2-final.DOCX",
    text: "Two lanes, one rule.\nFish & chips \tcost <5 é.\nNext line\n\nLast.",
  });
  await assert.rejects(
    readDocument(new File([wordFile], "essay.pdf")),
    /Choose a Word document/u
  );
  await assert.rejects(
    readDocument(new File([new Uint8Array(MAX_DOCX_BYTES + 1)], "big.docx")),
    /larger than 4 MB/u
  );
  await assert.rejects(
    readDocument(new File([Buffer.from("PK nonsense")], "broken.docx")),
    /couldn't read/u
  );
});
