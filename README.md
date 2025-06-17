# URL Cycle Auto Scroll

A Chrome extension that automatically scrolls through a list of URLs, with customizable scrolling behavior and timing.

## Features

- Automatically scrolls through a list of URLs
- Two scrolling modes:
  - Continuous: Smooth scrolling at a constant speed
  - Page Jump: Jumps by a percentage of the viewport height
- Customizable timing:
  - Initial delay before starting to scroll
  - Pause at the bottom of each page
- Domain-specific scroll selectors for custom scrolling behavior
- Play/Pause, Previous, and Next controls
- URL counter showing progress through the list

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon to open the popup
2. Enter your list of URLs (one per line)
3. Configure your scrolling settings:
   - Scroll Mode: Choose between Continuous or Page Jump
   - Scroll Speed: Set the speed in pixels per second (Continuous mode)
   - Initial Delay: Time to wait before starting to scroll
   - Bottom Pause: Time to pause at the bottom of each page
   - Jump Percentage: Percentage of viewport height to jump (Page Jump mode)
   - Jump Delay: Time between jumps (Page Jump mode)
4. Add domain-specific scroll selectors (optional):
   - Click "Add Domain Selector"
   - Enter the domain (e.g., "example.com")
   - Enter the CSS selector for the scrollable element (e.g., ".content" or "#main")
   - Add more selectors as needed
5. Click "Save Settings" to save your configuration
6. Click "Start" to begin the URL cycle

### Domain Scroll Selectors

The extension allows you to specify custom scroll selectors for different domains. This is useful when:

- The main scroll element isn't the default `document.documentElement`
- You want to scroll a specific container instead of the whole page
- The page has a custom scrolling implementation

To add a domain selector:

1. Click "Add Domain Selector" in the settings
2. Enter the domain (e.g., "example.com")
3. Enter the CSS selector for the scrollable element
   - Use `.classname` for class selectors
   - Use `#idname` for ID selectors
   - Use more complex selectors if needed (e.g., `.container .content`)

Example selectors:

- `.content` - Scrolls the element with class "content"
- `#main` - Scrolls the element with ID "main"
- `.article-container` - Scrolls the article container
- `.feed-container` - Scrolls a social media feed

The extension will use these selectors when visiting the specified domains, falling back to the default scroll behavior if no selector is found.

## Controls

- Play/Pause: Toggle scrolling
- Previous: Go to the previous URL
- Next: Go to the next URL
- URL Counter: Shows current position in the URL list

## License

This project is licensed under the MIT License - see the LICENSE file for details.
