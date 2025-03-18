import { Actor, log } from "apify";
import { getOutreachSequences, getPotentialBacklinks } from "./ai-utils.js";
import {
  enrichSequenceWithContacts,
  getUniqueDomains,
  prepareContactsByDomain,
} from "./utils.js";
import {
  getArticleDetailContent,
  getContactDetails,
  getResultsFromGoogleByKeywords,
} from "./actors.js";
import { ActorInput } from "./types.js";

const Event = {
  PREPARED_OUTREACH: "prepared-outreach",
};

await Actor.init();

const { APIFY_TOKEN, ANTROPHIC_API_KEY } = process.env;

// You can configure the input for the Actor in the Apify UI when running on the Apify platform or editing
// storage/key_value_stores/default/INPUT.json when running locally.
const input = (await Actor.getInput<ActorInput>()) || ({} as ActorInput);

const { keywords, shortBusinessDescription, businessName, name } = input;

if (!ANTROPHIC_API_KEY)
  throw new Error(
    "Please configure the ANTROPHIC_API_KEY as environment variable!",
  );
if (!APIFY_TOKEN)
  throw new Error(
    "Please configure the APIFY_TOKEN environment variable! Call `apify login` in your terminal to authenticate.",
  );
if (!keywords.length)
  throw new Error(
    "Please configure the APIFY_TOKEN environment variable! Call `apify login` in your terminal to authenticate.",
  );
if (!name || !shortBusinessDescription || !businessName)
  throw new Error(
    "Name, short business description and business name are required!",
  );

// Scrape keyword results from google using actor
const preparedArticleUrls = await getResultsFromGoogleByKeywords(keywords);

log.info("Scraped google search by keywords", {
  totalPages: preparedArticleUrls?.flat()?.length ?? 0,
});

// Analyze and find potential backlinks
const listOfPotentialBacklinks = await getPotentialBacklinks(
  preparedArticleUrls,
  input,
);

log.info("Analyzed potential backlinks", {
  backlinksAmount: listOfPotentialBacklinks?.length ?? 0,
});

// Filter prepared articles to include only potential backlinks
const interestingArticles = preparedArticleUrls
  .flat()
  .filter((item) => listOfPotentialBacklinks.includes(item.url));

const interestingUrls = interestingArticles.map((item) => item.url);

// Get contact details with Contact Info Scraper(vdrmota/contact-info-scraper)
const uniqueDomains = getUniqueDomains(interestingUrls);
const contactDetails = await getContactDetails(uniqueDomains);

const withContacts = contactDetails.filter(
  (item) => item?.emails?.length || item?.linkedIns?.length,
);

const withContactsDomains = [
  ...new Set(withContacts.map((item) => item.domain)),
];

const interestingUrlsWithContactDetails = interestingUrls.filter((item) =>
  withContactsDomains.some((domain) => item.includes(domain)),
);

log.info("Get contact details", {
  urlsWithContactDetails: interestingUrlsWithContactDetails?.length ?? 0,
});

// Get article content with Apify Website Content Crawler(apify/website-content-crawler)
const articleContentDetails = await getArticleDetailContent(
  interestingUrlsWithContactDetails,
);

log.info("Preparing outreach sequence for articles", {
  articles: articleContentDetails?.length ?? 0,
});

// Prepare outreach sequence for all articles
const outreachSequence = await getOutreachSequences(
  articleContentDetails,
  input,
);

log.info("Preparing dataset");

const contactsByDomain = prepareContactsByDomain(contactDetails);

const enrichedSequence = enrichSequenceWithContacts(
  outreachSequence,
  contactsByDomain,
);

await Actor.charge({
  eventName: Event.PREPARED_OUTREACH,
  count: enrichedSequence.length,
});

await Actor.pushData(enrichedSequence);
await Actor.exit();
