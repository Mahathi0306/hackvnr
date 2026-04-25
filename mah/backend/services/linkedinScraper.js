const axios = require('axios');

class LinkedinScraper {
  constructor() {
    this.keywords = [
      "school management software recommendation",
      "student attendance tracking system",
      "looking for school ERP",
      "school administration software",
      "student information system recommendation"
    ];
  }

  getMockLeads() {
    console.log("LinkedIn scraper unavailable, using mock data");
    return [
      {
        username: "Rajesh Kumar",
        full_name: "Rajesh Kumar",
        platform: "LinkedIn",
        post_content: "As a School Principal with 15 years of experience, I am actively evaluating modern Student Information Systems for our institution. We currently manage 2,400 students and require a comprehensive solution for attendance, grade management, and parent communication. Any recommendations from fellow educators would be greatly appreciated.",
        post_date: new Date(),
        post_url: "https://linkedin.com/post/mock1",
        profile_url: "https://linkedin.com/in/mock1",
        source_keywords: ["school management software"],
        is_mock: true
      },
      {
        username: "Priya Nair - EdTech Coordinator",
        full_name: "Priya Nair",
        platform: "LinkedIn",
        post_content: "Excited to announce we are digitizing our school's operations! Looking for recommendations on the best school management platforms that integrate attendance, academics, and parent portal. Budget-friendly options preferred for a 500-student institution. #EdTech #SchoolManagement",
        post_date: new Date(),
        post_url: "https://linkedin.com/post/mock2",
        profile_url: "https://linkedin.com/in/mock2",
        source_keywords: ["school ERP"],
        is_mock: true
      }
    ];
  }

  async scrape() {
    const token = process.env.APIFY_TOKEN;
    if (!token) return this.getMockLeads();

    const selectedKeyword = this.keywords[Math.floor(Math.random() * this.keywords.length)];
    const leads = [];

    try {
      // Step 1: Trigger Apify Run
      const runRes = await axios.post(
        'https://api.apify.com/v2/acts/apify~linkedin-posts-search/runs',
        {
          keywords: selectedKeyword,
          maxResults: 5,
          proxy: { useApifyProxy: true }
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const runId = runRes.data.data.id;

      // Step 2: Poll for results
      let status = "RUNNING";
      let attempts = 0;
      
      while (status === "RUNNING" && attempts < 12) {
        await new Promise(r => setTimeout(r, 5000)); // wait 5 seconds
        attempts++;
        
        const statusRes = await axios.get(
          `https://api.apify.com/v2/actor-runs/${runId}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        status = statusRes.data.data.status;
      }

      if (status !== "SUCCEEDED") {
        console.error("Apify run failed or timed out.");
        return this.getMockLeads();
      }

      // Step 3: Fetch results
      const datasetRes = await axios.get(
        `https://api.apify.com/v2/actor-runs/${runId}/dataset/items`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const items = datasetRes.data || [];

      // Step 4 & 5: Extract and Filter
      for (const item of items) {
        const content = item.text || item.content || item.postText || "";
        if (content.length < 30) continue;

        leads.push({
          username: item.authorName || item.profileUrl || "LinkedIn User",
          full_name: item.authorName || "",
          profile_url: item.authorProfileUrl || item.profileUrl || "",
          platform: "LinkedIn",
          post_content: content,
          post_url: item.postUrl || item.url || "",
          post_date: new Date(item.postedAt || item.date || Date.now()),
          source_keywords: [selectedKeyword]
        });
      }

      if (leads.length === 0) return this.getMockLeads();
      return leads;

    } catch (error) {
      console.error("LinkedIn Scrape Error:", error.message);
      return this.getMockLeads();
    }
  }
}

module.exports = new LinkedinScraper();
