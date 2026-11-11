// Popup script for the Open Links by Keywords extension

let allLinks = [];
let filteredLinks = [];
let searchHistory = [];

// DOM elements
const keywordsInput = document.getElementById('keywords');
const searchBtn = document.getElementById('searchBtn');
const resultsSection = document.getElementById('resultsSection');
const linksList = document.getElementById('linksList');
const linkCount = document.getElementById('linkCount');
const openAllBtn = document.getElementById('openAllBtn');
const noResults = document.getElementById('noResults');
const selectAllBtn = document.getElementById('selectAllBtn');
const deselectAllBtn = document.getElementById('deselectAllBtn');
const historySection = document.getElementById('historySection');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

// Event listeners
searchBtn.addEventListener('click', searchLinks);
keywordsInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    searchLinks();
  }
});
openAllBtn.addEventListener('click', openAllLinks);
selectAllBtn.addEventListener('click', selectAll);
deselectAllBtn.addEventListener('click', deselectAll);
clearHistoryBtn.addEventListener('click', clearHistory);

// Initialize: Load search history when popup opens
loadSearchHistory();

// Search for links based on keywords
async function searchLinks() {
  const keywords = keywordsInput.value.trim();

  if (!keywords) {
    alert('Please enter keywords to search');
    return;
  }

  // Add to search history
  addToSearchHistory(keywords);

  // Get all links from the current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Try to send message, and if it fails, inject the content script first
  chrome.tabs.sendMessage(tab.id, { action: 'getLinks' }, async (response) => {
    if (chrome.runtime.lastError) {
      // Content script not loaded, try to inject it
      try {
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js']
        });

        // Wait a bit for the script to load
        setTimeout(() => {
          // Try again after injection
          chrome.tabs.sendMessage(tab.id, { action: 'getLinks' }, (response) => {
            if (chrome.runtime.lastError) {
              console.error('Error:', chrome.runtime.lastError);
              alert('Error accessing the page. Please refresh the page and try again.');
              return;
            }

            allLinks = response.links;
            filteredLinks = filterLinks(allLinks, keywords);
            displayResults(filteredLinks);
          });
        }, 100);
      } catch (error) {
        console.error('Error injecting content script:', error);
        alert('Cannot access this page. Chrome extensions cannot run on chrome:// or chrome-extension:// pages.');
      }
      return;
    }

    allLinks = response.links;
    filteredLinks = filterLinks(allLinks, keywords);

    displayResults(filteredLinks);
  });
}

// Filter links based on keyword logic (AND/OR with exact phrases)
function filterLinks(links, keywordsString) {
  const parsed = parseKeywords(keywordsString);

  return links.filter(link => {
    return evaluateExpression(link.searchableText, parsed);
  });
}

// Parse keywords with AND/OR logic and exact phrases
function parseKeywords(keywordsString) {
  // Extract exact phrases (in quotes) and replace with placeholders
  const phrases = [];
  let processedString = keywordsString.replace(/"([^"]+)"/g, (match, phrase) => {
    phrases.push(phrase.toLowerCase());
    return `__PHRASE_${phrases.length - 1}__`;
  });

  // Split by OR first (lower precedence)
  const orParts = processedString.split(/\s+OR\s+/i);

  return {
    type: 'OR',
    parts: orParts.map(orPart => {
      // Split by AND (higher precedence)
      const andParts = orPart.trim().split(/\s+AND\s+/i);
      return {
        type: 'AND',
        terms: andParts.map(term => {
          term = term.trim();
          // Check if this is a phrase placeholder
          const phraseMatch = term.match(/__PHRASE_(\d+)__/);
          if (phraseMatch) {
            return {
              type: 'phrase',
              value: phrases[parseInt(phraseMatch[1])]
            };
          } else {
            return {
              type: 'word',
              value: term.toLowerCase()
            };
          }
        })
      };
    })
  };
}

// Evaluate the parsed expression against the text
function evaluateExpression(text, expression) {
  if (expression.type === 'OR') {
    // At least one OR part must match
    return expression.parts.some(andPart => {
      // All AND terms must match
      return andPart.terms.every(term => {
        if (term.type === 'phrase') {
          return text.includes(term.value);
        } else if (term.type === 'word') {
          return text.includes(term.value);
        }
        return false;
      });
    });
  }
  return false;
}

// Display filtered results
function displayResults(links) {
  linksList.innerHTML = '';

  if (links.length === 0) {
    resultsSection.style.display = 'none';
    noResults.style.display = 'block';
    return;
  }

  resultsSection.style.display = 'block';
  noResults.style.display = 'none';
  linkCount.textContent = links.length;

  links.forEach((link, index) => {
    const linkItem = document.createElement('div');
    linkItem.className = 'link-item';
    linkItem.dataset.index = index;

    // Delete icon (trash)
    const deleteIcon = document.createElement('div');
    deleteIcon.className = 'delete-icon';
    deleteIcon.innerHTML = '🗑️';
    deleteIcon.title = 'Delete this link';
    deleteIcon.addEventListener('click', () => deleteLink(index));

    // Checkbox
    const checkbox = document.createElement('div');
    checkbox.className = 'link-checkbox selected'; // Selected by default
    checkbox.dataset.url = link.url;
    checkbox.dataset.selected = 'true'; // Track selection state
    checkbox.addEventListener('click', toggleCheckbox);

    const linkText = document.createElement('div');
    linkText.className = 'link-text';
    linkText.textContent = link.url;
    linkText.title = link.url;

    linkItem.appendChild(deleteIcon);
    linkItem.appendChild(checkbox);
    linkItem.appendChild(linkText);
    linksList.appendChild(linkItem);
  });

  // Enable the Open All Links button
  openAllBtn.disabled = false;
}

// Toggle checkbox selection
function toggleCheckbox(event) {
  const checkbox = event.target;
  const isSelected = checkbox.dataset.selected === 'true';

  if (isSelected) {
    checkbox.classList.remove('selected');
    checkbox.dataset.selected = 'false';
  } else {
    checkbox.classList.add('selected');
    checkbox.dataset.selected = 'true';
  }
}

// Select all checkboxes
function selectAll() {
  const checkboxes = document.querySelectorAll('.link-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.classList.add('selected');
    checkbox.dataset.selected = 'true';
  });
}

// Deselect all checkboxes
function deselectAll() {
  const checkboxes = document.querySelectorAll('.link-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.classList.remove('selected');
    checkbox.dataset.selected = 'false';
  });
}

// Delete a link from the filtered list
function deleteLink(index) {
  // Remove from filteredLinks array
  filteredLinks.splice(index, 1);

  // Re-display the results
  displayResults(filteredLinks);
}

// Open selected links only
async function openAllLinks() {
  const openAs = document.querySelector('input[name="openAs"]:checked').value;
  const checkboxes = document.querySelectorAll('.link-checkbox');

  // Get only the selected links
  const selectedLinks = [];
  const selectedCheckboxes = [];

  checkboxes.forEach((checkbox, index) => {
    if (checkbox.dataset.selected === 'true') {
      selectedLinks.push(filteredLinks[index]);
      selectedCheckboxes.push(checkbox);
    }
  });

  if (selectedLinks.length === 0) {
    alert('Please select at least one link to open');
    return;
  }

  openAllBtn.disabled = true;
  openAllBtn.textContent = 'Opening...';

  for (let i = 0; i < selectedLinks.length; i++) {
    const link = selectedLinks[i];
    const checkbox = selectedCheckboxes[i];

    try {
      if (openAs === 'windows') {
        await chrome.windows.create({ url: link.url });
      } else {
        await chrome.tabs.create({ url: link.url, active: false });
      }

      // Mark as opened with green check
      checkbox.classList.remove('selected');
      checkbox.classList.add('opened');

      // Small delay to avoid overwhelming the browser
      await sleep(100);
    } catch (error) {
      console.error('Error opening link:', link.url, error);
    }
  }

  openAllBtn.textContent = 'Links Opened!';
  setTimeout(() => {
    openAllBtn.textContent = 'Open Selected Links';
    openAllBtn.disabled = false;
  }, 2000);
}

// Utility function for delay
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Load search history from storage
async function loadSearchHistory() {
  try {
    const result = await chrome.storage.local.get(['searchHistory']);
    searchHistory = result.searchHistory || [];
    displaySearchHistory();
  } catch (error) {
    console.error('Error loading search history:', error);
    searchHistory = [];
  }
}

// Save search history to storage
async function saveSearchHistory() {
  try {
    await chrome.storage.local.set({ searchHistory });
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

// Add a keyword to search history
function addToSearchHistory(keywords) {
  // Remove if already exists (to move to front)
  const index = searchHistory.indexOf(keywords);
  if (index > -1) {
    searchHistory.splice(index, 1);
  }

  // Add to front
  searchHistory.unshift(keywords);

  // Keep only the last 10 searches
  if (searchHistory.length > 10) {
    searchHistory = searchHistory.slice(0, 10);
  }

  saveSearchHistory();
  displaySearchHistory();
}

// Display search history
function displaySearchHistory() {
  historyList.innerHTML = '';

  if (searchHistory.length === 0) {
    historySection.style.display = 'none';
    return;
  }

  historySection.style.display = 'block';

  searchHistory.forEach((keywords) => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.textContent = keywords;
    historyItem.title = keywords;
    historyItem.addEventListener('click', () => {
      keywordsInput.value = keywords;
      searchLinks();
    });
    historyList.appendChild(historyItem);
  });
}

// Clear search history
async function clearHistory() {
  searchHistory = [];
  await saveSearchHistory();
  displaySearchHistory();
}
