// @ts-nocheck
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

const Event = {
  PREPARED_OUTREACH: "prepared-outreach",
};

await Actor.init();

const { OPENAI_API_KEY, APIFY_TOKEN } = process.env;

// You can configure the input for the Actor in the Apify UI when running on the Apify platform or editing
// storage/key_value_stores/default/INPUT.json when running locally.
const {
  keywords,
  openAIApiKey = OPENAI_API_KEY, // This is a fallback to the OPENAI_API_KEY environment variable when value is not present in the input.
  excludeDomains,
} = (await Actor.getInput()) || {};

if (!openAIApiKey)
  throw new Error(
    "Please configure the OPENAI_API_KEY as environment variable or enter it into the input!",
  );
if (!APIFY_TOKEN)
  throw new Error(
    "Please configure the APIFY_TOKEN environment variable! Call `apify login` in your terminal to authenticate.",
  );

// Scrape from google
const preparedArticleUrls = await getResultsFromGoogleByKeywords(keywords);

log.info("Scraped google search for keywords", {
  totalPages: preparedArticleUrls?.flat()?.length ?? 0,
});

// Find potential backlinks
const listOfPotentialBacklinks = await getPotentialBacklinks(
  preparedArticleUrls,
  excludeDomains,
);

log.info("Analyzed potential backlinks", {
  backlinksAmount: listOfPotentialBacklinks?.length ?? 0,
});

const interestingArticles = preparedArticleUrls
  .flat()
  .filter((item) => listOfPotentialBacklinks.includes(item.url));

const interestingUrls = interestingArticles.map((item) => item.url);

// Get contact details
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

const articleContentDetails = await getArticleDetailContent(
  interestingUrlsWithContactDetails,
);

log.info("Preparing outreach sequence for articles", {
  articles: articleContentDetails?.length ?? 0,
});
// process full article to include: email, linkedin
const outreachSequence = await getOutreachSequences(articleContentDetails);

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
