export namespace ActorDatasets {
  export type GoogleScraperDataset = GoogleScraperItem[];
  export type GoogleScraperItem = {
    organicResults: OrganicResultItem[];
  };
  export type OrganicResultItem = {
    title: string;
    url: string;
    description: string;
    type: "organic";
  };

  export type ContactDetailDataset = ContactDetailItem[];
  export type ContactDetailItem = {
    domain: string;
    facebooks: string[];
    instagrams: string[];
    linkedIns: string[];
    emails: string[];
    twitters: string[];
    url: string;
    originalStartUrl: string;
  };

  export type ContentCrawlerDataset = ContentCrawlerItem[];
  export type ContentCrawlerItem = {
    url: string;
    metadata: {
      title: string;
      description: string;
    };
    text: string;
  };
}

export type ActorInput = {
  keywords: string[];
  businessName: string;
  shortBusinessDescription: string;
  name: string;
  excludeDomains: [];
};
