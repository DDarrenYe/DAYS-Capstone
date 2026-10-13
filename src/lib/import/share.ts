import "server-only";
import { parseShare, parseShareLink } from "@/lib/import/chatgpt";
import type { ShareLink } from "@/lib/import/chatgpt";
import { ImportError } from "@/lib/import/errors";
import { fetchPage } from "@/lib/import/fetch-page";

const sameShare = (id: string) => (url: URL) => {
  let link: ShareLink;
  try {
    link = parseShareLink(url.href);
  } catch (error) {
    throw new ImportError("blocked", error);
  }
  if (link.id !== id) {
    throw new ImportError("blocked");
  }
  return link.url;
};

export const loadShare = async (
  rawUrl: string,
  fetcher: typeof fetchPage = fetchPage
) => {
  const link = parseShareLink(rawUrl);
  const html = await fetcher(link.url, sameShare(link.id));
  return { link, ...parseShare(html) };
};
