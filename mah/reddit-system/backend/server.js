require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios');
const natural = require('natural');
const cron = require('cron');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite Database
const db = new sqlite3.Database('./reddit_leads.db', (err) => {
    if (err) console.error("DB Connection Error:", err.message);
    else console.log('Connected to the SQLite database.');
});

// Setup Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        subreddit TEXT NOT NULL,
        author TEXT NOT NULL,
        upvotes INTEGER DEFAULT 0,
        comments_count INTEGER DEFAULT 0,
        url TEXT NOT NULL,
        created_at DATETIME
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS leads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        post_id TEXT,
        sentiment TEXT,
        lead_score INTEGER DEFAULT 0,
        category TEXT,
        FOREIGN KEY(post_id) REFERENCES posts(id)
    )`);
});

const Analyzer = natural.SentimentAnalyzer;
const stemmer = natural.PorterStemmer;
const analyzer = new Analyzer("English", stemmer, "afinn");

// Helper: Sentiment & Lead Scoring Logic
function analyzePost(title, content) {
    const text = `${title} ${content}`;
    const words = new natural.WordTokenizer().tokenize(text);
    const score = analyzer.getSentiment(words);
    
    let sentiment = 'Neutral';
    if (score > 0.1) sentiment = 'Positive';
    if (score < -0.1) sentiment = 'Negative';

    let lead_score = 0;
    const lowerText = text.toLowerCase();
    
    if (lowerText.match(/(suggest|recommend|looking for|need|help me find)/)) lead_score += 4;
    if (lowerText.match(/(software|app|platform|system|tool|crm|lms)/)) lead_score += 3;
    if (lowerText.match(/(price|cost|budget|pay)/)) lead_score += 2;
    if (lowerText.includes("?") && lead_score > 0) lead_score += 1;

    let category = "General";
    if (lead_score >= 7) category = "High Intent Potential Customer";
    else if (lowerText.includes("sucks") || lowerText.includes("hate")) category = "Complaint / Competitor Gap";
    else if (lowerText.includes("?")) category = "Question";

    return { sentiment, lead_score, category };
}

// Promise wrapper for SQLite run
const dbRun = (query, params = []) => new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
        if (err) reject(err);
        else resolve(this);
    });
});

const dbGet = (query, params = []) => new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
        if (err) reject(err);
        else resolve(row);
    });
});

const dbAll = (query, params = []) => new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
    });
});

// Scrape Reddit Function
async function scrapeReddit() {
    const keywords = ["school management system", "CRM for schools", "student attendance software", "education software"];
    let newPostsCount = 0;
    let newLeadsCount = 0;

    for (const keyword of keywords) {
        try {
            const response = await axios.get(`https://www.reddit.com/search.json?q=${encodeURIComponent(keyword)}&sort=new&limit=20`, {
                headers: { 'User-Agent': 'Mozilla/5.0 LeadCRM/1.0' }
            });
            
            const posts = response.data.data.children;

            for (const item of posts) {
                const p = item.data;
                const postId = p.id;

                const existing = await dbGet('SELECT id FROM posts WHERE id = ?', [postId]);
                if (existing) continue;

                await dbRun(`INSERT INTO posts (id, title, content, subreddit, author, upvotes, comments_count, url, created_at)
                             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
                    [postId, p.title, p.selftext, p.subreddit, p.author, p.score, p.num_comments, `https://reddit.com${p.permalink}`, new Date(p.created_utc * 1000).toISOString()]);

                newPostsCount++;

                const { sentiment, lead_score, category } = analyzePost(p.title, p.selftext);
                
                if (lead_score > 0) {
                    await dbRun(`INSERT INTO leads (post_id, sentiment, lead_score, category) VALUES (?, ?, ?, ?)`, 
                        [postId, sentiment, lead_score, category]);
                    newLeadsCount++;
                }
            }
        } catch (error) {
            console.error(`Error scraping for ${keyword}:`, error.message);
        }
    }
    return { newPostsCount, newLeadsCount };
}

// API: Trigger Scrape Manually
app.get('/api/scrape', async (req, res) => {
    const results = await scrapeReddit();
    res.json({ message: "Scraping completed", ...results });
});

// API: Get All Posts
app.get('/api/posts', async (req, res) => {
    try {
        const posts = await dbAll('SELECT * FROM posts ORDER BY created_at DESC');
        res.json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: Get High Quality Leads
app.get('/api/leads', async (req, res) => {
    try {
        const query = `
            SELECT l.id as lead_id, l.sentiment, l.lead_score, l.category,
                   p.id as post_id, p.title, p.content, p.subreddit, p.author, p.url, p.upvotes, p.comments_count, p.created_at
            FROM leads l
            JOIN posts p ON l.post_id = p.id
            WHERE l.lead_score >= 4
            ORDER BY l.lead_score DESC, p.created_at DESC
        `;
        const leads = await dbAll(query);
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

const job = new cron.CronJob('*/30 * * * *', async () => {
    console.log("Auto-running Reddit Scraper...");
    await scrapeReddit();
});
job.start();

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
