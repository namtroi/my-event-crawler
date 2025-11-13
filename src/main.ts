// For more information, see https://crawlee.dev/
import { PlaywrightCrawler, ProxyConfiguration } from 'crawlee';
import { config } from 'dotenv';
import { router } from './routes.js';

// Load environment variables (e.g., DATABASE_URL)
config();

// These should be the "List" pages.
const requestsWithSiteData = [
  {
    url: 'https://asiasociety.org/new-york',
    userData: {
      siteName: 'asiaSociety', // Label for Asia Society
      label: 'DEFAULT', // Start with the list handler
    },
  },
  // {
  //   url: 'https://another-event-site.com/events',
  //   userData: {
  //     siteName: 'anotherSite', // Label for the other site
  //     label: 'DEFAULT',
  //   },
  // },
  // ... add more sites here
];

// Initialize the crawler
const crawler = new PlaywrightCrawler({
  // Use the router we defined
  requestHandler: router,

  // (Optional but Recommended)
  maxRequestsPerCrawl: 5,
  maxRequestsPerMinute: 5, // Be nice to their servers
  headless: false,
  launchContext: {
    launchOptions: {
      slowMo: 500,
    },
  },
});

// Run the crawler
console.log('Starting crawler...');
await crawler.run(requestsWithSiteData);
console.log('Crawler finished.');
