// Check if Alt1 is available
if (window.alt1) {
    alt1.identifyAppUrl("./appconfig.json");
} else {
    document.getElementById('status').textContent = 'Alt1 Toolkit not detected!';
    document.getElementById('status').classList.add('error');
}

// Data storage
let catalystData = {
    totalCatalysts: 0,
    items: {},
    clues: {
        easy: 0,
        medium: 0,
        hard: 0,
        elite: 0,
        master: 0
    }
};

// Load saved data
function loadData() {
    const saved = localStorage.getItem('catalystTrackerData');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
            // Migrate old data format if needed
            if (!loaded.clues) {
                loaded.clues = { easy: 0, medium: 0, hard: 0, elite: 0, master: 0 };
            }
            catalystData = loaded;
            updateDisplay();
        } catch (e) {
            console.error('Error loading saved data:', e);
        }
    }
}

// Save data
function saveData() {
    localStorage.setItem('catalystTrackerData', JSON.stringify(catalystData));
}

// Update the display
function updateDisplay() {
    // Update total catalysts
    document.getElementById('totalCatalysts').textContent = catalystData.totalCatalysts;
    
    // Update individual clue counts
    document.getElementById('easyClues').textContent = catalystData.clues.easy;
    document.getElementById('mediumClues').textContent = catalystData.clues.medium;
    document.getElementById('hardClues').textContent = catalystData.clues.hard;
    document.getElementById('eliteClues').textContent = catalystData.clues.elite;
    document.getElementById('masterClues').textContent = catalystData.clues.master;
    
    // Update items list (this will show all items including clues as individual entries)
    const itemsList = document.getElementById('itemsList');
    
    if (Object.keys(catalystData.items).length === 0) {
        itemsList.innerHTML = '<div style="color: #aaa; text-align: center; padding: 20px;">No items tracked yet. Open some catalysts!</div>';
    } else {
        // Sort items by count (descending)
        const sortedItems = Object.entries(catalystData.items)
            .sort((a, b) => b[1] - a[1]);
        
        itemsList.innerHTML = sortedItems.map(([item, count]) => `
            <div class="item-row">
                <span class="item-name">${item}</span>
                <span class="item-count">${count}</span>
            </div>
        `).join('');
    }
}

// Normalize item names to match expected formats
function normalizeItemName(itemName, originalText) {
    // Handle clue scroll variations
    const lowerItem = itemName.toLowerCase();
    const lowerText = originalText.toLowerCase();
    
    // Check for clue scroll types in the original text
    if (lowerText.includes('sealed clue scroll')) {
        if (lowerText.includes('(easy)')) return 'Sealed clue scroll (easy)';
        if (lowerText.includes('(medium)')) return 'Sealed clue scroll (medium)';
        if (lowerText.includes('(hard)')) return 'Sealed clue scroll (hard)';
        if (lowerText.includes('(elite)')) return 'Sealed clue scroll (elite)';
        if (lowerText.includes('(master)')) return 'Sealed clue scroll (master)';
    }
    
    // Return cleaned up name
    return itemName.trim();
}

// Parse chat message
function parseCatalystMessage(text) {
    // Look for "The catalyst of alteration contained: X x ItemName"
    const catalystRegex = /The catalyst of alteration contained:\s*(\d+)\s*x\s*(.+?)$/i;
    const match = text.match(catalystRegex);
    
    if (match) {
        const quantity = parseInt(match[1]);
        let itemName = match[2].trim();
        
        // Normalize the item name
        itemName = normalizeItemName(itemName, text);
        
        return { quantity, itemName };
    }
    
    return null;
}

// Update clue counts based on item name
function updateClueCount(itemName, quantity) {
    const lowerName = itemName.toLowerCase();
    if (lowerName.includes('sealed clue scroll')) {
        if (lowerName.includes('(easy)')) catalystData.clues.easy += quantity;
        else if (lowerName.includes('(medium)')) catalystData.clues.medium += quantity;
        else if (lowerName.includes('(hard)')) catalystData.clues.hard += quantity;
        else if (lowerName.includes('(elite)')) catalystData.clues.elite += quantity;
        else if (lowerName.includes('(master)')) catalystData.clues.master += quantity;
    }
}

// Handle chat reader
let chatReader = null;

function setupChatReader() {
    if (!window.alt1 || !alt1.permissionGameState || !alt1.permissionPixel) {
        document.getElementById('status').textContent = 'Waiting for Alt1 permissions...';
        document.getElementById('status').classList.add('error');
        setTimeout(setupChatReader, 1000);
        return;
    }
    
    try {
        // Create chat reader
        chatReader = new Chatbox();
        
        // Set up the read event
        chatReader.readargs = {
            colors: [
                a1lib.mixColor(127, 169, 255), // Game message blue
                a1lib.mixColor(0, 255, 255),   // Cyan
                a1lib.mixColor(255, 255, 255)  // White
            ],
            backwards: true
        };
        
        // Find the chatbox
        chatReader.find();
        
        if (!chatReader.pos) {
            document.getElementById('status').textContent = 'Chatbox not found. Please make sure it\'s visible!';
            document.getElementById('status').classList.remove('active');
            document.getElementById('status').classList.add('error');
            setTimeout(setupChatReader, 2000);
            return;
        }
        
        document.getElementById('status').textContent = 'Monitoring chatbox...';
        document.getElementById('status').classList.add('active');
        document.getElementById('status').classList.remove('error');
        
        // Start reading
        readChat();
        
    } catch (e) {
        console.error('Error setting up chat reader:', e);
        document.getElementById('status').textContent = 'Error: ' + e.message;
        document.getElementById('status').classList.add('error');
    }
}

// Read chat continuously
let lastChatLines = [];

function readChat() {
    if (!chatReader || !chatReader.pos) {
        setupChatReader();
        return;
    }
    
    try {
        const chat = chatReader.read();
        
        if (chat) {
            // Check for new lines
            chat.forEach(line => {
                const lineText = line.text.trim();
                
                // Check if this is a new line we haven't seen
                if (!lastChatLines.includes(lineText) && lineText.includes('The catalyst of alteration contained:')) {
                    const parsed = parseCatalystMessage(lineText);
                    
                    if (parsed) {
                        // Increment catalyst count
                        catalystData.totalCatalysts++;
                        
                        // Add or update item count
                        if (catalystData.items[parsed.itemName]) {
                            catalystData.items[parsed.itemName] += parsed.quantity;
                        } else {
                            catalystData.items[parsed.itemName] = parsed.quantity;
                        }
                        
                        // Update clue-specific counts
                        updateClueCount(parsed.itemName, parsed.quantity);
                        
                        // Save and update display
                        saveData();
                        updateDisplay();
                        
                        // Show notification
                        document.getElementById('status').textContent = `Tracked: ${parsed.quantity}x ${parsed.itemName}`;
                        document.getElementById('status').classList.add('active');
                        
                        console.log(`Catalyst opened: ${parsed.quantity}x ${parsed.itemName}`);
                    }
                }
            });
            
            // Update last seen lines (keep last 10)
            lastChatLines = chat.slice(0, 10).map(line => line.text.trim());
        }
    } catch (e) {
        console.error('Error reading chat:', e);
    }
    
    // Continue reading
    setTimeout(readChat, 600); // Check every 600ms
}

// Reset data
document.getElementById('resetBtn').addEventListener('click', function() {
    if (confirm('Are you sure you want to reset all tracked data? This cannot be undone!')) {
        catalystData = {
            totalCatalysts: 0,
            items: {},
            clues: {
                easy: 0,
                medium: 0,
                hard: 0,
                elite: 0,
                master: 0
            }
        };
        saveData();
        updateDisplay();
        document.getElementById('status').textContent = 'Data reset. Monitoring chatbox...';
        document.getElementById('status').classList.add('active');
    }
});

// Initialize
loadData();

// Start chat reader when Alt1 is ready
if (window.alt1) {
    setupChatReader();
}
