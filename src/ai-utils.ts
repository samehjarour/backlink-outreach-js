import { ChatAnthropic } from "@langchain/anthropic";
import { CRAFT_MESSAGE_SEQUENCE, FILTER_LINKS_PROMPT } from "./prompts.js";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";

import { z } from "zod";
import { ActorDatasets, ActorInput } from "./types.js";
import { SystemMessagePromptTemplate } from "@langchain/core/prompts";
import { log } from "apify";

const { ANTROPHIC_API_KEY } = process.env;

const Url = z.object({
  urls: z.array(z.string()),
});

const model = new ChatAnthropic({
  model: "claude-3-5-haiku-20241022",
  temperature: 0,
  apiKey: ANTROPHIC_API_KEY,
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

/**
 * This function prepares outreach sequences for all articles
 */
export async function getOutreachSequences(
  articles: ActorDatasets.ContentCrawlerItem[],
  input: ActorInput,
) {
  const response: OutreachSequence[] = [];

  for (const article of articles) {
    try {
      const sequence = await createOutreachSequence(article.text, input);

      response.push({
        sequence: sequence,
        articleUrl: article.url,
        title: article.metadata.title,
        description: article.metadata.description,
      });
    } catch (err) {
      log.info("Failed to prepare 1 outreach sequence for", {
        url: article.url,
      });
    }
  }

  return response;
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
