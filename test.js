// Test file for catalyst message parsing
// Run this in a browser console or Node.js to test the regex

function normalizeItemName(itemName, originalText) {
    const lowerItem = itemName.toLowerCase();
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

function parseCatalystMessage(text) {
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

// Test cases - all possible catalyst rewards
const testMessages = [
    "The catalyst of alteration contained: 1 x Sealed clue scroll (easy)",
    "The catalyst of alteration contained: 2 x Sealed clue scroll (easy)",
    "The catalyst of alteration contained: 3 x Sealed clue scroll (easy)",
    "",
    "The catalyst of alteration contained: 1 x Sealed clue scroll (medium)",
    "The catalyst of alteration contained: 2 x Sealed clue scroll (medium)",
    "The catalyst of alteration contained: 3 x Sealed clue scroll (medium)",
    "",
    "The catalyst of alteration contained: 1 x Sealed clue scroll (hard)",
    "The catalyst of alteration contained: 2 x Sealed clue scroll (hard)",
    "The catalyst of alteration contained: 3 x Sealed clue scroll (hard)",
    "",
    "The catalyst of alteration contained: 1 x Sealed clue scroll (elite)",
    "The catalyst of alteration contained: 2 x Sealed clue scroll (elite)",
    "The catalyst of alteration contained: 3 x Sealed clue scroll (elite)",
    "",
    "The catalyst of alteration contained: 1 x Sealed clue scroll (master)",
    "The catalyst of alteration contained: 2 x Sealed clue scroll (master)",
    "The catalyst of alteration contained: 3 x Sealed clue scroll (master)",
];

console.log("Testing catalyst message parsing:");
console.log("=".repeat(70));

let testCount = 0;
let passCount = 0;

testMessages.forEach((msg, index) => {
    if (msg === "") {
        console.log("");
        return;
    }
    
    testCount++;
    const result = parseCatalystMessage(msg);
    if (result) {
        passCount++;
        console.log(`✓ Test ${testCount}: ${result.quantity}x ${result.itemName}`);
    } else {
        console.log(`✗ Test ${testCount}: FAILED - "${msg}"`);
    }
});

console.log("\n" + "=".repeat(70));
console.log(`Results: ${passCount}/${testCount} tests passed`);

if (passCount === testCount) {
    console.log("🎉 All tests passed!");
} else {
    console.log("⚠️  Some tests failed!");
}
