export const config = {
runtime: "edge"
};


export default async function handler(req) {
const form = await req.formData();
const file = form.get("image");


const response = await fetch("https://api.openai.com/v1/chat/completions", {
method: "POST",
headers: {
"Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
},
body: JSON.stringify({
model: "gpt-4o-mini",
messages: [
{ role: "user", content: "Extract text from this image" },
{
role: "user",
content: [
{
type: "input_image",
image_url: "data:image/png;base64," + Buffer.from(await file.arrayBuffer()).toString("base64")
}
]
}
]
})
});


const data = await response.json();


return new Response(JSON.stringify({ text: data.choices[0].message.content }), {
status: 200
});
}