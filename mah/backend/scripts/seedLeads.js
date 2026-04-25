const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Lead = require('../models/Lead');
const User = require('../models/User');

const seedLeads = async () => {
  try {
    // 1. Create Demo User
    let demoUser = await User.findOne({ username: 'demo_rep' });
    if (!demoUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('demo123', salt);
      demoUser = new User({ username: 'demo_rep', password: hashedPassword, role: 'sales_rep' });
      await demoUser.save();
      console.log('Demo user created');
    }

    // 2. Clear existing leads to ensure clean seed
    await Lead.deleteMany({});
    
    // 3. Insert mock leads
    const leadsToInsert = [
      // Reddit Leads
      {
        username: "u/principal_sharma",
        platform: "Reddit",
        post_content: "yo our school attendance system is a total mess lol, we have 1500 kids and tracking on paper is killing us, anyone know any good apps??",
        status: "New",
        intent_score: 9,
        intent_reason: "High urgency, mentions specific scale, actively seeking solution",
        activity_log: [{ action: "Lead scraped from Reddit", timestamp: new Date() }]
      },
      {
        username: "u/ITHead_DPS",
        platform: "Reddit",
        post_content: "Looking for SaaS-based LMS with REST API support, SSO integration, and RBAC for our school district of 5 schools. Must have 99.9% uptime SLA and dedicated technical support.",
        status: "Drafted",
        intent_score: 10,
        intent_reason: "High urgency, Technical focus",
        generated_email: "Subject: LMS for 5 schools with 99.9% SLA\n\nHi there,\n\nI noticed you are looking for a robust LMS with REST API and SSO. Our system provides 99.9% uptime strictly and supports RBAC.",
        detected_tone: "Technical",
        activity_log: [
          { action: "Lead scraped from Reddit", timestamp: new Date(Date.now() - 3600000) },
          { action: "Email drafted", timestamp: new Date() }
        ]
      },
      {
        username: "u/frustrated_principal",
        platform: "Reddit",
        post_content: "parents keep calling every day asking about kids grades and attendance, i literally cannot handle this anymore, is there an app where parents can just check themselves??",
        status: "Contacted",
        intent_score: 8,
        intent_reason: "Clear pain point involving parent communication.",
        activity_log: [
          { action: "Lead scraped from Reddit", timestamp: new Date(Date.now() - 7200000) },
          { action: "Email drafted", timestamp: new Date(Date.now() - 3600000) },
          { action: "Email dispatched", timestamp: new Date() }
        ]
      },
      {
        username: "u/SmallSchoolOwner",
        platform: "Reddit",
        post_content: "i run a small school with like 200 kids, cant afford expensive software at all, any free or cheap options that handle basic attendance and grades?",
        status: "New",
        intent_score: 7,
        intent_reason: "Clear need but budget constraint",
        activity_log: [{ action: "Lead scraped from Reddit", timestamp: new Date() }]
      },
      {
        username: "u/NewSchoolCoord",
        platform: "Reddit",
        post_content: "Just started as coordinator at a new school with zero digital systems. Everything is on paper registers. Where do I even start with digitizing student records and attendance?",
        status: "New",
        intent_score: 8,
        intent_reason: "Looking to digitize records entirely from baseline.",
        activity_log: [{ action: "Lead scraped from Reddit", timestamp: new Date() }]
      },
      // LinkedIn Leads
      {
        username: "Rajesh Kumar - School Principal",
        full_name: "Rajesh Kumar",
        profile_url: "https://linkedin.com/in/rajesh-kumar",
        platform: "LinkedIn",
        post_content: "As a School Principal with 15 years of experience, I am actively evaluating modern Student Information Systems for our institution of 2,400 students. Require comprehensive solution for attendance, grade management, and parent communication portal.",
        status: "New",
        intent_score: 10,
        intent_reason: "Decision maker, specific scale, actively evaluating",
        activity_log: [{ action: "Lead scraped from LinkedIn", timestamp: new Date() }]
      },
      {
        username: "Priya Nair - EdTech Coordinator",
        full_name: "Priya Nair",
        profile_url: "https://linkedin.com/in/priya-nair",
        platform: "LinkedIn",
        post_content: "Excited to announce we are digitizing school operations! Looking for recommendations on school management platforms integrating attendance, academics, and parent portal. Budget-friendly options preferred for 500-student institution. #EdTech",
        status: "Drafted",
        intent_score: 8,
        intent_reason: "Seeking robust platform but sensitive to budget.",
        detected_tone: "LinkedIn Professional",
        generated_email: "Subject: Re: Digitizing operations for your 500-student institution\n\nDear Priya,\n\nI came across your post on LinkedIn. We offer a budget-friendly suite perfectly suited for managing 500 students. Let's connect.",
        activity_log: [
          { action: "Lead scraped from LinkedIn", timestamp: new Date(Date.now() - 3600000) },
          { action: "Email drafted", timestamp: new Date() }
        ]
      },
      {
        username: "Dr. Suresh Menon",
        full_name: "Dr. Suresh Menon",
        profile_url: "https://linkedin.com/in/suresh-menon",
        platform: "LinkedIn",
        post_content: "Our district of 8 schools is seeking enterprise-grade SIS with multi-school support, centralized reporting, API integration, and SSO. Currently evaluating vendors. Open to connecting with solution providers.",
        status: "New",
        intent_score: 10,
        intent_reason: "High intent, district level purchase.",
        activity_log: [{ action: "Lead scraped from LinkedIn", timestamp: new Date() }]
      },
      {
        username: "Anita Sharma",
        full_name: "Anita Sharma",
        profile_url: "https://linkedin.com/in/anita-sharma",
        platform: "LinkedIn",
        post_content: "Struggling with manual attendance registers for 3 years. Finally got management approval for a school management system. Any educators who implemented one recently? Would love advice on what worked.",
        status: "Contacted",
        intent_score: 8,
        intent_reason: "Got approval, actively researching.",
        activity_log: [
          { action: "Lead scraped from LinkedIn", timestamp: new Date(Date.now() - 7200000) },
          { action: "Email drafted", timestamp: new Date(Date.now() - 3600000) },
          { action: "Email dispatched", timestamp: new Date() }
        ]
      },
      {
        username: "Mohammed Al-Farsi",
        full_name: "Mohammed Al-Farsi",
        profile_url: "https://linkedin.com/in/mohammed-al-farsi",
        platform: "LinkedIn",
        post_content: "School ERP is end-of-life. Urgently migrating before academic year. Requirements: cloud-based, mobile parent app, gradebook, attendance analytics. Timeline: 3 months.",
        status: "New",
        intent_score: 10,
        intent_reason: "Urgent timeline, specific requirements, active decision",
        activity_log: [{ action: "Lead scraped from LinkedIn", timestamp: new Date() }]
      }
    ];

    await Lead.insertMany(leadsToInsert);
    console.log(`Seeded ${leadsToInsert.length} leads.`);
    
  } catch (err) {
    console.error('Seed Error:', err);
    throw err; // Allow API route to catch it
  }
};

module.exports = seedLeads;

// Allow running manually via node
if (require.main === module) {
  require('dotenv').config();
  mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/leadcrm", { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
      await seedLeads();
      process.exit();
    })
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}
