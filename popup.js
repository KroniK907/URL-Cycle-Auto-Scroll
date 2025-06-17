document.addEventListener('DOMContentLoaded', function() {
    const urlList = document.getElementById('urlList');
    const startButton = document.getElementById('startButton');
    const stopButton = document.getElementById('stopButton');
    const status = document.getElementById('status');
    const scrollMode = document.getElementById('scrollMode');
    const scrollSpeed = document.getElementById('scrollSpeed');
    const jumpAmount = document.getElementById('jumpAmount');
    const jumpDelay = document.getElementById('jumpDelay');
    const initialDelay = document.getElementById('initialDelay');
    const bottomPause = document.getElementById('bottomPause');
    const continuousSettings = document.getElementById('continuousSettings');
    const pageJumpSettings = document.getElementById('pageJumpSettings');

    // Load saved URLs and settings
    chrome.storage.local.get(['urls', 'settings'], function(result) {
        if (result.urls) {
            urlList.value = result.urls.join('\n') + '\n';
        }
        if (result.settings) {
            scrollMode.value = result.settings.scrollMode || 'continuous';
            scrollSpeed.value = result.settings.scrollSpeed || 1;
            jumpAmount.value = result.settings.jumpAmount || 300;
            jumpDelay.value = result.settings.jumpDelay || 3;
            initialDelay.value = result.settings.initialDelay || 5;
            bottomPause.value = result.settings.bottomPause || 5;
            updateModeSettings();
        }
    });

    // Handle scroll mode change
    scrollMode.addEventListener('change', function() {
        updateModeSettings();
        saveSettings();
    });

    function updateModeSettings() {
        if (scrollMode.value === 'continuous') {
            continuousSettings.classList.add('active');
            pageJumpSettings.classList.remove('active');
        } else {
            continuousSettings.classList.remove('active');
            pageJumpSettings.classList.add('active');
        }
    }

    // Save URLs whenever the textarea content changes
    urlList.addEventListener('input', function() {
        // Ensure there's exactly one newline at the end
        let content = urlList.value;
        if (!content.endsWith('\n')) {
            content += '\n';
            urlList.value = content;
        }
        
        const urls = content.split('\n').filter(url => url.trim() !== '');
        chrome.storage.local.set({ urls: urls });
    });

    // Save settings whenever they change
    function saveSettings() {
        const settings = {
            scrollMode: scrollMode.value,
            scrollSpeed: parseInt(scrollSpeed.value) || 1,
            jumpAmount: parseInt(jumpAmount.value) || 300,
            jumpDelay: parseInt(jumpDelay.value) || 3,
            initialDelay: parseInt(initialDelay.value) || 5,
            bottomPause: parseInt(bottomPause.value) || 5
        };
        chrome.storage.local.set({ settings: settings });
    }

    scrollSpeed.addEventListener('change', saveSettings);
    jumpAmount.addEventListener('change', saveSettings);
    jumpDelay.addEventListener('change', saveSettings);
    initialDelay.addEventListener('change', saveSettings);
    bottomPause.addEventListener('change', saveSettings);

    startButton.addEventListener('click', function() {
        const urls = urlList.value.split('\n').filter(url => url.trim() !== '');
        if (urls.length === 0) {
            status.textContent = 'Please enter at least one URL';
            return;
        }

        // Get current settings
        const settings = {
            scrollMode: scrollMode.value,
            scrollSpeed: parseInt(scrollSpeed.value) || 1,
            jumpAmount: parseInt(jumpAmount.value) || 300,
            jumpDelay: parseInt(jumpDelay.value) || 3,
            initialDelay: parseInt(initialDelay.value) || 5,
            bottomPause: parseInt(bottomPause.value) || 5
        };

        // Start the process with current settings
        chrome.runtime.sendMessage({ 
            action: 'start', 
            urls: urls,
            settings: settings
        });
        status.textContent = 'Started viewing...';
    });

    stopButton.addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'stop' });
        status.textContent = 'Stopped';
    });
}); 