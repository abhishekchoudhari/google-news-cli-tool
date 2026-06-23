# Google News CLI Tool

A beautiful, interactive command-line tool written in Node.js to fetch, search, and browse the latest Google News articles. 

This tool fetches articles from Google News RSS feeds, format them nicely with publisher details and relative timestamps, and provides both an interactive terminal interface and direct execution modes (including JSON support).

---

## Features

- **Interactive TUI**: Navigate top stories, browse by category, and search keywords using keyboard arrow keys.
- **Auto-Browser Launch**: Select an article to view details, and open it instantly in your system's default browser.
- **Formatted Output**: Automatically parses titles to isolate publisher names, formats publication dates relatively (e.g. `2h ago`), and prints beautiful borders.
- **Direct CLI Execution**: Fetch specific topics or search queries directly from your shell without launching the interactive menu.
- **Scripting & Pipes**: Supports `--json` flag to export raw JSON output for easy command-line piping and integration.

---

## Quick Start

### 1. Installation
Navigate to the tool directory:
```bash
cd google-new-cli-tool
```

Install dependencies:
```bash
npm install
```

### 2. Global Shell Execution (Recommended)
Link the tool globally to run it from anywhere in your terminal:
```bash
npm link
```
Now, you can execute the command `google-news` directly in any shell window!

---

## Usage

### Interactive Mode
Run the tool with no arguments to enter the interactive console browser:
```bash
google-news
```

### Direct CLI Commands
Retrieve news instantly or pipe them to other commands using standard flags:

```bash
# Print top 5 news stories
google-news --limit 5

# Get the latest technology news
google-news --topic technology

# Search Google News for a specific topic
google-news --search "artificial intelligence"

# Get technology news as raw JSON
google-news --topic technology --json
```

### Supported Topics
You can browse news in the following categories:
- `world`
- `nation`
- `business`
- `technology`
- `entertainment`
- `sports`
- `science`
- `health`

---

## License

MIT
