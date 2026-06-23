#!/usr/bin/env node

import { Command } from 'commander';
import pc from 'picocolors';
import { fetchTopStories, fetchTopic, fetchSearch, TOPICS } from '../lib/api.js';
import { printHeader, printArticleList, startInteractiveUI } from '../lib/ui.js';

const program = new Command();

program
  .name('google-news')
  .description('A beautiful, interactive command-line tool to fetch the latest Google News.')
  .version('1.0.0')
  .option('-t, --topic <topic>', `browse a category (${Object.keys(TOPICS).map(t => t.toLowerCase()).join(', ')})`)
  .option('-s, --search <query>', 'search Google News for a specific query')
  .option('-l, --limit <number>', 'limit the number of articles to retrieve', '10')
  .option('-j, --json', 'output raw JSON instead of styled console text')
  .addHelpText('after', `
Examples:
  $ google-news                      # Start interactive mode
  $ google-news -l 5                 # Print top 5 stories
  $ google-news -t technology        # Print latest technology news
  $ google-news -s "node.js api"     # Search for "node.js api"
  $ google-news -t business -j       # Get business news as raw JSON
`);

program.parse(process.argv);
const options = program.opts();

// If no arguments/options are provided, run interactive mode
if (process.argv.length <= 2) {
  startInteractiveUI().catch((err) => {
    console.error(pc.red(`Fatal Error: ${err.message}`));
    process.exit(1);
  });
} else {
  // Direct CLI command mode
  runDirectCLI().catch((err) => {
    console.error(pc.red(`Error: ${err.message}`));
    process.exit(1);
  });
}

async function runDirectCLI() {
  const limit = parseInt(options.limit, 10);
  if (isNaN(limit) || limit <= 0) {
    console.error(pc.red('Error: Limit must be a positive integer.'));
    process.exit(1);
  }

  if (options.topic && options.search) {
    console.error(pc.red('Error: Please specify either --topic OR --search, not both.'));
    process.exit(1);
  }

  let articles = [];
  let headerTitle = 'Top Stories';

  if (options.search) {
    headerTitle = `Search: "${options.search}"`;
    articles = await fetchSearch(options.search, limit);
  } else if (options.topic) {
    const topicUpper = options.topic.toUpperCase();
    if (!TOPICS[topicUpper]) {
      console.error(pc.red(`Error: Invalid topic "${options.topic}".`));
      console.error(pc.yellow(`Supported topics: ${Object.keys(TOPICS).map(t => t.toLowerCase()).join(', ')}`));
      process.exit(1);
    }
    headerTitle = TOPICS[topicUpper].name;
    articles = await fetchTopic(options.topic, limit);
  } else {
    articles = await fetchTopStories(limit);
  }

  if (options.json) {
    // Output JSON cleanly for piping
    console.log(JSON.stringify(articles, null, 2));
  } else {
    // Output styled text for terminal
    printHeader(`${headerTitle} (Showing ${articles.length})`);
    printArticleList(articles);
  }
}
