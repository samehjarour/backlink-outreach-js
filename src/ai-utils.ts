import { ChatAnthropic } from "@langchain/anthropic";
import { CRAFT_MESSAGE_SEQUENCE, FILTER_LINKS_PROMPT } from "./prompts.js";

import { HumanMessage } from "@langchain/core/messages";

import { z } from "zod";
import { ActorDatasets, ActorInput } from "./types.js";
import { SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { Actor, log } from "apify";
import {
  enrichSequenceWithContacts,
  prepareContactsByDomain,
} from "./utils.js";

const { ANTROPHIC_API_KEY } = process.env;

const Event = {
  PREPARED_OUTREACH: "prepared-outreach",
};

const Url = z.object({
  urls: z.array(z.string()),
});

const model = new ChatAnthropic({
  model: "claude-3-5-haiku-20241022",
  temperature: 0,
  apiKey: ANTROPHIC_API_KEY,
  maxRetries: 3,
});

const MessageSchema = z.object({
  subject: z.string(),
  preview: z.string(),
  text: z.string(),
});

const AISequence = z.object({
  email: z.array(MessageSchema),
  twitter: z.array(MessageSchema),
  linkedIn: z.array(MessageSchema),
});

type AISequenceType = z.infer<typeof AISequence>;

export type OutreachSequence = {
  sequence: AISequenceType;
  articleUrl: string;
  title: string;
  description: string;
  uuid: string;
};

/**
 * This function analyzes list keywords with list of url scraped from google filters only backlinks,
 * which potentially can be our partners
 */
export async function getPotentialBacklinks(
  preparedArticlesUrl: ActorDatasets.OrganicResultItem[][],
  input: ActorInput,
) {
  const res = await Promise.all(
    preparedArticlesUrl.map((item) =>
      getFilteredBacklinksForKeyword(item, input),
    ),
  );
  return res.flat();
}

/**
 * This function analyzes list of url scraped from google for 1 keyword and filters only backlinks,
 * which potentially can be interested for us
 */
async function getFilteredBacklinksForKeyword(
  articleUrls: ActorDatasets.OrganicResultItem[],
  input: ActorInput,
) {
  const structuredLlm = model.withStructuredOutput(Url);

  const filteredUrls = articleUrls.filter(
    (item) => !input.excludeDomains.some((x) => item.url.includes(x)),
  );

  const systemMessageTemplate =
    SystemMessagePromptTemplate.fromTemplate(FILTER_LINKS_PROMPT);

  const systemMessage = await systemMessageTemplate.format({
    businessName: input.businessName,
    shortBusinessDescription: input.shortBusinessDescription,
  });

  const res = await structuredLlm.invoke([
    systemMessage,
    new HumanMessage(JSON.stringify(filteredUrls)),
  ]);

  return res?.urls;
}

async function sleep(waitTimeMs: number) {
  return await new Promise((resolve) => setTimeout(resolve, waitTimeMs));
}

/**
 * This function prepares outreach sequences for all articles in batch with rate limit handling
 */
export async function getOutreachSequences(
  articles: ActorDatasets.ContentCrawlerItem[],
  contactDetails: ActorDatasets.ContactDetailItem[],
  input: ActorInput,
) {
  const BATCH_SIZE = 10;
  const WAIT_TIME_MS = 60_000;
  const RATE_LIMIT_ERROR = "MODEL_RATE_LIMIT";
  const MAX_ERROR_COUNT = 3;

  let remainingArticles = articles.map((item) => ({
    ...item,
    uuid: crypto.randomUUID() as string,
  }));

  const uuidErrorMap = new Map<string, number>();

  while (remainingArticles.length > 0) {
    const currentBatch = remainingArticles.slice(0, BATCH_SIZE);

    const sequencePromises = currentBatch.map(async (article) => {
      try {
        const sequence = await createOutreachSequence(article.text, input);

        return {
          sequence: sequence,
          articleUrl: article.url,
          title: article.metadata.title,
          description: article.metadata.description,
          uuid: article.uuid,
        };
      } catch (err) {
        log.info("Failed to prepare 1 outreach sequence for", {
          url: article.url,
          uuid: article.uuid,
          error: err?.lc_error_code ?? "unknown", // MODEL_RATE_LIMIT - in case of error
        });
        return {
          errorType: err?.lc_error_code ?? "unknown", // MODEL_RATE_LIMIT - in case of error
          uuid: article.uuid,
        };
      }
    });

    const results = await Promise.all(sequencePromises);

    // Filter out processed values
    const outreachSequences: OutreachSequence[] = results.filter(
      (result): result is OutreachSequence => !("errorType" in result),
    );

    const processedUuids = outreachSequences.map((item) => item.uuid);
    const errorItems = results.filter((result) => "errorType" in result);

    remainingArticles = remainingArticles.filter(
      (item) => !processedUuids.includes(item.uuid),
    );

    const isRateLimit = errorItems.some(
      (item: any) => item.errorType === RATE_LIMIT_ERROR,
    );

    for (const errorItem of errorItems) {
      const previousValue = uuidErrorMap.get(errorItem.uuid) ?? 0;
      uuidErrorMap.set(errorItem.uuid, previousValue + 1);
    }

    const filteredKeys = Array.from(uuidErrorMap.entries())
      .filter(([_, count]) => count >= MAX_ERROR_COUNT)
      .map(([uuid, _]) => uuid);

    remainingArticles.filter((item) => !filteredKeys.includes(item.uuid));

    // Save to dataset
    log.info("Preparing dataset");

    const contactsByDomain = prepareContactsByDomain(contactDetails);

    const enrichedSequence = enrichSequenceWithContacts(
      outreachSequences,
      contactsByDomain,
    );

    await Actor.charge({
      eventName: Event.PREPARED_OUTREACH,
      count: enrichedSequence.length,
    });

    await Actor.pushData(enrichedSequence);

    if (isRateLimit) {
      log.info("Rate limit reached. We'll sleep for some time!", {
        errorItems,
      });
      await sleep(WAIT_TIME_MS);
    } else {
      await sleep(5_000);
    }
  }
}

/**
 * This function prepares outreach sequence for 1 article
 */
async function createOutreachSequence(content: string, input: ActorInput) {
  const structuredLlm = model.withStructuredOutput(AISequence);

  const systemMessageTemplate = SystemMessagePromptTemplate.fromTemplate(
    CRAFT_MESSAGE_SEQUENCE,
  );

  const systemMessage = await systemMessageTemplate.format({
    userName: input.name,
  });

  const sequence = await structuredLlm.invoke([
    systemMessage,
    new HumanMessage(content),
  ]);

  return sequence;
}
