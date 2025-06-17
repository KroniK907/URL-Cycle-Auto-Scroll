let isScrolling = false;
let isPaused = false;
let scrollInterval;
let controlsCreated = false;
let currentUrlIndex = 0;
let totalUrls = 1;
let extensionTabId = null;

// Constants
const SCROLL_INTERVAL = 50;

// Reset all scroll-related parameters
function resetScrollState() {
    isScrolling = false;
    isPaused = false;
    if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
    }
}

// Domain-specific scroll element selectors
const DOMAIN_SCROLL_SELECTORS = {
    'cloud.samsara.com': '.DashboardGridShow--overflowScroll'
    // Add more domains and their selectors here
    // 'example.com': '.some-class',
    // 'another-domain.com': '#some-id'
};

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
        chrome.runtime.sendMessage({ action: 'previousUrl' });
    });

    // Navigate to next URL
    nextBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'nextUrl' });
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

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
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
        tryCreateControls();
    } else if (request.action === 'startScrolling') {
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
        startScrolling(request.settings);
    } else if (request.action === 'pauseScrolling') {
        isPaused = true;
        if (scrollInterval) {
            clearInterval(scrollInterval);
            scrollInterval = null;
        }
    } else if (request.action === 'resumeScrolling') {
        isPaused = false;
        const scrollElement = getScrollElement();
        if (request.settings.scrollMode === 'continuous') {
            startContinuousScroll(scrollElement, request.settings);
        } else {
            startPageJump(scrollElement, request.settings);
        }
    } else if (request.action === 'updateUrlInfo') {
        currentUrlIndex = request.currentIndex;
        totalUrls = request.totalUrls;
        const counter = document.getElementById('urlCounter');
        if (counter) {
            updateUrlCounter(counter);
        }
    } else if (request.action === 'createOverlay') {
        if(request.tabId) {
            extensionTabId = request.tabId;
        }
        tryCreateControls();
    }
});

function getScrollElement() {
    const hostname = window.location.hostname;
    const selector = DOMAIN_SCROLL_SELECTORS[hostname];
    
    if (selector) {
        const element = document.querySelector(selector);
        if (element) {
            return element;
        }
    }
    
    return document.documentElement;
}

function startScrolling(settings) {
    // Reset state before starting new scroll
    resetScrollState();
    
    isScrolling = true;
    isPaused = false;
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
        scrollInterval = null;
    }
    
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
            clearInterval(scrollInterval);
            scrollInterval = null;
            isScrolling = false;
            chrome.runtime.sendMessage({ action: 'reachedBottom' });
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
    let currentPosition = 0;
    
    if (scrollInterval) {
        clearInterval(scrollInterval);
        scrollInterval = null;
    }
    
    function jump() {
        if (!isScrolling || isPaused) return;
        
        const maxScroll = scrollElement.scrollHeight - scrollElement.clientHeight;
        
        if (currentPosition >= maxScroll) {
            // Reached bottom
            isScrolling = false;
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
        
        // Schedule next jump
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