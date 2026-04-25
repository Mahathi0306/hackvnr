const Lead = require('../models/Lead');
const redditScraper = require('./redditScraper');
const linkedinScraper = require('./linkedinScraper');
const geminiService = require('./geminiService');

class ScrapeOrchestrator {
  async runFullScrape() {
    const results = {
      reddit: { found: 0, added: 0, skipped: 0, source: 'api' },
      linkedin: { found: 0, added: 0, skipped: 0, source: 'api' },
      errors: []
    }

    const [redditLeads, linkedinLeads] = await Promise.allSettled([
      redditScraper.scrape(),
      linkedinScraper.scrape()
    ]);

    const allLeads = [];
    
    if (redditLeads.status === 'fulfilled') {
      results.reddit.found = redditLeads.value.length;
      if (redditLeads.value.length > 0 && redditLeads.value[0].is_mock) {
        results.reddit.source = 'mock';
      }
      allLeads.push(...redditLeads.value);
    } else {
      results.errors.push("Reddit: " + redditLeads.reason);
      results.reddit.source = 'error';
    }

    if (linkedinLeads.status === 'fulfilled') {
      results.linkedin.found = linkedinLeads.value.length;
      if (linkedinLeads.value.length > 0 && linkedinLeads.value[0].is_mock) {
        results.linkedin.source = 'mock';
      }
      allLeads.push(...linkedinLeads.value);
    } else {
      results.errors.push("LinkedIn: " + linkedinLeads.reason);
      results.linkedin.source = 'error';
    }

    for (const leadData of allLeads) {
      const exists = await Lead.findOne({
        username: leadData.username,
        platform: leadData.platform
      });
      
      if (exists) {
        if (leadData.platform === 'Reddit') results.reddit.skipped++;
        else results.linkedin.skipped++;
        continue;
      }

      const { score, reason } = await geminiService.calculateIntentScore(leadData.post_content);

      const lead = new Lead({
        ...leadData,
        intent_score: score,
        intent_reason: reason,
        activity_log: [{ 
          action: "Lead scraped from " + leadData.platform, 
          timestamp: new Date() 
        }]
      });
      
      await lead.save();

      if (leadData.platform === 'Reddit') results.reddit.added++;
      else results.linkedin.added++;
    }

    return results;
  }
}

module.exports = new ScrapeOrchestrator();
