import Tesseract from "tesseract.js";

export default async function handler(req, res) {
  try {
    const { imageBase64 } = JSON.parse(req.body || "{}");

    if (!imageBase64) {
      return res.status(400).json({ error: "No image received" });
    }

    const result = await Tesseract.recognize(
      Buffer.from(imageBase64, "base64"),
      "eng"
    );

    res.status(200).json({ text: result.data.text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
