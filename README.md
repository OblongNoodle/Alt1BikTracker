# Catalyst Tracker - Alt1 Toolkit App

An Alt1 Toolkit app for RuneScape 3 that tracks items received from opening Catalyst of Alteration.

## Features

- 📊 Tracks total number of catalysts opened
- 📋 **Individual clue scroll tracking** (Easy, Medium, Hard, Elite, Master)
- 📦 Records all items received and their quantities in detail
- 💾 Saves data between sessions using localStorage
- 🔄 Real-time chatbox monitoring
- 🧹 Reset functionality to clear all tracked data
- 🧪 Test mode for development and verification

## Installation

### Method 1: Using Alt1 Toolkit (Recommended)

1. Download or clone this repository
2. Open Alt1 Toolkit
3. Click "Add App" or press `Alt+1`
4. Navigate to "Browser Apps"
5. Click "Add App URL" and paste the path to your `appconfig.json` file, or:
6. Click "Add Local App" and browse to the folder containing these files

### Method 2: Manual Installation

1. Download all files to a local folder
2. Open the folder location in your file browser
3. Open `index.html` in your browser while Alt1 Toolkit is running
4. The app should automatically connect to Alt1

## Usage

1. Launch the app in Alt1 Toolkit
2. Make sure your chatbox is visible in RuneScape
3. The app will automatically detect and monitor your chatbox
4. Open Catalyst of Alteration items in-game
5. The app will automatically track the items you receive

### What Gets Tracked

The app monitors chat messages that match this pattern:
```
The catalyst of alteration contained: X x Item Name
```

For example:
- `The catalyst of alteration contained: 3 x Sealed clue scroll (hard)`
- `The catalyst of alteration contained: 5 x Uncut diamond`

### Display Information

- **Total Catalysts Opened**: Number of catalysts you've opened
- **Individual Clue Counts**: Separate counters for each clue difficulty
  - Easy Clues
  - Medium Clues
  - Hard Clues
  - Elite Clues
  - Master Clues
- **Items List**: Shows each unique item and how many you've received (sorted by quantity)

## Testing

### Test Mode (No Game Required)

Want to test the app without opening catalysts in-game? Open `test.html` in your browser!

**Test mode features:**
- Simulate any catalyst message with one click
- Test all clue types at once
- Simulate 10 or 100 random catalysts for stress testing
- Send custom messages to test edge cases
- View raw data structure
- Activity log showing all test actions

**Quick start:**
1. Open `test.html` in your browser
2. Click any test button
3. Watch the tracker update in real-time

### Running Tests

To verify the parsing logic works correctly:
```bash
node test.js
```

This will run 15 test cases covering all clue scroll types and quantities.

For a complete testing guide, see [TESTING.md](TESTING.md).

### Reset Data

Click the "Reset" button to clear all tracked data. This action cannot be undone, so a confirmation dialog will appear.

## Requirements

- RuneScape 3 (with visible chatbox)
- Alt1 Toolkit installed and running
- Permissions for:
  - Pixel reading (to read the chatbox)
  - Game state (to detect the game)
  - Overlay (to display the app)

## Troubleshooting

### "Alt1 Toolkit not detected!"
- Make sure Alt1 Toolkit is running
- Try refreshing the app

### "Chatbox not found"
- Ensure your chatbox is visible in RuneScape
- The chatbox must not be hidden or minimized
- Try resizing your game window

### Items not being tracked
- Check that the chatbox shows the message "The catalyst of alteration contained:"
- Make sure the app shows "Monitoring chatbox..." status
- Verify Alt1 has the necessary permissions

### Data not saving
- Check that your browser allows localStorage
- Make sure you're not in private/incognito mode

## Files

- `index.html` - Main app interface
- `app.js` - Application logic and chat monitoring
- `appconfig.json` - Alt1 Toolkit configuration
- `test.html` - Standalone test mode (no game required)
- `test.js` - Automated parsing tests
- `TESTING.md` - Comprehensive testing guide
- `README.md` - This file

## Technical Details

- Uses Alt1 Toolkit's Chatbox API for reading game chat
- Data stored in browser localStorage for persistence
- Polls chatbox every 600ms for new messages
- Supports various chat message formats and item names

## Credits

Based on the Alt1 Toolkit framework and inspired by similar tracking apps in the Alt1 ecosystem.

## License

Free to use and modify for personal use.
