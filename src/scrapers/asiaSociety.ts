// src/scrapers/asiaSociety.ts
import { PlaywrightCrawlingContext } from 'crawlee';
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client.
// For large-scale projects, you might pass this client via context
// instead of creating a new instance in every scraper file.
const prisma = new PrismaClient();

function cleanAndTruncateText(
  rawText: string | null | undefined,
  maxSentences: number = 3
): string {
  if (!rawText) return '';

  const text = rawText.replace(/\s+/g, ' ').trim();
  const sentenceRegex = /[^.?!]+[.?!]+/g;
  const sentences = text.match(sentenceRegex);

  if (sentences) {
    return sentences.slice(0, maxSentences).join(' ').trim();
  }

  return text;
}

const countryKeywordMap = new Map([
  ['japan', 'Japan'],
  ['japanese', 'Japan'],
  ['korea', 'South Korea'],
  ['korean', 'South Korea'],
  ['north korea', 'North Korea'],
  ['dprk', 'North Korea'],
  ['china', 'China'],
  ['chinese', 'China'],
  ['taiwan', 'Taiwan'],
  ['taiwanese', 'Taiwan'],
  ['india', 'India'],
  ['indian', 'India'],
  ['vietnam', 'Vietnam'],
  ['vietnamese', 'Vietnam'],
  ['thailand', 'Thailand'],
  ['thai', 'Thailand'],
  ['philippines', 'Philippines'],
  ['filipino', 'Philippines'],
  ['indonesia', 'Indonesia'],
  ['indonesian', 'Indonesia'],
  ['pakistan', 'Pakistan'],
  ['pakistani', 'Pakistan'],
  ['bangladesh', 'Bangladesh'],
  ['bangladeshi', 'Bangladesh'],
  ['uzbekistan', 'Uzbekistan'],
  ['uzbek', 'Uzbekistan'],
  ['iran', 'Iran'],
  ['iranian', 'Iran'],
  ['persian', 'Iran'],
  ['mexico', 'Mexico'],
  ['mexican', 'Mexico'],
  ['canada', 'Canada'],
  ['canadian', 'Canada'],
]);

function getEventCountry(title: string, description: string): string {
  const defaultCountry = 'United States';

  const lowerTitle = title.toLowerCase();
  const lowerDescription = description.toLowerCase().replace(/<[^>]+>/g, ' ');

  for (const [keyword, country] of countryKeywordMap.entries()) {
    const regex = new RegExp(`\\b${keyword}\\b`);
    if (regex.test(lowerTitle)) {
      return country; // Found in title, high confidence
    }
  }

  // Priority 2: Check the Description
  for (const [keyword, country] of countryKeywordMap.entries()) {
    const regex = new RegExp(`\\b${keyword}\\b`);
    if (regex.test(lowerDescription)) {
      return country; // Found in description
    }
  }

  // Priority 3: Default
  return defaultCountry;
}

function classifyEvent(title: string, description: string): string {
  const categories = ['Food', 'Games', 'Customs', 'Rituals', 'Media'];
  const keywordsMap = {
    Food: [
      'food',
      'cuisine',
      'culinary',
      'tasting',
      'recipe',
      'kitchen',
      'dining',
      'eat',
      'beverage',
      'drink',
      'wine',
      'feast',
      'restaurant',
      'chef',
      'taste',
    ],
    Games: [
      'game',
      'gaming',
      'play',
      'tournament',
      'competition',
      'board game',
      'video game',
      'esports',
      'match',
      'player',
    ],
    Customs: [
      'custom',
      'tradition',
      'traditional',
      'heritage',
      'cultural',
      'folklore',
      'social',
      'etiquette',
      'lifestyle',
      'clothing',
      'attire',
      'craft',
      'daily life',
    ],
    Rituals: [
      'ritual',
      'ceremony',
      'ceremonial',
      'rite',
      'religious',
      'spiritual',
      'worship',
      'prayer',
      'shrine',
      'temple',
      'offering',
      'meditation',
      'holy',
    ],
    Media: [
      'media',
      'film',
      'movie',
      'documentary',
      'screening',
      'broadcast',
      'journalism',
      'art',
      'artist',
      'exhibition',
      'performance',
      'music',
      'concert',
      'dance',
      'theater',
      'author',
      'book',
      'reading',
      'gallery',
    ],
  };

  const scores = new Map<string, number>();
  categories.forEach((cat) => scores.set(cat, 0));

  const lowerTitle = title.toLowerCase();
  const lowerDescription = description.toLowerCase();

  for (const [category, keywords] of Object.entries(keywordsMap)) {
    let categoryScore = 0;

    for (const keyword of keywords) {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');

      // Give more weight to title matches
      if (lowerTitle.match(regex)) {
        categoryScore += 3; // 3 points for a title match
      }
      if (lowerDescription.match(regex)) {
        categoryScore += 1; // 1 point for a description match
      }
    }
    scores.set(category, categoryScore);
  }

  // Find the category with the highest score
  let bestCategory = 'Uncategorized'; // Default
  let maxScore = 0;

  for (const [category, score] of scores.entries()) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  // If no keywords matched (score 0), keep it as 'Uncategorized'
  if (maxScore === 0) {
    return 'Uncategorized';
  }

  return bestCategory;
}

/**
 * Handles the "List" page for Asia Society.
 * Its job is to find links to specific events and enqueue them.
 */
export async function handleAsiaSocietyList({
  page,
  enqueueLinks,
  log,
}: PlaywrightCrawlingContext) {
  log.info(`[asiaSociety LIST]: Processing ${page.url()}`);

  // TODO: *** CHANGE THIS SELECTOR ***
  const eventCardSelector = 'h4.card-title > a';

  try {
    // Wait for the event cards to be visible
    await page.waitForSelector(eventCardSelector, { timeout: 15000 });

    // Find all links that match the selector AND the glob pattern
    await enqueueLinks({
      selector: eventCardSelector,
      label: 'DETAIL', // Send to the DETAIL handler
      globs: [
        // This is the key: Only allow URLs that match this pattern
        'https://asiasociety.org/new-york/events/*',
      ],
      // CRITICAL: Pass metadata to the next request
      userData: {
        siteName: 'asiaSociety', // Identify the site
        label: 'DETAIL', // Identify the handler for the router
      },
    });

    log.info(`[asiaSociety LIST]: Found and enqueued links from ${page.url()}`);
  } catch (error) {
    log.error(
      `[asiaSociety LIST]: No event links found on ${page.url()}. Check selector '${eventCardSelector}'.`,
      { error }
    );
  }
}

export async function handleAsiaSocietyDetail({
  page,
  request,
  log,
}: PlaywrightCrawlingContext) {
  if (!request.loadedUrl) {
    log.error(
      `[asiaSociety DETAIL]: Request object has no loadedUrl. Cannot process.`
    );
    return; // Exit the function early
  }
  log.info(`[asiaSociety DETAIL]: Scraping ${request.loadedUrl}`);

  // Base URL for constructing absolute image links
  const siteUrl = 'https://asiasociety.org';

  try {
    const title = await page
      .locator('article.node--type-event h1')
      .textContent();

    const rawDescription = await page
      .locator('article.node--type-event div.body > div')
      .innerText();

    const address = await page
      .locator('div.event-details-wdgt div.address > div')
      .textContent();

    // The date and time are in separate nodes.
    const datePart = await page
      .locator('div.event-details-wdgt div.date')
      .textContent(); // Gets "Sat 15 Nov 2025"

    // The time is a loose text node after the div.date, so we use evaluate
    const timePart = await page
      .locator('div.event-details-wdgt')
      .evaluate((el) => {
        const dateNode = el.querySelector('div.date'); // Check if the next sibling is a text node (nodeType 3)
        if (
          dateNode &&
          dateNode.nextSibling &&
          dateNode.nextSibling.nodeType === Node.TEXT_NODE
        ) {
          return dateNode.nextSibling.textContent?.trim(); // Gets "2 - 2:45 p.m."
        }
        return null;
      });

    // Combine into a full date-time string
    const dateString = `${datePart} ${timePart || ''}`.trim(); // e.g., "Sat 15 Nov 2025 2 - 2:45 p.m." // 5. Image (Get relative path)

    const relativeImage = await page
      .locator('article.node--type-event div.image img')
      .getAttribute('src');

    // Combine into an absolute URL
    const image = relativeImage ? `${siteUrl}${relativeImage}` : null;

    const price = await page.locator('div.ticket-price > div').textContent();

    if (!title) {
      log.warning(
        `[asiaSociety DETAIL]: No title found at ${request.loadedUrl}. Skipping save.`
      );
      return;
    }

    const description = cleanAndTruncateText(rawDescription, 3);

    const city = 'New York'; // We know this from the URL pattern
    const country = getEventCountry(title || '', description || '');
    const category = classifyEvent(title || '', description || '');

    await prisma.events_crawler.upsert({
      where: {
        website_url: request.loadedUrl, // Unique key
      },
      update: {
        // What to update if it already exists
        event_title: title.trim(),
        event_city: city,
        address: address?.replace(/\s+/g, ' ').trim(), // Clean up whitespace
        description: description?.trim(),
        image: image,
        ticket_price: price?.trim(),
        country: country,
        category: category, // event_datetime: parsedDate,
        // raw_date_string: dateString, // Good to save the original string
        updated_at: new Date(), // Manually set updated_at
      },
      create: {
        // What to create if it's new
        website_url: request.loadedUrl,
        event_title: title.trim(),
        event_city: city,
        address: address?.replace(/\s+/g, ' ').trim(), // Clean up whitespace
        description: description?.trim(),
        image: image,
        ticket_price: price?.trim(),
        country: country,
        category: category, // event_datetime: parsedDate,
      },
    });

    log.info(`[asiaSociety SUCCESS]: Saved event: ${title.trim()}`);
  } catch (error) {
    if (error instanceof Error) {
      log.error(
        `[asiaSociety DETAIL]: Failed to scrape ${request.loadedUrl}: ${error.message}`
      );
    } else {
      // Handle cases where a non-Error object was thrown
      log.error(
        `[asiaSociety DETAIL]: Failed to scrape ${
          request.loadedUrl
        }. Unknown error: ${String(error)}`
      );
    }
  }
}
