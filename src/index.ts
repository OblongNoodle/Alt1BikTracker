import * as a1lib from "alt1";
import ChatBoxReader from "alt1/chatbox";

if (window.alt1) {
    alt1.identifyAppUrl("./appconfig.json");
}

const timestampRegex = /\[\d{2}:\d{2}:\d{2}\]/g;
const reader = new ChatBoxReader();

// Data storage
let catalystData = {
    totalCatalysts: 0,
    items: {} as Record<string, number>,
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
    document.getElementById('totalCatalysts')!.textContent = catalystData.totalCatalysts.toString();
    document.getElementById('easyClues')!.textContent = catalystData.clues.easy.toString();
    document.getElementById('mediumClues')!.textContent = catalystData.clues.medium.toString();
    document.getElementById('hardClues')!.textContent = catalystData.clues.hard.toString();
    document.getElementById('eliteClues')!.textContent = catalystData.clues.elite.toString();
    document.getElementById('masterClues')!.textContent = catalystData.clues.master.toString();

    const itemsList = document.getElementById('itemsList')!;

    if (Object.keys(catalystData.items).length === 0) {
        itemsList.innerHTML = '<div style="color: #aaa; text-align: center; padding: 20px;">No items tracked yet. Open some catalysts!</div>';
    } else {
        const sortedItems = Object.entries(catalystData.items).sort((a, b) => b[1] - a[1]);
        itemsList.innerHTML = sortedItems.map(([item, count]) => `
            <div class="item-row">
                <span class="item-name">${item}</span>
                <span class="item-count">${count}</span>
            </div>
        `).join('');
    }
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
    const catalystRegex = /The catalyst of alteration contained\s*:\s*(\d+)\s*x\s*(.+?)$/i;
    const match = text.match(catalystRegex);

    if (match) {
        const quantity = parseInt(match[1]);
        let itemName = match[2].trim();
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

        if (chatLine.includes('The catalyst of alteration contained')) {
            console.log('Processing catalyst line:', chatLine);
            const parsed = parseCatalystMessage(chatLine);
            console.log('Parsed:', parsed);

            if (parsed) {
                catalystData.totalCatalysts++;

                if (catalystData.items[parsed.itemName]) {
                    catalystData.items[parsed.itemName] += parsed.quantity;
                } else {
                    catalystData.items[parsed.itemName] = parsed.quantity;
                }

                updateClueCount(parsed.itemName, parsed.quantity);
                saveData();
                updateDisplay();

                document.getElementById('status')!.textContent = `Tracked: ${parsed.quantity}x ${parsed.itemName}`;
                document.getElementById('status')!.classList.add('active');

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

            document.getElementById('status')!.textContent = 'Monitoring chatbox...';
            document.getElementById('status')!.classList.add('active');
            document.getElementById('status')!.classList.remove('error');

            loadData();

            setInterval(function () {
                readChatbox();
            }, 600);
        }
    }, 1000);
}, 50);

// Reset data
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('resetBtn')?.addEventListener('click', function() {
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
            chatHistory = [];
            saveData();
            updateDisplay();
            document.getElementById('status')!.textContent = 'Data reset. Monitoring chatbox...';
            document.getElementById('status')!.classList.add('active');
        }
    });
});