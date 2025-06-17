document.addEventListener('DOMContentLoaded', function() {
    const urlList = document.getElementById('urlList');
    const scrollMode = document.getElementById('scrollMode');
    const scrollSpeed = document.getElementById('scrollSpeed');
    const initialDelay = document.getElementById('initialDelay');
    const bottomPause = document.getElementById('bottomPause');
    const jumpPercentage = document.getElementById('jumpPercentage');
    const jumpDelay = document.getElementById('jumpDelay');
    const addDomainSelectorButton = document.getElementById('addDomainSelector');
    const domainSelectorsContainer = document.getElementById('domainSelectors');
    const status = document.getElementById('status');
    const continuousSettings = document.getElementById('continuousSettings');
    const pageJumpSettings = document.getElementById('pageJumpSettings');

    // Function to ensure textarea ends with a newline
    function ensureNewlineAtEnd() {
        const content = urlList.value;
        if (content && !content.endsWith('\n')) {
            urlList.value = content + '\n';
        }
    }

    // Handle paste event for textarea
    urlList.addEventListener('paste', function() {
        // Use setTimeout to ensure the paste happens before we reset the scroll and add newline
        setTimeout(() => {
            this.scrollLeft = 0;
            ensureNewlineAtEnd();
        }, 0);
    });

    // Also ensure newline at end when content changes
    urlList.addEventListener('input', function() {
        ensureNewlineAtEnd();
    });

    // Function to update settings visibility
    function updateSettingsVisibility() {
        if (scrollMode.value === 'continuous') {
            continuousSettings.style.display = 'block';
            pageJumpSettings.style.display = 'none';
        } else {
            continuousSettings.style.display = 'none';
            pageJumpSettings.style.display = 'block';
        }
    }

    // Load saved settings
    chrome.storage.sync.get(['settings', 'urls', 'domainSelectors'], function(data) {
        if (data.settings) {
            scrollMode.value = data.settings.scrollMode || 'continuous';
            scrollSpeed.value = data.settings.scrollSpeed || 100;
            initialDelay.value = data.settings.initialDelay || 2;
            bottomPause.value = data.settings.bottomPause || 2;
            jumpPercentage.value = data.settings.jumpPercentage || 25;
            jumpDelay.value = data.settings.jumpDelay || 1;
            updateSettingsVisibility();
        }
        if (data.urls) {
            urlList.value = data.urls.join('\n');
            ensureNewlineAtEnd();
        }
        if (data.domainSelectors) {
            data.domainSelectors.forEach(selector => {
                addDomainSelectorUI(selector.domain, selector.selector);
            });
        }
    });

    // Function to save settings
    function saveSettings() {
        const settings = {
            scrollMode: scrollMode.value,
            scrollSpeed: parseInt(scrollSpeed.value),
            initialDelay: parseInt(initialDelay.value),
            bottomPause: parseInt(bottomPause.value),
            jumpPercentage: parseInt(jumpPercentage.value),
            jumpDelay: parseFloat(jumpDelay.value)
        };

        const urls = urlList.value
            .split('\n')
            .map(url => url.trim())
            .filter(url => url);

        // Get domain selectors
        const domainSelectors = [];
        document.querySelectorAll('.domain-selector').forEach(div => {
            const domain = div.querySelector('.domain-input').value.trim();
            const selector = div.querySelector('.selector-input').value.trim();
            if (domain && selector) {
                domainSelectors.push({ domain, selector });
            }
        });

        chrome.storage.sync.set({
            settings: settings,
            urls: urls,
            domainSelectors: domainSelectors
        }, function() {
            // Show saved message
            status.textContent = 'Settings saved';
            setTimeout(() => {
                status.textContent = 'Ready';
            }, 2000);
        });
    }

    // Add change listeners to all settings inputs
    const settingsInputs = [
        scrollMode, scrollSpeed, initialDelay, bottomPause,
        jumpPercentage, jumpDelay, urlList
    ];
    
    settingsInputs.forEach(input => {
        input.addEventListener('change', saveSettings);
    });

    // Add scroll mode change listener
    scrollMode.addEventListener('change', function() {
        updateSettingsVisibility();
        saveSettings();
    });

    // Add domain selector
    addDomainSelectorButton.addEventListener('click', function() {
        addDomainSelectorUI();
    });

    function addDomainSelectorUI(domain = '', selector = '') {
        const div = document.createElement('div');
        div.className = 'domain-selector';
        div.innerHTML = `
            <input type="text" class="domain-input" placeholder="Domain (e.g., example.com)" value="${domain}">
            <input type="text" class="selector-input" placeholder="CSS Selector (e.g., .content)" value="${selector}">
            <button class="remove-selector">Remove</button>
        `;
        
        // Add change listeners to the new inputs
        const inputs = div.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('change', saveSettings);
        });
        
        div.querySelector('.remove-selector').addEventListener('click', function() {
            div.remove();
            saveSettings(); // Save when a selector is removed
        });
        
        domainSelectorsContainer.appendChild(div);
    }

    // Start button functionality
    document.getElementById('startButton').addEventListener('click', function() {
        const urls = urlList.value.split('\n').filter(url => url.trim() !== '');
        if (urls.length === 0) {
            status.textContent = 'Please enter at least one URL';
            return;
        }

        chrome.runtime.sendMessage({ 
            action: 'start', 
            urls: urls,
            settings: {
                scrollMode: scrollMode.value,
                scrollSpeed: parseInt(scrollSpeed.value),
                initialDelay: parseInt(initialDelay.value),
                bottomPause: parseInt(bottomPause.value),
                jumpPercentage: parseInt(jumpPercentage.value),
                jumpDelay: parseFloat(jumpDelay.value)
            }
        });
        status.textContent = 'Started viewing...';
    });

    // Stop button functionality
    document.getElementById('stopButton').addEventListener('click', function() {
        chrome.runtime.sendMessage({ action: 'stop' });
        status.textContent = 'Stopped';
    });
}); 