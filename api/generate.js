// api/generate.js
// Vercel serverless API that calls OpenAI and returns JSON categorized questions.
//
// IMPORTANT: set environment variable OPENAI_API_KEY in Vercel dashboard.

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const body = req.body || {};
    const jd = (body.jd || "").toString().trim();
    const resume = (body.resume || "").toString().trim();
    const categories = Array.isArray(body.categories) ? body.categories : (body.categories ? [body.categories] : []);
    const perCategory = Math.min(25, parseInt(body.perCategory || 10, 10) || 10);
    const model = body.model || "gpt-4o-mini";

    if (!jd || !resume) {
      res.status(400).json({ error: "JD or Resume missing" });
      return;
    }

    const OPENAI_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_KEY) {
      res.status(500).json({ error: "API key missing on server (OPENAI_API_KEY)" });
      return;
    }

    // Build a system/user prompt that asks for JSON output
    // We'll request JSON: { "technical": [...], "hr": [...], ... }
    const system = `You are an AI that generates interview questions.  
Output MUST be a valid JSON object with keys for each requested category.  
Each category value is an array of strings (questions).  
Return no other text. Maximum ${perCategory} questions per category.`;

    const userPrompt = `
Job Description:
${jd}

Resume:
${resume}

Categories: ${categories.join(", ")}

For each requested category generate up to ${perCategory} interview questions tailored to the job description and resume.
Return output ONLY as JSON object. Example:
{
  "technical": ["q1", "q2"],
  "hr": ["q1"]
}
`;

    // Call OpenAI Chat Completions
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1200
      })
    });

    const data = await response.json();

    if (!response.ok) {
      // forward the error message
      const msg = (data && data.error && data.error.message) ? data.error.message : JSON.stringify(data);
      res.status(500).json({ error: "OpenAI error: " + msg });
      return;
    }

    // extract assistant content
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      res.status(500).json({ error: "No content from OpenAI" });
      return;
    }

    // The model should return JSON. Try to parse.
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // sometimes model wraps json in ``` or text - attempt to extract json substring
      const m = content.match(/\{[\s\S]*\}$/);
      if (m) {
        try { parsed = JSON.parse(m[0]); }
        catch (e2) { parsed = null; }
      }
    }

    if (!parsed) {
      // Last resort: return raw content as single category
      res.status(200).json({ raw: [content] });
      return;
    }

    // Ensure arrays and trimming
    Object.keys(parsed).forEach(k => {
      if (!Array.isArray(parsed[k])) parsed[k] = [String(parsed[k])];
      parsed[k] = parsed[k].slice(0, perCategory).map(s => String(s).trim());
    });

    res.status(200).json(parsed);

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: err.message });
  }
}
