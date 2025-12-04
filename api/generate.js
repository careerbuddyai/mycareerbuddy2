export default async function handler(req, res) {
  try {
    const { jd, resume } = req.body;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: `Job Description:\n${jd}\nResume:\n${resume}\nGenerate 20 technical, 10 HR, and 10 resume-related interview questions.`,
          },
        ],
      }),
    });

    const data = await response.json();
    res.status(200).send(data.choices[0].message.content);
  } catch (err) {
    res.status(500).send("Server Error: " + err.message);
  }
}
