## Link Building Agent

The Link Building Agent is an automated agent designed to automate link-building efforts, a key component of building an SEO profile. It helps you position your website on keywords or search terms that are driving traffic or conversions (e.g., best email validation tool, best CRM for small businesses).

---

### It does the following:

- **Keyword Search:**  
  Identify potential backlink partners via SERP results on keywords or search terms.

- **Filter & Analyze opportunities:**
  Assess their relevance (filter out direct competitors).

- **Extract contact details:**  
  Extract contact details from shortlisted pages or domains.

- **Generate personalized outreach:**  
  Generate personalized outreach messages on email, Linkedin, Twitter, Facebook based on the Markdown of the targeted pages, with instructions on required anchor text or keywords.

**You can then integrate this output to any messaging platform or automation tool via Make, n8n, or to ingest it as key properties into your CRMs like Hubspot, Salesforce, or Attio.**

---

### Input

Set your parameters using a simple JSON format. For example:

```json
{
  "keywords": [
    "Google maps scraper",
    "Top best google maps scrapers"
  ],
  "businessName": "Apify",
  "shortBusinessDescription": "Apify is the largest ecosystem where developers build, deploy, and publish data extraction and web automation tools. We call them Actors.",
  "name": "Dan",
  "excludeDomains": [
    "somescraper.com"
  ]
}
```

- **keywords:** Keywords: These are the keywords or search terms that you want to target. This should be part of your SEO strategy, so keywords or search terms that are driving quality traffic and conversions to your website. Check out Ahrefs or Similarweb for more information, or use your CRM to determine the best keywords or search terms to target.
- **businessName:** Your company or project name.
- **shortBusinessDescription:** A brief description of your business.
- **name:** Your name or contact person.
- **excludeDomains:** Domains to skip in the search.

---

### Output

Here is a sample of the Output in JSON which you can use on marketing automation tools like Instantly or Hubspot:


- **Article Details:** URL, title, and description.
- **Contacts:** Email addresses and social media links.
- **Message Sequence:** Ready-to-use outreach messages for each communication channel consisting of 3 messages (1 message + 2 follow ups).

For example:

```json
{
  "articleUrl": "https://example.com/backlink-opportunity",
  "description": "Article meta description.",
  "title": "Backlink Opportunity - Example Article",
  "emails": ["contact@example.com"],
  "facebooks": ["https://facebook.com/exampleprofile"],
  "linkedIns": ["https://linkedin.com/in/exampleprofile"],
  "twitters": ["https://twitter.com/exampleprofile"],
  "sequence": {
    "email": [
      {
        "subject": "Potential Collaboration: Best Google Search Scrapers and APIs",
        "preview": "Hi, sharing insights on valuable Google SERP tools!",
        "text": "Hi,\n\nI hope this message finds you well! I recently came across your platform and I thought your audience could benefit from my article comparing 15+ Google Search Scrapers and APIs for 2024. It covers practical use cases and insights that can enhance their data extraction processes.\n\nIf you find the content relevant, I would greatly appreciate a backlink in your resource section or an article mentioning this comparison.\n\nLooking forward to hearing from you!\n\nBest, \n[Your Name]"
      },
      {
        "subject": "Following Up: Collaboration on Google Search Scrapers",
        "preview": "Hi, just checking in on our last message!",
        "text": "Hi,\n\nI wanted to follow up on my previous email regarding the article on Google Search Scrapers and APIs. I believe this could offer great value to your readers looking for efficient data extraction methods. \n\nIf you have any questions or need more information, feel free to let me know. I’d be excited to collaborate with you.\n\nThanks for your time!\n\nBest, \n[Your Name]"
      },
      {
        "subject": "Last Chance to Enhance Your Resource Section!",
        "preview": "Hi, don’t miss this opportunity!",
        "text": "Hi,  \n\nI wanted to reach out one last time regarding my article on the best Google Search Scrapers and APIs. This content could be a great addition to your resource section, especially for readers interested in efficient data extraction techniques.\n\nIf interested, please let me know by the end of the week. I appreciate your consideration!\n\nWarm regards,  \n[Your Name]"
      }
    ],
    "twitter": [
      {
        "subject": "Collaboration Opportunity!",
        "preview": "Check out this valuable resource on Google SERP tools!",
        "text": "Hi! I recently published a comprehensive guide on the best Google Search Scrapers and APIs for 2024. It can help your audience with efficient data extraction from SERPs. If interested, let’s discuss a backlink opportunity that benefits both of us!"
      },
      {
        "subject": "Friendly Reminder!",
        "preview": "Touching base on my previous message!",
        "text": "Hey, just checking in! I reached out about my article comparing 15+ Google Search Scrapers and APIs. It’s packed with insights and use cases that your readers may find beneficial. Would love to hear if you're interested in linking to it!"
      },
      {
        "subject": "Final Reminder!",
        "preview": "Wrapping up my outreach campaign!",
        "text": "Hi, this is my final outreach regarding my article on Google Search Scrapers and APIs. If this resonates with your audience, I’d love a chance to connect and discuss potential collaboration before the end of the week! Thanks for considering!"
      }
    ],
    "linkedIn": [
      {
        "subject": "Exciting Collaboration Ahead!",
        "preview": "Explore our shared interest in data extraction tools.",
        "text": "Hi,\n\nI came across your profile and thought your audience would benefit from my recent article on the best Google Search Scrapers and APIs available in 2024. It dives deep into the advantages and use cases that could enhance their data extraction efforts.\n\nWould you be open to discussing a potential backlink to this resource? I’d love to partner up!"
      },
      {
        "subject": "Checking In!",
        "preview": "Curious if you had a chance to review my email.",
        "text": "Hello, \n\nI hope you are doing well! I wanted to follow up on my previous message about my article on Google Search Scrapers and APIs. This could be a valuable resource for your audience, and I’d appreciate your thoughts on possible collaboration!\n\nLooking forward to your reply!"
      },
      {
        "subject": "Last Chance for Collaboration!",
        "preview": "Don’t miss out on this valuable resource!",
        "text": "Hi, \n\nI wanted to reach out one final time about my article on the best Google Search Scrapers and APIs. If you think this could benefit your readers, I’d love to discuss linking opportunities!\n\nLet me know by the end of the week—thank you!"
      }
    ]
  }
}
```

---

### Tips for Best Results

- **Run Regularly:** Check for new opportunities on a regular basis.
- **Refine Your Keywords:** Experiment with different keywords to target the right audience.
- **Update Exclusions:** Keep your exclusion list current to avoid unwanted sites. Update it regularly. This will greatly improve filtering of potential opportunities!
- **Integrate and customize:** You can then integrate this output to any messaging platform or automation tool via Make, n8n, or to ingest it as key properties into your CRMs like Hubspot, Salesforce, or Attio.

Let our AI-powered outreach handle the communication so you can focus on what really matters—growing your business and building meaningful partnerships.
