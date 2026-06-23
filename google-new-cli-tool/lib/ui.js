import prompts from 'prompts';
import pc from 'picocolors';
import open from 'open';
import { fetchTopStories, fetchTopic, fetchSearch, TOPICS } from './api.js';

/**
 * Print a stylish banner to the console
 * @param {string} subtitle 
 */
export function printHeader(subtitle = '') {
  console.log(pc.bold(pc.cyan('┌────────────────────────────────────────────────────────┐')));
  console.log(pc.bold(pc.cyan('│') + pc.bold(pc.yellow('                GOOGLE NEWS TERMINAL CLI                ')) + pc.bold(pc.cyan('│'))));
  if (subtitle) {
    const paddedSubtitle = subtitle.padEnd(54, ' ');
    console.log(pc.bold(pc.cyan('│') + pc.italic(pc.gray(`  ${paddedSubtitle}`)) + pc.bold(pc.cyan('│'))));
  } else {
    console.log(pc.bold(pc.cyan('│') + ' '.repeat(56) + pc.bold(pc.cyan('│'))));
  }
  console.log(pc.bold(pc.cyan('└────────────────────────────────────────────────────────┘')));
  console.log();
}

/**
 * Cleanly print a list of articles to the console (used for non-interactive commands)
 * @param {Array} articles 
 */
export function printArticleList(articles) {
  if (articles.length === 0) {
    console.log(pc.yellow('No articles found.'));
    return;
  }

  articles.forEach((art) => {
    console.log(
      `${pc.cyan(pc.bold(`[${art.index}]`))} ${pc.bold(pc.white(art.title))}`
    );
    console.log(
      `    ${pc.blue(art.source)} • ${pc.gray(art.relativeTime)}`
    );
    console.log();
  });
}

/**
 * Detailed view for an article, with options to open it in a browser or return
 * @param {object} article 
 */
async function showArticleDetails(article) {
  console.clear();
  printHeader('Article Details');

  console.log(pc.bold(pc.white(article.title)));
  console.log();
  console.log(`${pc.bold(pc.cyan('Source:'))}   ${pc.blue(article.source)}`);
  console.log(`${pc.bold(pc.cyan('Published:'))} ${pc.gray(article.pubDate)} (${article.relativeTime})`);
  console.log(`${pc.bold(pc.cyan('Link:'))}      ${pc.underline(pc.gray(article.link))}`);
  console.log();

  if (article.snippet) {
    console.log(pc.bold(pc.cyan('Snippet:')));
    console.log(pc.italic(pc.white(article.snippet)));
    console.log();
  }

  const response = await prompts({
    type: 'select',
    name: 'action',
    message: 'What would you like to do?',
    choices: [
      { title: '🌐 Open in Web Browser', value: 'open' },
      { title: '⬅️  Back to Article List', value: 'back' },
      { title: '🏠 Main Menu', value: 'menu' }
    ],
    initial: 0
  });

  if (response.action === 'open') {
    console.log(pc.green(`Opening article in your default browser...`));
    await open(article.link);
    // Keep showing details after opening so they can return
    return showArticleDetails(article);
  }

  return response.action;
}

/**
 * Displays a list of articles and allows the user to select one for a detailed view
 * @param {Array} articles 
 * @param {string} sourceName Name of the source/topic for header 
 * @returns {Promise<'menu' | 'back'>}
 */
async function browseArticlesList(articles, sourceName) {
  if (articles.length === 0) {
    console.log(pc.yellow('No articles found.'));
    await prompts({
      type: 'text',
      name: 'continue',
      message: 'Press Enter to return to Main Menu...'
    });
    return 'menu';
  }

  while (true) {
    console.clear();
    printHeader(`${sourceName} - Select an article to view details`);

    const choices = articles.map((art) => ({
      title: `${pc.bold(pc.white(art.title))} ${pc.gray(`(${art.source} • ${art.relativeTime})`)}`,
      value: art
    }));

    choices.push({
      title: pc.yellow('⬅️  Go Back to Main Menu'),
      value: 'back'
    });

    const response = await prompts({
      type: 'select',
      name: 'selection',
      message: 'Articles:',
      choices,
      initial: 0,
      warn: 'Please select an option'
    });

    // If user exits/presses Ctrl+C, go to main menu
    if (!response.selection) {
      return 'menu';
    }

    if (response.selection === 'back') {
      return 'back';
    }

    const action = await showArticleDetails(response.selection);
    if (action === 'menu') {
      return 'menu';
    }
    // If 'back', the loop continues and shows the list again
  }
}

/**
 * Interactive menu to browse categories/topics
 */
async function browseCategories() {
  while (true) {
    console.clear();
    printHeader('Browse by Category');

    const choices = Object.values(TOPICS).map((topic) => ({
      title: topic.name,
      value: topic.id
    }));

    choices.push({
      title: pc.yellow('⬅️  Back to Main Menu'),
      value: 'back'
    });

    const response = await prompts({
      type: 'select',
      name: 'topicId',
      message: 'Select a Category:',
      choices,
      initial: 0
    });

    if (!response.topicId || response.topicId === 'back') {
      return;
    }

    const topicName = TOPICS[response.topicId].name;
    console.clear();
    printHeader(`Fetching latest ${topicName} news...`);

    try {
      const articles = await fetchTopic(response.topicId, 20);
      const action = await browseArticlesList(articles, topicName);
      if (action === 'menu') {
        return; // Return to main menu
      }
    } catch (err) {
      console.log(pc.red(`Error: ${err.message}`));
      await prompts({
        type: 'text',
        name: 'continue',
        message: 'Press Enter to continue...'
      });
    }
  }
}

/**
 * Prompts user for a query and searches Google News
 */
async function searchNews() {
  console.clear();
  printHeader('Search Google News');

  const response = await prompts({
    type: 'text',
    name: 'query',
    message: 'Enter search keywords:',
    validate: (val) => val.trim().length > 0 ? true : 'Please enter a search term'
  });

  if (!response.query) {
    return;
  }

  const query = response.query.trim();
  console.clear();
  printHeader(`Searching for "${query}"...`);

  try {
    const articles = await fetchSearch(query, 20);
    await browseArticlesList(articles, `Search: "${query}"`);
  } catch (err) {
    console.log(pc.red(`Error: ${err.message}`));
    await prompts({
      type: 'text',
      name: 'continue',
      message: 'Press Enter to continue...'
    });
  }
}

/**
 * Main interactive loop
 */
export async function startInteractiveUI() {
  while (true) {
    console.clear();
    printHeader('Interactive Menu');

    const response = await prompts({
      type: 'select',
      name: 'menuOption',
      message: 'What would you like to read today?',
      choices: [
        { title: '🌟 Top Stories', value: 'top' },
        { title: '📂 Browse by Category', value: 'categories' },
        { title: '🔍 Search Google News', value: 'search' },
        { title: '❌ Exit', value: 'exit' }
      ],
      initial: 0
    });

    if (!response.menuOption || response.menuOption === 'exit') {
      console.log(pc.cyan('Goodbye! Thanks for using Google News CLI.'));
      break;
    }

    if (response.menuOption === 'top') {
      console.clear();
      printHeader('Fetching Top Stories...');
      try {
        const articles = await fetchTopStories(20);
        await browseArticlesList(articles, 'Top Stories');
      } catch (err) {
        console.log(pc.red(`Error: ${err.message}`));
        await prompts({
          type: 'text',
          name: 'continue',
          message: 'Press Enter to continue...'
        });
      }
    } else if (response.menuOption === 'categories') {
      await browseCategories();
    } else if (response.menuOption === 'search') {
      await searchNews();
    }
  }
}
