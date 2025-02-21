import { ApifyDatasetLoader } from "@langchain/community/document_loaders/web/apify_dataset";
import { ActorDatasets } from "./types.js";

const { APIFY_TOKEN } = process.env;

/**
 * Executes the Apify Google Search Scraper(apify/google-search-scraper) and returns the dataset items.
 */
export async function getResultsFromGoogleByKeywords(keywords: string[]) {
  const googleSearchScraperInput = {
    forceExactMatch: false,
    includeIcons: false,
    includeUnfilteredResults: false,
    maxPagesPerQuery: 1,
    mobileResults: false,
    queries: keywords.join("\n"),
    resultsPerPage: 100,
    saveHtml: false,
    saveHtmlToKeyValueStore: true,
  };

  const loader = await ApifyDatasetLoader.fromActorCall(
    "apify/google-search-scraper",
    googleSearchScraperInput,
    {
      datasetMappingFunction: (item) => item,
      clientOptions: { token: APIFY_TOKEN },
    },
  );

  const result = (await loader.load()) as ActorDatasets.GoogleScraperDataset;
  return result.map((item) => item.organicResults);
}

/**
 * Executes the Contact Info Scraper(vdrmota/contact-info-scraper) and returns the dataset items.
 */
export async function getContactDetails(uniqueDomains: string[]) {
  const contactDetailsOptions = {
    considerChildFrames: true,
    maxDepth: 2,
    maxRequests: 9999999,
    maxRequestsPerStartUrl: 10,
    sameDomain: true,
    startUrls: uniqueDomains.map((item) => ({
      url: item,
      method: "GET",
    })),
    useBrowser: false,
  };

  const contactDetailsRun = await ApifyDatasetLoader.fromActorCall(
    "vdrmota/contact-info-scraper",
    contactDetailsOptions,
    {
      datasetMappingFunction: (item) => item,
      clientOptions: { token: APIFY_TOKEN },
    },
  );

  return (await contactDetailsRun.load()) as ActorDatasets.ContactDetailDataset;
}

/**
 * Executes the Apify Website Content Crawler(apify/website-content-crawler) and returns the dataset items.
 */
export async function getArticleDetailContent(articleUrls: string[]) {
  const articleContentOptions = {
    aggressivePrune: false,
    clickElementsCssSelector: '[aria-expanded="false"]',
    clientSideMinChangePercentage: 15,
    crawlerType: "cheerio",
    debugLog: false,
    debugMode: false,
    expandIframes: true,
    ignoreCanonicalUrl: false,
    keepUrlFragments: false,
    maxCrawlDepth: 1,
    proxyConfiguration: {
      useApifyProxy: true,
    },
    dynamicContentWaitSecs: 1,
    readableTextCharThreshold: 100,
    removeCookieWarnings: true,
    removeElementsCssSelector:
      'nav, footer, script, style, noscript, svg, img[src^=\'data:\'],\n[role="alert"],\n[role="banner"],\n[role="dialog"],\n[role="alertdialog"],\n[role="region"][aria-label*="skip" i],\n[aria-modal="true"]',
    renderingTypeDetectionPercentage: 10,
    saveFiles: false,
    saveHtml: false,
    saveHtmlAsFile: false,
    saveMarkdown: true,
    saveScreenshots: false,
    startUrls: articleUrls.map((item) => ({
      url: item,
      method: "GET",
    })),
    useSitemaps: false,
  };

  const articleContent = await ApifyDatasetLoader.fromActorCall(
    "apify/website-content-crawler",
    articleContentOptions,
    {
      datasetMappingFunction: (item) => item,
      clientOptions: { token: APIFY_TOKEN },
    },
  );

  return (await articleContent.load()) as ActorDatasets.ContentCrawlerDataset;
}
