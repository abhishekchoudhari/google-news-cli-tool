import Parser from 'rss-parser';

const parser = new Parser();

// Supported Google News standard topics
export const TOPICS = {
  WORLD: { id: 'WORLD', name: 'World' },
  NATION: { id: 'NATION', name: 'Nation' },
  BUSINESS: { id: 'BUSINESS', name: 'Business' },
  TECHNOLOGY: { id: 'TECHNOLOGY', name: 'Technology' },
  ENTERTAINMENT: { id: 'ENTERTAINMENT', name: 'Entertainment' },
  SPORTS: { id: 'SPORTS', name: 'Sports' },
  SCIENCE: { id: 'SCIENCE', name: 'Science' },
  HEALTH: { id: 'HEALTH', name: 'Health' }
};

/**
 * Parses the Google News title to separate the actual title from the publisher/source.
 * Google News titles are typically in the format: "Article Title - Publisher Name"
 * @param {string} rawTitle 
 * @returns {{ title: string, source: string }}
 */
function parseTitleAndSource(rawTitle) {
  if (!rawTitle) return { title: 'No Title', source: 'Unknown Source' };
  
  const lastDashIndex = rawTitle.lastIndexOf(' - ');
  if (lastDashIndex !== -1) {
    const source = rawTitle.slice(lastDashIndex + 3).trim();
    const title = rawTitle.slice(0, lastDashIndex).trim();
    return { title, source };
  }
  
  return { title: rawTitle, source: 'Google News' };
}

/**
 * Calculates a relative time string (e.g. "2 hours ago", "3 days ago")
 * @param {string} dateString 
 * @returns {string}
 */
function formatRelativeTime(dateString) {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  } catch (e) {
    return dateString;
  }
}

/**
 * Processes feed items into a standard structure.
 * @param {Array} items 
 * @param {number} limit 
 * @returns {Array}
 */
function processFeedItems(items = [], limit = 10) {
  return items.slice(0, limit).map((item, index) => {
    const { title, source } = parseTitleAndSource(item.title);
    return {
      index: index + 1,
      title,
      source,
      link: item.link,
      pubDate: item.pubDate,
      relativeTime: formatRelativeTime(item.pubDate),
      snippet: item.contentSnippet || ''
    };
  });
}

/**
 * Fetches the Google News feed from the given URL.
 * @param {string} url 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function fetchFeed(url, limit) {
  try {
    const feed = await parser.parseURL(url);
    return processFeedItems(feed.items, limit);
  } catch (error) {
    throw new Error(`Failed to fetch news from Google: ${error.message}`);
  }
}

/**
 * Fetch top stories from Google News
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function fetchTopStories(limit = 10) {
  const url = 'https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en';
  return fetchFeed(url, limit);
}

/**
 * Fetch category specific news from Google News
 * @param {string} topicId 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function fetchTopic(topicId, limit = 10) {
  const normalizedTopic = topicId.toUpperCase();
  if (!TOPICS[normalizedTopic]) {
    throw new Error(`Invalid topic "${topicId}". Supported topics: ${Object.keys(TOPICS).join(', ')}`);
  }
  const url = `https://news.google.com/rss/headlines/section/topic/${TOPICS[normalizedTopic].id}?hl=en-US&gl=US&ceid=US:en`;
  return fetchFeed(url, limit);
}

/**
 * Fetch search query news from Google News
 * @param {string} query 
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
export async function fetchSearch(query, limit = 10) {
  const encodedQuery = encodeURIComponent(query);
  const url = `https://news.google.com/rss/search?q=${encodedQuery}&hl=en-US&gl=US&ceid=US:en`;
  return fetchFeed(url, limit);
}
