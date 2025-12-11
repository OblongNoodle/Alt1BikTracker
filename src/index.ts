import * as a1lib from "alt1";
import ChatBoxReader from "alt1/chatbox";

if (window.alt1) {
    alt1.identifyAppUrl("./appconfig.json");
}

const timestampRegex = /\[\d{2}:\d{2}:\d{2}\]/g;
const reader = new ChatBoxReader();

// Add catalyst message colors - both measured and from working apps
reader.readargs = {
    colors: [
        a1lib.mixColor(255, 255, 255),  // White - timestamps
        a1lib.mixColor(255, 255, 0),    // Yellow
        a1lib.mixColor(255, 128, 0),    // Orange
        a1lib.mixColor(127, 169, 255),  // Light blue
        a1lib.mixColor(0, 255, 0),      // Standard green
        a1lib.mixColor(20, 127, 7),     // Catalyst green - measured with color picker
        a1lib.mixColor(30, 255, 0),     // Catalyst green - from afk warden
        a1lib.mixColor(255, 0, 0),      // Red
    ]
};

// Data storage
let catalystData: {
    totalCatalysts: number;
    items: { [key: string]: number };
    clues: {
        easy: number;
        medium: number;
        hard: number;
        elite: number;
        master: number;
    };
} = {
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

let chatHistory: string[] = [];

// Load saved data
function loadData() {
    const saved = localStorage.getItem('catalystTrackerData');
    if (saved) {
        try {
            const loaded = JSON.parse(saved);
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
    console.log('Updating display with data:', catalystData);
    document.getElementById('totalCatalysts')!.textContent = catalystData.totalCatalysts.toString();
    document.getElementById('easyClues')!.textContent = catalystData.clues.easy.toString();
    document.getElementById('mediumClues')!.textContent = catalystData.clues.medium.toString();
    document.getElementById('hardClues')!.textContent = catalystData.clues.hard.toString();
    document.getElementById('eliteClues')!.textContent = catalystData.clues.elite.toString();
    document.getElementById('masterClues')!.textContent = catalystData.clues.master.toString();
    console.log('Display updated');
}

// Normalize item names
function normalizeItemName(itemName: string, originalText: string): string {
    const lowerText = originalText.toLowerCase();

    if (lowerText.includes('sealed clue scroll')) {
        if (lowerText.includes('(easy)')) return 'Sealed clue scroll (easy)';
        if (lowerText.includes('(medium)')) return 'Sealed clue scroll (medium)';
        if (lowerText.includes('(hard)')) return 'Sealed clue scroll (hard)';
        if (lowerText.includes('(elite)')) return 'Sealed clue scroll (elite)';
        if (lowerText.includes('(master)')) return 'Sealed clue scroll (master)';
    }

    return itemName.trim();
}

// Parse chat message
function parseCatalystMessage(text: string): { quantity: number, itemName: string } | null {
    // Match "alteration contained: X x ItemName" - handle OCR typos
    // Look for: (a|ai)teration contained : number x item
    const catalystRegex = /(?:a|ai)teration\s+contained\s*:\s*(\d+)\s*x\s*(.+?)$/i;
    const match = text.match(catalystRegex);

    if (match) {
        const quantity = parseInt(match[1]);
        let itemName = match[2].trim();

        // Fix common OCR typos in item names
        itemName = itemName
            .replace(/seaied/gi, 'Sealed')
            .replace(/ciue/gi, 'clue')
            .replace(/scroii/gi, 'scroll')
            .replace(/eiite/gi, 'elite')
            .replace(/nard/gi, 'hard')
            .replace(/eiegant/gi, 'elegant')
            .replace(/\(nard\)/gi, '(hard)')
            .replace(/\(eiite\)/gi, '(elite)')
            .replace(/\(eiegant\)/gi, '(elegant)');

        itemName = normalizeItemName(itemName, text);
        return { quantity, itemName };
    }

    return null;
}

// Update clue counts
function updateClueCount(itemName: string, quantity: number) {
    const lowerName = itemName.toLowerCase();
    if (lowerName.includes('sealed clue scroll')) {
        if (lowerName.includes('(easy)')) catalystData.clues.easy += quantity;
        else if (lowerName.includes('(medium)')) catalystData.clues.medium += quantity;
        else if (lowerName.includes('(hard)')) catalystData.clues.hard += quantity;
        else if (lowerName.includes('(elite)')) catalystData.clues.elite += quantity;
        else if (lowerName.includes('(master)')) catalystData.clues.master += quantity;
    }
}

// Process chat (ComponentCounter method)
function processChat(opts: any[]) {
    let chatStr = "";
    let chatArr: string[] = [];

    if (opts.length != 0) {
        for (let i = 0; i < opts.length; i++) {
            const line = opts[i];

            // Skip first line if no timestamp
            if (!line.text.match(timestampRegex) && i == 0) {
                continue;
            }

            // Beginning of new chat line (has timestamp)
            if (line.text.match(timestampRegex)) {
                if (i > 0) {
                    chatStr += "\n";
                }
                chatStr += line.text + " ";
                continue;
            }

            // Continuation of previous line (no timestamp)
            chatStr += line.text;
        }
    }

    if (chatStr.trim() != "") {
        chatArr = chatStr.trim().split("\n");
    }

    return chatArr;
}

function isInHistory(chatLine: string): boolean {
    return chatHistory.includes(chatLine.trim());
}

function updateChatHistory(chatLine: string) {
    chatHistory.push(chatLine.trim());
    // Keep only last 100 lines
    if (chatHistory.length > 100) {
        chatHistory.shift();
    }
}

function readChatbox() {
    const opts = reader.read() || [];

    // Debug: log raw chat lines
    if (opts.length > 0) {
        console.log('=== Raw chat lines ===');
        opts.forEach((line, i) => {
            console.log(`Line ${i}: "${line.text}"`);
        });
    }

    const chatArr = processChat(opts);

    // Store last few lines to look back when we find "sent to your bank"
    let recentLines: string[] = [];
    let processedInThisBatch = new Set<string>(); // Track what we've already processed

    for (let chatLine of chatArr) {
        chatLine = chatLine.trim();

        // Skip empty lines or timestamp-only lines
        if (!chatLine || chatLine.match(/^\[\d{2}:\d{2}:\d{2}\]$/)) {
            continue;
        }

        if (isInHistory(chatLine)) {
            console.log(`Found in history: ${chatLine}, skipping.`);
            continue;
        }

        updateChatHistory(chatLine);

        console.log('New chat line:', chatLine);

        // Add to recent lines buffer
        recentLines.push(chatLine);
        if (recentLines.length > 5) {
            recentLines.shift(); // Keep only last 5 lines
        }

        // TRIGGER: "sent to your bank" - look back at previous lines!
        if (chatLine.toLowerCase().includes('sent to your bank') || chatLine.toLowerCase().includes('sent to the bank')) {
            console.log('🏦 Found "sent to your bank" - checking previous lines...');
            console.log('Recent lines:', recentLines);

            // Check the last few lines for catalyst message (handle OCR typos)
            for (let i = recentLines.length - 1; i >= 0; i--) {
                const prevLine = recentLines[i];

                // Skip if we already processed this line
                if (processedInThisBatch.has(prevLine)) {
                    console.log('Already processed this catalyst, skipping duplicate');
                    continue;
                }

                if (prevLine.includes('alteration contained') || prevLine.includes('aiteration contained') ||
                    prevLine.includes('cataiyst') || prevLine.includes('catalyst')) {
                    console.log('📦 Found catalyst message in history!');
                    const parsed = parseCatalystMessage(prevLine);
                    console.log('Parsed:', parsed);

                    if (parsed) {
                        processedInThisBatch.add(prevLine); // Mark as processed

                        catalystData.totalCatalysts++;

                        if (catalystData.items[parsed.itemName]) {
                            catalystData.items[parsed.itemName] += parsed.quantity;
                        } else {
                            catalystData.items[parsed.itemName] = parsed.quantity;
                        }

                        updateClueCount(parsed.itemName, parsed.quantity);
                        saveData();
                        updateDisplay();


                        console.log(`✓ Catalyst tracked: ${parsed.quantity}x ${parsed.itemName}`);
                        break;
                    }
                }
            }
        }

        // Primary detection: "alteration contained" line (in case it does read)
        if ((chatLine.includes('alteration contained') || chatLine.includes('aiteration contained')) &&
            !processedInThisBatch.has(chatLine)) {
            console.log('Processing catalyst line:', chatLine);
            const parsed = parseCatalystMessage(chatLine);
            console.log('Parsed:', parsed);

            if (parsed) {
                processedInThisBatch.add(chatLine); // Mark as processed

                catalystData.totalCatalysts++;

                if (catalystData.items[parsed.itemName]) {
                    catalystData.items[parsed.itemName] += parsed.quantity;
                } else {
                    catalystData.items[parsed.itemName] = parsed.quantity;
                }

                updateClueCount(parsed.itemName, parsed.quantity);
                saveData();
                updateDisplay();

                console.log(`✓ Catalyst tracked: ${parsed.quantity}x ${parsed.itemName}`);
            }
        }
    }
}

// Initialize
window.setTimeout(function () {
    reader.find();

    let findChat = setInterval(function () {
        if (reader.pos === null) {
            reader.find();
        } else {
            clearInterval(findChat);

            // Select the first (top-most) chatbox, like the working app does
            if (reader.pos.boxes && reader.pos.boxes.length > 0) {
                console.log(`Found ${reader.pos.boxes.length} chatboxes`);
                console.log('Chatbox details:', reader.pos.boxes);
                reader.pos.mainbox = reader.pos.boxes[0];
                console.log('Selected mainbox:', reader.pos.mainbox);
            }


            loadData();

            // Setup reset button now that we know DOM is ready
            setupResetButton();

            setInterval(function () {
                readChatbox();
            }, 600);
        }
    }, 1000);
}, 50);

// Reset data - attach immediately since DOM might already be loaded
function setupResetButton() {
    console.log('Setting up reset button...');
    const resetBtn = document.getElementById('resetBtn');
    console.log('Reset button found:', resetBtn);
    if (resetBtn) {
        resetBtn.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Reset button clicked!');
            console.log('Before reset:', JSON.stringify(catalystData));

            catalystData.totalCatalysts = 0;
            catalystData.items = {};
            catalystData.clues = {
                easy: 0,
                medium: 0,
                hard: 0,
                elite: 0,
                master: 0
            };

            console.log('After reset:', JSON.stringify(catalystData));
            chatHistory = [];
            saveData();
            console.log('Data saved');
            updateDisplay();
            console.log('Display updated');
            console.log('Data reset complete');
        });
        console.log('Reset button event listener attached');
    } else {
        console.error('Reset button not found!');
    }
}