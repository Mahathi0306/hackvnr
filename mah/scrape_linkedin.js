require('dotenv').config({ path: './backend/.env' });
const { ApifyClient } = require('apify-client');
const fs = require('fs');

// Initialize the ApifyClient with API token
const client = new ApifyClient({
    token: process.env.APIFY_TOKEN || 'your_apify_token_here',
});

async function scrapeLinkedIn() {
    if (!process.env.APIFY_TOKEN || process.env.APIFY_TOKEN === 'your_apify_token_here') {
        console.log("========================================");
        console.error("⚠️ ERROR: No Apify API token found.");
        console.log("To scrape LinkedIn automatically without getting blocked, we use Apify.");
        console.log("1. Create a free account at https://apify.com");
        console.log("2. Get your API token and add it to mah/backend/.env as APIFY_TOKEN=...");
        console.log("3. Run this script again.");
        console.log("========================================");
        return;
    }

    console.log("🚀 Starting LinkedIn Scraper via Apify...");
    // Prepare Actor input (We use a popular LinkedIn scraper actor on Apify)
    const input = {
        "urls": [
            "https://www.linkedin.com/company/microsoft/" // Target to scrape
        ],
        "deepScrape": false,
        "proxyConfiguration": { "useApifyProxy": true }
    };

    try {
        // Run the Actor and wait for it to finish
        console.log("Running scraper... (This may take a few minutes depending on the target)");
        const run = await client.actor("microworlds/linkedin-profile-scraper").call(input);

        // Fetch and print Actor results from the run's dataset
        console.log('✅ Scraping finished. Fetching dataset items...');
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        // Save to JSON
        const outputFilename = 'scraped_linkedin_data.json';
        fs.writeFileSync(outputFilename, JSON.stringify(items, null, 2));
        console.log(`🎉 Successfully scraped ${items.length} profiles/posts and saved to ${outputFilename}`);
        
    } catch (error) {
        console.error("❌ Scraping failed:", error.message);
    }
}

scrapeLinkedIn();
