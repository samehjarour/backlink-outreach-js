import { ChatOpenAI } from "@langchain/openai";
import { CRAFT_MESSAGE_SEQUENCE, FILTER_LINKS_PROMPT } from "./prompts.js";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";
import { ActorDatasets } from "./types.js";

const { OPENAI_API_KEY } = process.env;

const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey: OPENAI_API_KEY,
});

const Url = z.object({
  urls: z.array(z.string()),
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
  excludeDomains = [],
) {
  const res = await Promise.all(
    preparedArticlesUrl.map((item) =>
      getFilteredBacklinksForKeyword(item, excludeDomains),
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
  excludeDomains: string[],
) {
  const agent = createReactAgent({
    llm: model,
    tools: [],
    responseFormat: zodResponseFormat(Url, "url").json_schema,
  });

  const filteredUrls = articleUrls.filter(
    (item) => !excludeDomains.some((x) => item.url.includes(x)),
  );

  const res = await agent.invoke({
    messages: [
      new SystemMessage(FILTER_LINKS_PROMPT),
      new HumanMessage(JSON.stringify(filteredUrls)),
    ],
  });

  return res?.structuredResponse?.urls;
}

/**
 * This function prepares outreach sequences for all articles
 */
export async function getOutreachSequences(
  articles: ActorDatasets.ContentCrawlerItem[],
) {
  const response: OutreachSequence[] = [];

  for (const article of articles) {
    const sequence = await createOutreachSequence(article.text);

    response.push({
      sequence: sequence,
      articleUrl: article.url,
      title: article.metadata.title,
      description: article.metadata.description,
    });
  }

  return response;
}

/**
 * This function prepares outreach sequence for 1 article
 * Note: using langchain it mostly returned only 1 email sequence, instead of 3,
 * that's why openai package is used without any additional frameworks here.
 * Fix later
 */
async function createOutreachSequence(content: string) {
  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: CRAFT_MESSAGE_SEQUENCE },
      { role: "user", content: content },
    ],
    response_format: zodResponseFormat(AISequence, "event"),
  });

  return completion.choices[0].message.parsed as AISequenceType;
}
