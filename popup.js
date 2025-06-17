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
    const importFile = document.getElementById('importFile');
    const version = document.getElementById('version');

    // Accordion elements
    const scrollSettingsHeader = document.getElementById('scrollSettingsHeader');
    const scrollSettingsContent = document.getElementById('scrollSettingsContent');
    const domainSelectorsHeader = document.getElementById('domainSelectorsHeader');
    const domainSelectorsContent = document.getElementById('domainSelectorsContent');
    const utilityHeader = document.getElementById('utilityHeader');
    const utilityContent = document.getElementById('utilityContent');

    // Default settings
    const defaultSettings = {
        settings: {
            scrollMode: 'continuous',
            scrollSpeed: 3,
            initialDelay: 2,
            bottomPause: 2,
            jumpPercentage: 25,
            jumpDelay: 1
        },
        urls: [],
        domainSelectors: []
    };

    const MESSAGE_PREFIX = 'URL_CYCLE_AUTO_SCROLL_';

    // Display version number
    const manifest = chrome.runtime.getManifest();
    version.textContent = `Version ${manifest.version}`;

    // Function to reset settings to defaults
    function resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults? This will clear your URL list and domain selectors.')) {
            // Reset all input fields to defaults
            scrollMode.value = defaultSettings.settings.scrollMode;
            scrollSpeed.value = defaultSettings.settings.scrollSpeed;
            initialDelay.value = defaultSettings.settings.initialDelay;
            bottomPause.value = defaultSettings.settings.bottomPause;
            jumpPercentage.value = defaultSettings.settings.jumpPercentage;
            jumpDelay.value = defaultSettings.settings.jumpDelay;

            // Clear URL list
            urlList.value = '';

            // Clear domain selectors
            domainSelectorsContainer.innerHTML = '';

            // Update UI and save to storage
            updateSettingsVisibility();
            saveSettings();
            status.textContent = 'Settings reset to defaults';
            setTimeout(() => {
                status.textContent = 'Ready';
            }, 2000);
        }
    }

    // Function to ensure textarea ends with a newline
    function ensureNewlineAtEnd() {
        const content = urlList.value;
        if (content && !content.endsWith('\n')) {
            urlList.value = content + '\n';
        }
    }

    // Function to get all current settings
    function getAllSettings() {
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

        const domainSelectors = [];
        document.querySelectorAll('.domain-selector').forEach(div => {
            const domain = div.querySelector('.domain-input').value.trim();
            const selector = div.querySelector('.selector-input').value.trim();
            if (domain && selector) {
                domainSelectors.push({ domain, selector });
            }
        });

        return {
            settings,
            urls,
            domainSelectors
        };
    }

    // Function to export settings
    function exportSettings() {
        const allSettings = getAllSettings();
        const blob = new Blob([JSON.stringify(allSettings, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'url-cycle-settings.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        status.textContent = 'Settings exported';
        setTimeout(() => {
            status.textContent = 'Ready';
        }, 2000);
    }

    // Function to import settings
    function importSettings(file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedSettings = JSON.parse(e.target.result);
                
                // Validate the imported settings structure
                if (!importedSettings.settings || !importedSettings.urls || !importedSettings.domainSelectors) {
                    throw new Error('Invalid settings file format');
                }

                // Clear existing domain selectors
                domainSelectorsContainer.innerHTML = '';

                // Apply imported settings
                if (importedSettings.settings) {
                    scrollMode.value = importedSettings.settings.scrollMode || defaultSettings.settings.scrollMode;
                    scrollSpeed.value = importedSettings.settings.scrollSpeed || defaultSettings.settings.scrollSpeed;
                    initialDelay.value = importedSettings.settings.initialDelay || defaultSettings.settings.initialDelay;
                    bottomPause.value = importedSettings.settings.bottomPause || defaultSettings.settings.bottomPause;
                    jumpPercentage.value = importedSettings.settings.jumpPercentage || defaultSettings.settings.jumpPercentage;
                    jumpDelay.value = importedSettings.settings.jumpDelay || defaultSettings.settings.jumpDelay;
                }

                if (importedSettings.urls) {
                    urlList.value = importedSettings.urls.join('\n');
                    ensureNewlineAtEnd();
                }

                if (importedSettings.domainSelectors) {
                    importedSettings.domainSelectors.forEach(selector => {
                        addDomainSelectorUI(selector.domain, selector.selector);
                    });
                }

                // Update UI and save to storage
                updateSettingsVisibility();
                saveSettings();
                status.textContent = 'Settings imported successfully';
                setTimeout(() => {
                    status.textContent = 'Ready';
                }, 2000);
            } catch (error) {
                status.textContent = 'Error importing settings: ' + error.message;
                setTimeout(() => {
                    status.textContent = 'Ready';
                }, 3000);
            }
        };
        reader.readAsText(file);
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

    // Accordion toggle functionality
    function toggleAccordion(header, content) {
        const isActive = header.classList.contains('active');
        header.classList.toggle('active');
        content.classList.toggle('active');
    }

    // Initialize accordions
    function initializeAccordions() {
        // Set initial states
        scrollSettingsHeader.classList.remove('active');
        scrollSettingsContent.classList.remove('active');
        domainSelectorsHeader.classList.remove('active');
        domainSelectorsContent.classList.remove('active');
        utilityHeader.classList.remove('active');
        utilityContent.classList.remove('active');

        // Add click handlers
        scrollSettingsHeader.addEventListener('click', () => {
            toggleAccordion(scrollSettingsHeader, scrollSettingsContent);
        });

        domainSelectorsHeader.addEventListener('click', () => {
            toggleAccordion(domainSelectorsHeader, domainSelectorsContent);
        });

        utilityHeader.addEventListener('click', () => {
            toggleAccordion(utilityHeader, utilityContent);
        });
    }

    // Initialize accordions
    initializeAccordions();

    // Load saved settings
    chrome.storage.sync.get(['settings', 'urls', 'domainSelectors'], function(data) {
        if (data.settings) {
            scrollMode.value = data.settings.scrollMode || defaultSettings.settings.scrollMode;
            scrollSpeed.value = data.settings.scrollSpeed || defaultSettings.settings.scrollSpeed;
            initialDelay.value = data.settings.initialDelay || defaultSettings.settings.initialDelay;
            bottomPause.value = data.settings.bottomPause || defaultSettings.settings.bottomPause;
            jumpPercentage.value = data.settings.jumpPercentage || defaultSettings.settings.jumpPercentage;
            jumpDelay.value = data.settings.jumpDelay || defaultSettings.settings.jumpDelay;
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
        const allSettings = getAllSettings();
        chrome.storage.sync.set(allSettings, function() {
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
            action: MESSAGE_PREFIX + 'start', 
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
        chrome.runtime.sendMessage({ action: MESSAGE_PREFIX + 'stop' });
        status.textContent = 'Stopped';
    });

    // Export button functionality
    document.getElementById('exportButton').addEventListener('click', exportSettings);

    // Import button functionality
    document.getElementById('importButton').addEventListener('click', function() {
        importFile.click();
    });

    // Handle file selection
    importFile.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            importSettings(e.target.files[0]);
            // Reset the file input
            e.target.value = '';
        }
    });

    // Reset button functionality
    document.getElementById('resetButton').addEventListener('click', resetSettings);
}); 