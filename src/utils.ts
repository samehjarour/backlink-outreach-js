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

export const prepareContactsByDomain = (data: object[]) => {
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

export const enrichSequenceWithContacts = (sequence, contacts) => {
  return sequence.map((item) => {
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

export const getDomainFromUrl = (url: string) => {
  try {
    const parsedUrl = new URL(url);
    const hostname = parsedUrl.hostname;
    return hostname.replace("www.", "");
  } catch {
    return undefined;
  }
};
