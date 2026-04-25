const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Lead = require('../models/Lead');
const scrapeOrchestrator = require('../services/scrapeOrchestrator');
const geminiService = require('../services/geminiService');

// GET /api/crm/leads
router.get('/leads', auth, async (req, res) => {
  try {
    const { status, platform, sort } = req.query;
    let query = {};
    if (status && status !== 'All Status') query.status = status;
    if (platform && platform !== 'All') query.platform = platform;
    
    let sortObj = { created_at: -1 };
    if (sort === 'Highest Intent') sortObj = { intent_score: -1 };

    const leads = await Lead.find(query).sort(sortObj);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// GET /api/crm/leads/stats
router.get('/leads/stats', auth, async (req, res) => {
  try {
    const total = await Lead.countDocuments();
    const newCount = await Lead.countDocuments({ status: 'New' });
    const drafted = await Lead.countDocuments({ status: 'Drafted' });
    const contacted = await Lead.countDocuments({ status: 'Contacted' });
    const reddit_count = await Lead.countDocuments({ platform: 'Reddit' });
    const linkedin_count = await Lead.countDocuments({ platform: 'LinkedIn' });
    
    const intentScores = await Lead.aggregate([{ $group: { _id: null, avg_intent: { $avg: '$intent_score' } } }]);
    const avg_intent_score = intentScores.length > 0 ? intentScores[0].avg_intent.toFixed(1) : 0;

    res.json({ total, new: newCount, drafted, contacted, reddit_count, linkedin_count, avg_intent_score });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/crm/scrape
router.post('/scrape', auth, async (req, res) => {
  try {
    const results = await scrapeOrchestrator.runFullScrape();
    res.json({ message: "Scrape complete", ...results });
  } catch (err) {
    res.status(500).json({ message: 'Server error during scrape', error: err.message });
  }
});

// POST /api/crm/leads/:leadId/generate-email
router.post('/leads/:leadId/generate-email', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    const result = await geminiService.generateEmail(lead);
    
    lead.generated_email = result.fullEmail;
    lead.detected_tone = result.tone;
    lead.status = 'Drafted';
    lead.activity_log.push({ action: "Email drafted", timestamp: new Date() });
    
    await lead.save();
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message || 'AI service unavailable. Please try again.' });
  }
});

// POST /api/crm/leads/:leadId/send
router.post('/leads/:leadId/send', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    lead.status = 'Contacted';
    const numToRecord = lead.activity_log.length; // Ensure order
    lead.activity_log.push({ action: "Email dispatched", timestamp: new Date() });
    await lead.save();

    res.json({ success: true, timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/crm/leads/:leadId
router.delete('/leads/:leadId', auth, async (req, res) => {
  try {
    await Lead.findByIdAndDelete(req.params.leadId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
