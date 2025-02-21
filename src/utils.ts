// @ts-nocheck
import { ActorDatasets } from "./types.js";
import { OutreachSequence } from "./ai-utils.js";

/**
 * Returns only unique domains from the list of URLs
 */
export const getUniqueDomains = (allUrls: string[]) => {
  const uniqueDomains = new Set<string>();

  for (const url of allUrls) {
    try {
      const parsedUrl = new URL(url);
      const protocol = parsedUrl.protocol; // Will be "http:" or "https:"
      const hostname = parsedUrl.hostname;
      const fullDomain = `${protocol}//${hostname}`;
      uniqueDomains.add(fullDomain);
    } catch (error) {
      console.error(`Invalid URL: ${url}`);
    }
  }

  return Array.from(uniqueDomains);
};

/**
 * Contact scraper returns multiple pages with contact information from the same domain.
 * This function merges all contact info under domain key.
 */
export const prepareContactsByDomain = (
  data: ActorDatasets.ContactDetailItem[],
) => {
  const grouped = data.reduce((acc, item) => {
    const { domain } = item;

    if (!acc[domain]) {
      acc[domain] = {
        domain,
        emails: new Set(),
        phones: new Set(),
        phonesUncertain: new Set(),
        linkedIns: new Set(),
        twitters: new Set(),
        instagrams: new Set(),
        facebooks: new Set(),
        youtubes: new Set(),
        tiktoks: new Set(),
        pinterests: new Set(),
        discords: new Set(),
      };
    }

    // Merge all contact fields
    Object.keys(acc[domain]).forEach((key) => {
      if (Array.isArray(item[key])) {
        item[key].forEach((value) => acc[domain][key].add(value));
      }
    });

    return acc;
  }, {});

  return grouped;
};

/**
 * This function prepares final output enriching AI sequences with contacts information
 */
export const enrichSequenceWithContacts = (
  sequence: OutreachSequence[],
  contacts: object,
) => {
  return sequence.map((item) => {
    // @ts-expect-error fix later
    const foundContact = contacts?.[getDomainFromUrl(item.articleUrl)];

    return {
      ...item,
      emails: foundContact?.emails ? [...foundContact?.emails] : [],
      linkedIns: foundContact?.linkedIns ? [...foundContact?.linkedIns] : [],
      twitters: foundContact?.twitters ? [...foundContact?.twitters] : [],
      facebooks: foundContact?.facebooks ? [...foundContact?.facebooks] : [],
    };
  });
};

/**
 * This function gets domain from the url
 */
export const getDomainFromUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    return hostname.replace("www.", "");
  } catch {
    return undefined;
  }
};
