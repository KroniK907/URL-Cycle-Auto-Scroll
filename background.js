let currentTab = null;
let urls = [];
let currentUrlIndex = 0;
let isRunning = false;
let settings = {
    scrollMode: 'continuous',
    scrollSpeed: 1,
    jumpAmount: 300,
    jumpDelay: 3,
    initialDelay: 5000,
    bottomPause: 5000
};

// Store setTimeout IDs
let initialDelayTimeoutId = null;
let bottomPauseTimeoutId = null;
let retryTimeoutId = null;
let messageRetryTimeoutId = null;
let updateRetryTimeoutId = null;
let navigationRetryTimeoutId = null;

// Configuration
const INITIAL_DELAY = 5000; // 5 seconds before starting to scroll
const BOTTOM_PAUSE = 5000; // 5 seconds pause at bottom

// Function to clear all timeouts
function clearAllTimeouts() {
    const timeouts = [
        initialDelayTimeoutId,
        bottomPauseTimeoutId,
        retryTimeoutId,
        messageRetryTimeoutId,
        updateRetryTimeoutId,
        navigationRetryTimeoutId
    ];

    timeouts.forEach(timeoutId => {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
    });

    // Reset all timeout IDs to null
    initialDelayTimeoutId = null;
    bottomPauseTimeoutId = null;
    retryTimeoutId = null;
    messageRetryTimeoutId = null;
    updateRetryTimeoutId = null;
    navigationRetryTimeoutId = null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'start') {
        urls = request.urls;
        currentUrlIndex = 0;
        isRunning = true;
        settings = {
            ...settings,
            ...request.settings,
            initialDelay: request.settings.initialDelay * 1000,
            bottomPause: request.settings.bottomPause * 1000
        };
        loadNextUrl();
        sendResponse({ success: true });
    } else if (request.action === 'stop') {
        isRunning = false;
        clearAllTimeouts();
        if (currentTab) {
            chrome.tabs.remove(currentTab.id);
            currentTab = null;
        }
        sendResponse({ success: true });
    } else if (request.action === 'getUrlInfo') {
        // Send current URL information
        sendResponse({
            urlInfo: {
                currentIndex: currentUrlIndex,
                totalUrls: urls.length
            }
        });
    } else if (request.action === 'reachedBottom') {
        if (isRunning) {
            bottomPauseTimeoutId = setTimeout(() => {
                currentUrlIndex = (currentUrlIndex + 1) % urls.length;
                loadNextUrl();
            }, settings.bottomPause);
        }
        sendResponse({ success: true });
    } else if (request.action === 'previousUrl') {
        if (isRunning && urls.length > 0) {
            clearAllTimeouts();
            currentUrlIndex = (currentUrlIndex - 1 + urls.length) % urls.length;
            loadNextUrl();
        }
        sendResponse({ success: true });
    } else if (request.action === 'nextUrl') {
        if (isRunning && urls.length > 0) {
            clearAllTimeouts();
            currentUrlIndex = (currentUrlIndex + 1) % urls.length;
            loadNextUrl();
        }
        sendResponse({ success: true });
    } else if (request.action === 'pauseScrolling' || request.action === 'resumeScrolling') {
        sendResponse({ success: true });
    }
    return true; // Keep the message channel open for async responses
});

function loadNextUrl() {
    if (!isRunning || urls.length === 0) return;

    const url = urls[currentUrlIndex];
    
    if (currentTab) {
        // Update existing tab
        chrome.tabs.update(currentTab.id, { url: url }, (tab) => {
            if (chrome.runtime.lastError) {
                console.log('Error updating tab:', chrome.runtime.lastError);
                // If update fails, try creating a new tab
                createNewTab(url);
            } else {
                currentTab = tab;
                // Update URL info in the overlay
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateUrlInfo',
                    currentIndex: currentUrlIndex,
                    totalUrls: urls.length,
                    tabId: tab.id
                }).catch(error => {
                    console.log('Error updating URL info:', error);
                    // If we get an error, try again after a short delay
                    updateRetryTimeoutId = setTimeout(() => {
                        if (isRunning && currentTab) {
                            chrome.tabs.sendMessage(tab.id, {
                                action: 'updateUrlInfo',
                                currentIndex: currentUrlIndex,
                                totalUrls: urls.length,
                                tabId: tab.id
                            }).catch(error => {
                                console.log('Second attempt to update URL info failed:', error);
                            });
                        }
                    }, 1000);
                });
            }
        });
    } else {
        // Create new tab
        createNewTab(url);
    }
}

function createNewTab(url) {
    // If we already have a tab, don't create a new one
    if (currentTab) {
        console.log('Tab already exists, updating existing tab instead');
        chrome.tabs.update(currentTab.id, { url: url });
        return;
    }

    chrome.tabs.create({ url: url }, (tab) => {
        currentTab = tab;
        // Send a message to the new tab indicating it was created by the extension
        chrome.tabs.sendMessage(tab.id, { 
            action: 'tabCreated',
            url: url,
            tabId: tab.id
        }).catch(error => {
            console.log('Error sending tabCreated message:', error);
            // If we get an error, try again after a short delay
            messageRetryTimeoutId = setTimeout(() => {
                chrome.tabs.sendMessage(tab.id, { 
                    action: 'tabCreated',
                    url: url,
                    tabId: tab.id
                }).catch(error => {
                    console.log('Second attempt to send tabCreated message failed:', error);
                });
            }, 1000);
        });
    });
}

// Listen for tab updates to handle navigation
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (currentTab && tabId === currentTab.id && changeInfo.status === 'complete') {
        clearAllTimeouts();
        
        // Create overlay immediately after page load
        chrome.tabs.sendMessage(tabId, {
            action: 'createOverlay',
            tabId: tabId
        }).catch(error => {
            console.log('Error creating overlay:', error);
        });

        // Then wait for initial delay before starting scroll
        navigationRetryTimeoutId = setTimeout(() => {
            if (isRunning && currentTab) {
                chrome.tabs.sendMessage(tabId, { 
                    action: 'startScrolling',
                    settings: settings,
                    urlInfo: {
                        currentIndex: currentUrlIndex,
                        totalUrls: urls.length
                    },
                    tabId: tabId
                }).catch(error => {
                    console.log('Error sending startScrolling message after update:', error);
                    // If we get an error, try again after a short delay
                    setTimeout(() => {
                        if (isRunning && currentTab) {
                            chrome.tabs.sendMessage(tabId, { 
                                action: 'startScrolling',
                                settings: settings,
                                urlInfo: {
                                    currentIndex: currentUrlIndex,
                                    totalUrls: urls.length
                                },
                                tabId: tabId
                            }).catch(error => {
                                console.log('Second attempt failed:', error);
                            });
                        }
                    }, 1000);
                });
            }
        }, settings.initialDelay);
    }
});

// Listen for tab removal
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    // Check if the closed tab was our current tab
    if (currentTab && tabId === currentTab.id) {
        // Reset the current tab reference
        currentTab = null;
        // Stop the URL cycle
        isRunning = false;
    }
}); 