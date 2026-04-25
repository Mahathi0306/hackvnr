const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  username: { type: String, required: true },
  full_name: { type: String, default: '' },
  profile_url: { type: String, default: '' },
  platform: { 
    type: String, 
    enum: ['Reddit', 'LinkedIn'],
    required: true 
  },
  post_content: { type: String, required: true },
  post_url: { type: String, default: '' },
  post_date: { type: Date },
  status: { 
    type: String, 
    enum: ['New', 'Drafted', 'Contacted'], 
    default: 'New' 
  },
  generated_email: { type: String, default: '' },
  detected_tone: { type: String, default: '' },
  intent_score: { type: Number, default: 0 },
  intent_reason: { type: String, default: '' },
  activity_log: [
    {
      action: { type: String },
      timestamp: { type: Date, default: Date.now }
    }
  ],
  source_keywords: [String],
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', leadSchema);
