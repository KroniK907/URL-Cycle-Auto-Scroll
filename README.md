# URL Cycle Auto Scroll

A Chrome extension that automatically cycles through a list of URLs, scrolling through each page at a configurable speed. Perfect for monitoring multiple web pages or automated content review.

## Features

- Automatically cycles through a list of URLs
- Configurable scroll speed and behavior
- Two scroll modes:
  - Continuous: Smooth scrolling at a constant speed
  - Page Jump: Jumps down the page at configurable intervals
- Pause/Resume functionality
- Navigation controls for previous/next URL
- Progress indicator showing current URL position
- Automatic handling of domain-specific scroll containers

## Installation

### Installing as an Unpacked Extension

1. Download or clone this repository to your local machine
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right corner
4. Click "Load unpacked" in the top left
5. Select the directory containing the extension files
6. The extension should now appear in your extensions list and be ready to use

## Usage

1. Click the extension icon in your Chrome toolbar
2. Enter your list of URLs (one per line)
3. Configure your desired settings:
   - Scroll Mode: Choose between continuous or page jump
   - Scroll Speed: Adjust the scrolling speed (continuous mode)
   - Jump Amount: Set how far to jump (page jump mode)
   - Jump Delay: Set time between jumps (page jump mode)
   - Initial Delay: Time to wait before starting to scroll
   - Bottom Pause: Time to pause at the bottom of each page
4. Click "Start" to begin the URL cycle
5. Use the overlay controls to:
   - Pause/Resume scrolling
   - Navigate to previous/next URL
   - Monitor current progress

## Controls

- **Play/Pause**: Toggle scrolling on/off
- **Previous/Next**: Navigate between URLs in the list
- **Progress Counter**: Shows current URL position (e.g., "2/5")

## Notes

- The extension will automatically handle different page layouts and scroll containers
- Scrolling will pause when you reach the bottom of each page
- The extension will continue cycling through URLs until stopped
- You can stop the cycle at any time by clicking the extension icon and selecting "Stop"

## Development

This extension is built using:

- Chrome Extension Manifest V3
- JavaScript
- HTML/CSS for the popup interface

## License

[Your chosen license]
