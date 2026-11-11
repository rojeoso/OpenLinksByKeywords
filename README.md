# Open Links by Keywords - Chrome Extension

A Chrome extension that searches for links on the current page using keywords with AND/OR logic and opens them in new tabs or windows.

## Features

- Search for links containing specific keywords
- Use AND/OR logic for complex searches
- Support for exact phrase matching with quotes
- Display matching links in a list
- Open all matched links as tabs or in separate windows
- Visual feedback with green checkmarks as links are opened

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right corner
3. Click "Load unpacked"
4. Select the `OpenLinksByKeywords` folder
5. The extension icon should appear in your browser toolbar

## Usage

1. Click the extension icon in your browser toolbar
2. Enter keywords using the following syntax:
   - Single keyword: `github`
   - AND logic: `github AND repository`
   - OR logic: `github OR gitlab`
   - Exact phrases: `"pull request"`
   - Combined: `"github" AND "repository" OR "docs"`
3. Click "Search Links" to find matching links
4. Choose whether to open links as "Tabs" or "Windows"
5. Click "Open All Links" to open them all
6. Watch as green checkmarks appear next to each successfully opened link

## Keyword Search Examples

- `github` - Find all links containing "github"
- `github AND repository` - Find links containing both "github" and "repository"
- `github OR gitlab` - Find links containing either "github" or "gitlab"
- `"pull request"` - Find links containing the exact phrase "pull request"
- `github AND "pull request" OR documentation` - Complex query

## Files

- `manifest.json` - Extension configuration
- `popup.html` - Extension popup interface
- `popup.css` - Styling for the popup
- `popup.js` - Main logic for searching and opening links
- `content.js` - Content script to extract links from pages
- `icon16.png`, `icon48.png`, `icon128.png` - Extension icons (need to be created)

## Notes

- You need to create icon files (icon16.png, icon48.png, icon128.png) or the extension will show warnings
- The extension requires permission to access the current tab and create new tabs/windows
- Links are opened with a small delay (100ms) to avoid overwhelming the browser

## Permissions

- `activeTab` - Access the current tab to extract links
- `scripting` - Inject content script to read page links
- `tabs` - Create new tabs and windows
