export const config = {
  runtime: "edge",
};

export default async function handler(req) {
  try {
    const form = await req.formData();
    const file = form.get("image");

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: "Extract text from this image." },
          {
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: `data:image/png;base64,${base64}`,
              },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    return new Response(JSON.stringify({ text: data.choices[0].message.content }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
