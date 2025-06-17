let isPaused = false;
let currentUrlIndex = 0;
let totalUrls = 1;

// Initialize the overlay
function initializeOverlay() {
    const playPauseBtn = document.getElementById('playPause');
    const prevUrlBtn = document.getElementById('prevUrl');
    const nextUrlBtn = document.getElementById('nextUrl');
    const urlCounter = document.getElementById('urlCounter');
    const playIcon = document.getElementById('playIcon');
    const pauseIcon = document.getElementById('pauseIcon');

    // Update URL counter
    function updateUrlCounter() {
        urlCounter.textContent = `${currentUrlIndex + 1}/${totalUrls}`;
    }

    // Toggle play/pause
    playPauseBtn.addEventListener('click', () => {
        isPaused = !isPaused;
        playIcon.style.display = isPaused ? 'block' : 'none';
        pauseIcon.style.display = isPaused ? 'none' : 'block';
        chrome.runtime.sendMessage({ 
            action: isPaused ? 'pauseScrolling' : 'resumeScrolling' 
        });
    });

    // Navigate to previous URL
    prevUrlBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: MESSAGE_PREFIX + 'previousUrl' });
    });

    // Navigate to next URL
    nextUrlBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: MESSAGE_PREFIX + 'nextUrl' });
    });

    // Listen for messages from the content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === MESSAGE_PREFIX + 'updateUrlInfo') {
            currentUrlIndex = request.currentIndex;
            totalUrls = request.totalUrls;
            updateUrlCounter();
        }
    });

    // Initial update
    updateUrlCounter();
}

// Initialize when the document is ready
document.addEventListener('DOMContentLoaded', initializeOverlay); 