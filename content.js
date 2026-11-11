// Content script to extract links from the current page

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getLinks') {
    const links = [];
    const anchorElements = document.querySelectorAll('a[href]');

    anchorElements.forEach((anchor, index) => {
      const href = anchor.href;
      const text = anchor.textContent.trim() || anchor.getAttribute('aria-label') || '';
      const title = anchor.getAttribute('title') || '';

      // Combine all searchable text
      const searchableText = [href, text, title].join(' ').toLowerCase();

      links.push({
        url: href,
        text: text || href,
        searchableText: searchableText,
        index: index
      });
    });

    sendResponse({ links: links });
  }

  return true; // Keep the message channel open for async response
});
