import { ChatOpenAI } from "@langchain/openai";
import { CRAFT_MESSAGE_SEQUENCE, FILTER_LINKS_PROMPT } from "./prompts.js";

import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";

import OpenAI from "openai";
import { z } from "zod";
import { zodResponseFormat } from "openai/helpers/zod";

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
