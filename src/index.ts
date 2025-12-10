import * as a1lib from "alt1";
import ChatBoxReader from "alt1/chatbox";

if (window.alt1) {
    alt1.identifyAppUrl("./appconfig.json");
}

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
    const catalystRegex = /The catalyst of alteration contained:\s*(\d+)\s*x\s*(.+?)$/i;
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

// Chat reader
let chatReader: ChatBoxReader;
let lastChatLines: string[] = [];

function setupChatReader() {
    if (!window.alt1) {
        document.getElementById('status')!.textContent = 'Alt1 Toolkit not detected!';
        document.getElementById('status')!.classList.add('error');
        return;
    }

    chatReader = new ChatBoxReader();
    chatReader.find();

    if (!chatReader.pos) {
        document.getElementById('status')!.textContent = 'Chatbox not found. Make sure it\'s visible!';
        document.getElementById('status')!.classList.add('error');
        setTimeout(setupChatReader, 2000);
        return;
    }

    document.getElementById('status')!.textContent = 'Monitoring chatbox...';
    document.getElementById('status')!.classList.add('active');
    document.getElementById('status')!.classList.remove('error');

    readChat();
}

function readChat() {
    if (!chatReader || !chatReader.pos) {
        setupChatReader();
        return;
    }

    try {
        const chat = chatReader.read();

        if (chat) {
            chat.forEach(line => {
                const lineText = line.text.trim();

                if (!lastChatLines.includes(lineText) && lineText.includes('The catalyst of alteration contained:')) {
                    const parsed = parseCatalystMessage(lineText);

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

                        console.log(`Catalyst opened: ${parsed.quantity}x ${parsed.itemName}`);
                    }
                }
            });

            lastChatLines = chat.slice(0, 10).map(line => line.text.trim());
        }
    } catch (e) {
        console.error('Error reading chat:', e);
    }

    setTimeout(readChat, 600);
}

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
            saveData();
            updateDisplay();
            document.getElementById('status')!.textContent = 'Data reset. Monitoring chatbox...';
            document.getElementById('status')!.classList.add('active');
        }
    });

    // Initialize
    loadData();

    if (window.alt1) {
        setupChatReader();
    }
});