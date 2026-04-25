const axios = require('axios');

class RedditScraper {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
    this.subreddits = [
      "education", "Teachers", "k12", "edtech", 
      "school", "admincraft", "Principals", "HigherEducation"
    ];
    this.keywords = [
      "school management software", "student attendance system",
      "student information system", "grade tracking software",
      "school ERP", "managing student attendance",
      "parent teacher communication app", "school administration software",
      "LMS for school", "digitize school records"
    ];
  }

  async getToken() {
    if (this.token && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.token;
    }

    const clientId = process.env.REDDIT_CLIENT_ID;
    const clientSecret = process.env.REDDIT_CLIENT_SECRET;

    if (!clientId || !clientSecret) return null;

    try {
      const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
        'grant_type=client_credentials',
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': process.env.REDDIT_USER_AGENT || 'LeadCRM/1.0'
          }
        }
      );
      this.token = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000;
      return this.token;
    } catch (error) {
      console.error("Reddit Token Error:", error.message);
      return null;
    }
  }

  getMockLeads() {
    console.log("Reddit API unavailable, using mock data");
    return [
      {
        username: "u/principal_sharma",
        platform: "Reddit",
        post_content: "yo our school attendance system is a total mess lol, we have 1500 kids and tracking on paper is killing us, anyone know any good apps??",
        post_url: "https://reddit.com/r/Principals/comments/mock1",
        post_date: new Date(),
        source_keywords: ["student attendance system"],
        is_mock: true
      },
      {
        username: "u/ITHead_DPS",
        platform: "Reddit",
        post_content: "Looking for SaaS-based LMS with REST API support, SSO integration, and RBAC for our school district of 5 schools. Must have 99.9% uptime SLA and dedicated technical support.",
        post_url: "https://reddit.com/r/edtech/comments/mock2",
        post_date: new Date(),
        source_keywords: ["LMS for school"],
        is_mock: true
      }
    ];
  }

  async scrape() {
    const token = await this.getToken();
    if (!token) return this.getMockLeads();

    const leads = [];
    
    // We'll search a random subset of keywords/subreddits to avoid rate limits in this implementation
    const selectedKeyword = this.keywords[Math.floor(Math.random() * this.keywords.length)];
    const selectedSubreddit = this.subreddits[Math.floor(Math.random() * this.subreddits.length)];

    try {
      const response = await axios.get(`https://oauth.reddit.com/r/${selectedSubreddit}/search`, {
        params: { q: selectedKeyword, sort: 'new', limit: 5, t: 'month', restrict_sr: 1 },
        headers: {
          'Authorization': `Bearer ${token}`,
          'User-Agent': process.env.REDDIT_USER_AGENT || 'LeadCRM/1.0'
        }
      });

      const posts = response.data?.data?.children || [];

      for (const post of posts) {
        const content = `${post.data.title} ${post.data.selftext || ''}`.trim();
        const author = post.data.author;
        
        if (content.length < 30) continue;
        if (author === 'AutoModerator' || author === 'deleted') continue;
        if (content.toLowerCase().includes('hiring') || content.toLowerCase().includes('job posting')) continue;

        leads.push({
          username: `u/${author}`,
          platform: 'Reddit',
          post_content: content,
          post_url: `https://reddit.com${post.data.permalink}`,
          post_date: new Date(post.data.created_utc * 1000),
          source_keywords: [selectedKeyword]
        });
      }

      if (leads.length === 0) {
          // If no results, return some mock leads to make the demo work well
          return this.getMockLeads();
      }

      return leads;
    } catch (error) {
      console.error("Reddit Scrape Error:", error.message);
      return this.getMockLeads();
    }
  }
}

module.exports = new RedditScraper();
