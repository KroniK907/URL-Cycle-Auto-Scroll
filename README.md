# URL Cycle Auto Scroll

A Chrome extension that automatically cycles through a list of URLs and scrolls through each page. Perfect for monitoring dashboards, news feeds, or any set of web pages that need regular viewing.

## Features

### URL Management

- Add multiple URLs to cycle through
- URLs are saved between sessions
- Import/Export functionality for easy backup and sharing
- Automatic newline handling for better URL entry

### Scroll Modes

1. **Continuous Scroll**

   - Smooth, continuous scrolling at a customizable speed
   - Configurable initial delay before starting
   - Adjustable pause duration at the bottom of the page

2. **Page Jump**
   - Jump through the page in configurable increments
   - Customizable jump percentage
   - Adjustable delay between jumps

### Domain-Specific Settings

- Add custom scroll selectors for specific domains
- Perfect for pages with non-standard scroll containers
- Supports both exact domain matches and subdomains
- Easy to add and remove domain selectors

### User Interface

- Clean, modern interface with accordion sections
- Collapsible sections for better organization:
  - Scroll Settings
  - Domain Scroll Selectors
  - Settings Management
- Real-time settings updates
- Status indicators for current operation
- Version display

### Settings Management

- Export settings to JSON file
- Import settings from JSON file
- Reset to default settings
- Automatic saving of all changes

## Installation

1. Clone this repository or download the ZIP file
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory

## Usage

1. Click the extension icon to open the popup
2. Enter the URLs you want to cycle through (one per line)
3. Choose your preferred scroll mode and settings
4. Add any domain-specific scroll selectors if needed
5. Click "Start" to begin the cycle
6. Use "Stop" to pause the cycle at any time

## Default Settings

### Continuous Scroll Mode

- Scroll Speed: 3 pixels per second
- Initial Delay: 2 seconds
- Bottom Pause: 2 seconds

### Page Jump Mode

- Jump Percentage: 25%
- Delay Between Jumps: 1 second

## Development

The extension is built using:

- HTML/CSS for the popup interface
- JavaScript for functionality
- Chrome Extension Manifest V3
- Chrome Storage API for settings persistence
- Chrome Tabs API for URL management
- Chrome Scripting API for content script injection

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.
