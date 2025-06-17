let isScrolling = false;
let isPaused = false;
let scrollInterval;
let controlsCreated = false;
let currentUrlIndex = 0;
let totalUrls = 1;
let extensionTabId = null;
let domainSelectors = [];

// Constants
const SCROLL_INTERVAL = 50;

// Reset all scroll-related parameters
function resetScrollState() {
    isScrolling = false;
    if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
    }
}


// Create and inject the overlay
function createOverlay() {
    if (controlsCreated) return;
    
    // Request initial URL information from background script
    chrome.runtime.sendMessage({ action: 'getUrlInfo' }, (response) => {
        if (response && response.urlInfo) {
            currentUrlIndex = response.urlInfo.currentIndex;
            totalUrls = response.urlInfo.totalUrls;
        }
        
        const controlsDiv = document.createElement('div');
        controlsDiv.id = 'scrollControls';
        controlsDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.8);
            padding: 10px 20px;
            border-radius: 25px;
            display: flex;
            gap: 10px;
            align-items: center;
            z-index: 999999;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        `;

        // Create buttons and counter
        const prevButton = createButton('prevUrl', 'Previous URL', `
            <svg viewBox="0 0 24 24">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/>
            </svg>
        `);

        const playPauseButton = createButton('playPause', 'Play/Pause', `
            <svg id="playIcon" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z"/>
            </svg>
            <svg id="pauseIcon" viewBox="0 0 24 24" style="display: none;">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
            </svg>
        `);

        const urlCounter = document.createElement('div');
        urlCounter.id = 'urlCounter';
        urlCounter.style.cssText = `
            color: white;
            font-family: Arial, sans-serif;
            font-size: 12px;
            margin: 0 10px;
            min-width: 60px;
            text-align: center;
        `;
        updateUrlCounter(urlCounter);

        const nextButton = createButton('nextUrl', 'Next URL', `
            <svg viewBox="0 0 24 24">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>
            </svg>
        `);

        // Add elements to controls div
        controlsDiv.appendChild(prevButton);
        controlsDiv.appendChild(playPauseButton);
        controlsDiv.appendChild(urlCounter);
        controlsDiv.appendChild(nextButton);

        // Add controls to page
        document.body.appendChild(controlsDiv);
        controlsCreated = true;

        // Add event listeners
        setupEventListeners(playPauseButton, prevButton, nextButton, urlCounter);
    });
}

function updateUrlCounter(counter) {
    counter.textContent = `${currentUrlIndex + 1}/${totalUrls}`;
}

function createButton(id, title, innerHTML) {
    const button = document.createElement('button');
    button.id = id;
    button.title = title;
    button.className = 'control-button';
    button.style.cssText = `
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 5px 10px;
        border-radius: 15px;
        transition: background-color 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
    `;
    
    // Create a wrapper for the SVG to ensure proper styling
    const svgWrapper = document.createElement('div');
    svgWrapper.style.cssText = `
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
    `;
    svgWrapper.innerHTML = innerHTML;
    
    // Style all SVGs within the wrapper
    const svgs = svgWrapper.getElementsByTagName('svg');
    for (let svg of svgs) {
        svg.style.cssText = `
            width: 20px;
            height: 20px;
            fill: white;
        `;
    }
    
    button.appendChild(svgWrapper);
    return button;
}

function setupEventListeners(playPauseBtn, prevBtn, nextBtn, urlCounter) {
    // Toggle play/pause
    playPauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        const playIcon = playPauseBtn.querySelector('#playIcon');
        const pauseIcon = playPauseBtn.querySelector('#pauseIcon');
        playIcon.style.display = isPaused ? 'block' : 'none';
        pauseIcon.style.display = isPaused ? 'none' : 'block';
        chrome.runtime.sendMessage({ 
            action: isPaused ? 'pauseScrolling' : 'resumeScrolling' 
        });
    });

    // Navigate to previous URL
    prevBtn.addEventListener('click', () => {
        console.log('Previous button clicked');
        chrome.runtime.sendMessage({ action: 'previousUrl' }, (response) => {
            console.log('Previous URL response:', response);
        });
    });

    // Navigate to next URL
    nextBtn.addEventListener('click', () => {
        console.log('Next button clicked');
        chrome.runtime.sendMessage({ action: 'nextUrl' }, (response) => {
            console.log('Next URL response:', response);
        });
    });
}

// Try to create controls as early as possible
function tryCreateControls() {
    // Only create controls if the tab ID is set
    if (!extensionTabId) return;
    
    if (document.body) {
        createOverlay();
    } else {
        // If body isn't ready, wait for it
        const observer = new MutationObserver((mutations, obs) => {
            if (document.body) {
                createOverlay();
                obs.disconnect();
            }
        });
        
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true
        });
    }
}

// Add diagnostic function for scroll state
function logScrollState() {
    const scrollElement = getScrollElement();
    console.log('Scroll State:', {
        scrollHeight: scrollElement.scrollHeight,
        clientHeight: scrollElement.clientHeight,
        scrollTop: scrollElement.scrollTop,
        maxScroll: scrollElement.scrollHeight - scrollElement.clientHeight,
        isFullscreen: document.fullscreenElement !== null
    });
}

// Add fullscreen change listener
document.addEventListener('fullscreenchange', () => {
    console.log('Fullscreen changed:', {
        isFullscreen: document.fullscreenElement !== null,
        scrollElement: getScrollElement(),
        controlsVisible: document.getElementById('scrollControls') !== null
    });
});

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    if (request.action === 'tabCreated') {
        extensionTabId = request.tabId;
        // Create and dispatch a custom event that can be listened to by other scripts
        const event = new CustomEvent('extensionTabCreated', {
            detail: {
                url: request.url,
                tabId: request.tabId,
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(event);
    } else if (request.action === 'startScrolling') {
        console.log('Starting scroll with settings:', request.settings);
        // Reset state before starting new scroll
        resetScrollState();
        
        if (request.urlInfo) {
            currentUrlIndex = request.urlInfo.currentIndex;
            totalUrls = request.urlInfo.totalUrls;
            const counter = document.getElementById('urlCounter');
            if (counter) {
                updateUrlCounter(counter);
            }
        }
        
        // Check if we're already at the bottom
        const scrollElement = getScrollElement();
        const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
        const isAtBottom = Math.abs(scrollElement.scrollTop - maxScroll) < 1;
        
        console.log('Scroll check:', {
            scrollHeight: scrollElement.scrollHeight,
            clientHeight: scrollElement.clientHeight,
            scrollTop: scrollElement.scrollTop,
            maxScroll: maxScroll,
            isAtBottom: isAtBottom
        });
        
        if (isAtBottom) {
            console.log('Already at bottom, adding extra pause');
            // Add extra pause before starting scroll
            setTimeout(() => {
                startScrolling(request.settings);
            }, 5000); // 5 second extra pause
        } else {
            startScrolling(request.settings);
        }
        
        sendResponse({ status: 'started' });
    } else if (request.action === 'pauseScrolling') {
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
        isPaused = true;
        sendResponse({ status: 'paused' });
    } else if (request.action === 'resumeScrolling') {
        isPaused = false;
        const scrollElement = getScrollElement();
        if (request.settings.scrollMode === 'continuous') {
            startContinuousScroll(scrollElement, request.settings);
        } else {
            startPageJump(scrollElement, request.settings);
        }
        sendResponse({ status: 'resumed' });
    } else if (request.action === 'updateUrlInfo') {
        currentUrlIndex = request.currentIndex;
        totalUrls = request.totalUrls;
        const counter = document.getElementById('urlCounter');
        if (counter) {
            updateUrlCounter(counter);
        }
        sendResponse({ status: 'url info updated' });
    } else if (request.action === 'createOverlay') {
        if(request.tabId) {
            extensionTabId = request.tabId;
        }
        tryCreateControls();
        sendResponse({ status: 'overlay created' });
    }
});

// Load domain selectors when the content script starts
chrome.storage.sync.get(['domainSelectors'], function(data) {
    if (data.domainSelectors) {
        domainSelectors = data.domainSelectors;
    }
});

// Listen for changes to domain selectors
chrome.storage.onChanged.addListener(function(changes, namespace) {
    if (namespace === 'sync' && changes.domainSelectors) {
        domainSelectors = changes.domainSelectors.newValue || [];
    }
});

// Get the appropriate scroll element for the current page
function getScrollElement() {
    // Get the current domain
    const currentDomain = window.location.hostname;
    
    // Find a matching domain selector
    const domainSelector = domainSelectors.find(selector => {
        // Check if the current domain matches or is a subdomain
        return currentDomain === selector.domain || 
               currentDomain.endsWith('.' + selector.domain);
    });
    
    if (domainSelector) {
        console.log('Using custom scroll selector for domain:', currentDomain);
        const element = document.querySelector(domainSelector.selector);
        if (element) {
            console.log('Found scroll element with selector:', domainSelector.selector);
            return element;
        } else {
            console.log('Selector not found, falling back to default scroll element');
        }
    }
    
    // Default scroll element logic
    const scrollElement = document.documentElement;
    const body = document.body;
    
    // Check if body is scrollable
    if (body.scrollHeight > body.clientHeight) {
        return body;
    }
    
    // Check if documentElement is scrollable
    if (scrollElement.scrollHeight > scrollElement.clientHeight) {
        return scrollElement;
    }
    
    // If neither is scrollable, return documentElement as default
    return scrollElement;
}

function startScrolling(settings) {
    // Reset state before starting new scroll
    resetScrollState();
    
    isScrolling = true;
    const scrollElement = getScrollElement();
    
    if (settings.scrollMode === 'continuous') {
        startContinuousScroll(scrollElement, settings);
    } else {
        startPageJump(scrollElement, settings);
    }
}

function startContinuousScroll(scrollElement, settings) {
    let scrollPosition = scrollElement.scrollTop || window.scrollY;
    let lastScrollTime = Date.now();
    let pausedTime = 0;
    let wasPaused = false;
    
    if (scrollInterval) {
        clearInterval(scrollInterval);
    }

    // Add resize event listener to recalculate maxScroll
    const handleResize = () => {
        console.log('Resize event triggered');
        logScrollState();
        const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
        // If we're past the new maxScroll, adjust the position
        if (scrollPosition > maxScroll) {
            scrollPosition = maxScroll;
            if (scrollElement !== document.documentElement) {
                scrollElement.scrollTop = scrollPosition;
            } else {
                window.scrollTo({
                    top: scrollPosition,
                    behavior: 'auto'
                });
            }
        }
    };

    window.addEventListener('resize', handleResize);
    
    scrollInterval = setInterval(() => {
        if (isPaused) {
            if (!wasPaused) {
                pausedTime = Date.now();
                wasPaused = true;
            }
            return;
        }
        
        // If we're resuming from a pause, adjust the lastScrollTime
        if (wasPaused) {
            const pauseDuration = Date.now() - pausedTime;
            lastScrollTime += pauseDuration;
            wasPaused = false;
        }
        
        const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
        const currentTime = Date.now();
        const timeDiff = currentTime - lastScrollTime;
        
        if (scrollPosition >= maxScroll) {
            // Reached bottom
            console.log('Reached bottom, sending message');
            clearInterval(scrollInterval);
            scrollInterval = null;
            isScrolling = false;
            window.removeEventListener('resize', handleResize);
            chrome.runtime.sendMessage({ action: 'reachedBottom' }, (response) => {
                console.log('Reached bottom response:', response);
            });
        } else {
            // Calculate smooth scroll amount based on time difference
            const scrollAmount = (settings.scrollSpeed * timeDiff) / SCROLL_INTERVAL;
            scrollPosition += scrollAmount;
            
            // Ensure we don't overshoot
            if (scrollPosition > maxScroll) {
                scrollPosition = maxScroll;
            }
            
            // Apply scroll
            if (scrollElement !== document.documentElement) {
                scrollElement.scrollTop = scrollPosition;
            } else {
                window.scrollTo({
                    top: scrollPosition,
                    behavior: 'auto'
                });
            }
            
            lastScrollTime = currentTime;
        }
    }, 16);
}

function startPageJump(scrollElement, settings) {
    let currentPosition = scrollElement.scrollTop || window.scrollY;
    
    if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
    }

    // Add resize event listener to recalculate maxScroll
    const handleResize = () => {
        const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
        // If we're past the new maxScroll, adjust the position
        if (currentPosition > maxScroll) {
            currentPosition = maxScroll;
            if (scrollElement !== document.documentElement) {
                scrollElement.scrollTop = currentPosition;
            } else {
                window.scrollTo(0, currentPosition);
            }
        }
    };

    window.addEventListener('resize', handleResize);
    
    function jump() {
        if (!isScrolling || isPaused) return;
        
        const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
        
        if (currentPosition >= maxScroll) {
            // Reached bottom
            isScrolling = false;
            window.removeEventListener('resize', handleResize);
            chrome.runtime.sendMessage({ action: 'reachedBottom' });
            return;
        }
        
        // Jump by configured amount
        currentPosition += settings.jumpAmount;
        if (currentPosition > maxScroll) {
            currentPosition = maxScroll;
        }
        
        if (scrollElement !== document.documentElement) {
            scrollElement.scrollTop = currentPosition;
        } else {
            window.scrollTo(0, currentPosition);
        }
        
        scrollInterval = setTimeout(jump, settings.jumpDelay * 1000);
    }
    
    // Start the jumping
    jump();
}

// Notify background script when page is loaded
window.addEventListener('load', () => {
    // Reset state when page loads
    resetScrollState();
    chrome.runtime.sendMessage({ action: 'pageLoaded' });
}); 