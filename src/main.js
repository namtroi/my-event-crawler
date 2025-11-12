// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import { router } from './routes.js';

const startUrls = ['https://crawlee.dev'];

const testDetailUrl = {
  url: 'https://crawlee.dev',
  label: 'DETAIL',
};

const crawler = new PlaywrightCrawler({
  // proxyConfiguration: new ProxyConfiguration({ proxyUrls: ['...'] }),
  headless: false,
  requestHandler: router,
  // Comment this option to scrape the full website.
  maxRequestsPerCrawl: 5,
  maxRequestsPerMinute: 10,
});

await crawler.run([testDetailUrl]);
