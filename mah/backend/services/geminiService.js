const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.init();
  }

  init() {
    if (process.env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    }
  }

  async calculateIntentScore(post_content) {
    if (!this.model) {
      this.init();
      if (!this.model) return { score: 5, reason: "Gemini API key not configured" };
    }

    try {
      const prompt = `Rate this social media post 1-10 for likelihood of purchasing school management software.

Post: ${post_content}

Scoring:
10 = Urgently seeking, decision maker confirmed
8-9 = Clear pain point, actively evaluating
6-7 = Has the problem, not yet actively searching  
4-5 = Mentions topic, unclear if buyer
1-3 = Loosely related, unlikely buyer

Return JSON only:
{
  "score": [number 1-10],
  "reason": "[one sentence explanation]"
}`;
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();
      let match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const json = JSON.parse(match[0]);
        return {
          score: parseInt(json.score) || 5,
          reason: json.reason || "Analyzed but reason missing"
        };
      }
      return { score: 5, reason: "Could not parse Gemini response" };
    } catch (error) {
      console.error("Gemini API error (Intent Score):", error.message);
      return { score: 5, reason: "Manual review needed" };
    }
  }

  async generateEmail(lead) {
    if (!this.model) {
      this.init();
      if (!this.model) {
        console.warn("Gemini API key not configured. Using mock email generator.");
        return this._getMockEmail(lead);
      }
    }

    try {
      const prompt = `You are an expert sales copywriter for a school management software company.

Carefully analyze the writing style of this lead's post, then write an outreach email that PERFECTLY MIRRORS their communication style.

Lead Details:
Platform: ${lead.platform}
Post Content: "${lead.post_content}"

TONE DETECTION - identify which applies:

CASUAL (signals: hey, lol, tbh, gonna, cant, short sentences, missing punctuation, lowercase):
→ Write casually: contractions, informal words, short punchy sentences, friendly opener like "Hey [Name]!" or "Saw your post and had to reach out"

FORMAL (signals: proper grammar, professional titles, complete sentences, "we are evaluating", "seeking recommendations", "institution"):
→ Write formally: "Dear [Name]," proper structure, professional vocabulary, formal sign-off

TECHNICAL (signals: ERP, SaaS, API, SSO, LMS, metrics, integration, enterprise, uptime):
→ Match their jargon: mention REST API, role-based access, multi-tenant architecture, SLA, data analytics dashboard, SSO support

FRUSTRATED (signals: cant handle, killing us, exhausting, nightmare, struggling, finally got approval):
→ Lead with empathy: "I completely understand...", validate their pain, then gently offer solution

BUDGET-CONSCIOUS (signals: free, cheap, cant afford, small school, budget-friendly, cost-effective):
→ Emphasize: free trial, flexible pricing tiers, ROI savings, "schools like yours typically save X hours"

LINKEDIN PROFESSIONAL (if platform is LinkedIn):
→ Use LinkedIn-appropriate tone: slightly more professional than casual, mention "connecting", reference their professional background if visible

MANDATORY REQUIREMENTS:
1. Reference their EXACT specific problem from the post
2. If they mentioned a number (1500 students, 8 schools, 3 years) → use that exact number in the email
3. Keep under 180 words total
4. One clear CTA at the end (demo, call, reply)
5. For LinkedIn leads: mention "I came across your post on LinkedIn" — for Reddit: "I saw your post on Reddit"

Return EXACTLY in this format, nothing else:
DETECTED_TONE: [Casual/Formal/Technical/Empathetic/Budget-Conscious/LinkedIn Professional]
SUBJECT: [subject line]
BODY:
[email body]`;
      const result = await this.model.generateContent(prompt);
      const text = result.response.text();

      const toneMatch = text.match(/DETECTED_TONE:\s*(.*)/);
      const subjectMatch = text.match(/SUBJECT:\s*(.*)/);
      const bodyMatch = text.split(/BODY:\n?/)[1];

      return {
        tone: toneMatch ? toneMatch[1].trim() : "Unknown",
        subject: subjectMatch ? subjectMatch[1].trim() : "About your post",
        body: bodyMatch ? bodyMatch.trim() : text,
        fullEmail: (subjectMatch ? subjectMatch[1].trim() + "\n\n" : "") + (bodyMatch ? bodyMatch.trim() : text)
      };
    } catch (error) {
      console.error("Gemini API error (Email Generation):", error.message);
      return this._getMockEmail(lead);
    }
  }

  _getMockEmail(lead) {
    const tone = "Professional (Mock)";
    const subject = `Re: Your recent ${lead.platform} post`;
    const body = `Hi ${lead.full_name || 'there'},\n\nI came across your post on ${lead.platform} regarding your current challenges.\n\nWe specialize in providing solutions that address exactly these kinds of issues. I would love to connect and share how we have helped similar organizations streamline their processes.\n\nAre you available for a brief chat later this week?\n\nBest regards,\nSales Team`;
    return {
      tone,
      subject,
      body,
      fullEmail: `Subject: ${subject}\n\n${body}`
    };
  }
}

module.exports = new GeminiService();
