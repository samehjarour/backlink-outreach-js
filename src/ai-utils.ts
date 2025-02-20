import { ChatPromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { CRAFT_MESSAGE_SEQUENCE, FILTER_LINKS_PROMPT } from "./prompts.js";
import { JsonOutputParser } from "@langchain/core/output_parsers";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

const openai = new OpenAI({
  apiKey:
    "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",
});

const model = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
  apiKey:
    "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",
});

const claude = new ChatAnthropic({
  model: "claude-3-5-sonnet-20241022",
  temperature: 0,
  apiKey:
    "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",
});

const Url = z.object({
  urls: z.array(z.string()),
});

const MessageSchema = z.object({
  subject: z.string(),
  preview: z.string(),
  text: z.string(),
});

const Sequence = z.object({
  email: z.array(MessageSchema),
  twitter: z.array(MessageSchema),
  linkedIn: z.array(MessageSchema),
});

export async function getPotentialBacklinks(
  preparedArticlesUrl: { url: string }[],
  excludeDomains = [],
) {
  const res = await Promise.all(
    preparedArticlesUrl.map((item) =>
      getFilteredBacklinksForKeyword(item, excludeDomains),
    ),
  );
  return res.flat();
}

async function getFilteredBacklinksForKeyword(articleUrls, excludeDomains) {
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

export async function getOutreachSequences(articles: object[], options = {}) {
  const response = [];

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

async function createOutreachSequence(content) {
  const completion = await openai.beta.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: CRAFT_MESSAGE_SEQUENCE },
      { role: "user", content: content },
    ],
    response_format: zodResponseFormat(Sequence, "event"),
  });

  return completion.choices[0].message.parsed;
}
