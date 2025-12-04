// script.js - client-side logic
const jdFile = document.getElementById("jdFile");
const resumeFile = document.getElementById("resumeFile");
const jdText = document.getElementById("jdText");
const resumeText = document.getElementById("resumeText");
const generateBtn = document.getElementById("generateBtn");
const clearBtn = document.getElementById("clearBtn");
const output = document.getElementById("output");
const themeToggle = document.getElementById("themeToggle");
const numQ = document.getElementById("numQ");
const numLabel = document.getElementById("numLabel");

document.getElementById("year").innerText = new Date().getFullYear();

numQ.oninput = () => numLabel.innerText = numQ.value;

// Theme toggle
themeToggle.onclick = () => {
  const body = document.body;
  if (body.classList.contains("light")) {
    body.classList.remove("light");
    body.classList.add("dark");
    themeToggle.innerText = "Light";
  } else {
    body.classList.remove("dark");
    body.classList.add("light");
    themeToggle.innerText = "Dark";
  }
};

// read file helper: handles pdf and images
async function extractTextFromFile(file) {
  if (!file) return "";
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let text = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items.map(i => i.str).join(" ");
        text += pageText + "\n\n";
      }
      return text;
    } catch (e) {
      console.warn("PDF extraction failed", e);
      return "";
    }
  }

  if (file.type.startsWith("image/")) {
    // Use Tesseract.js
    try {
      output.innerText = "Performing OCR on image (may take a few seconds)...";
      const { data: { text } } = await Tesseract.recognize(await file.arrayBuffer(), 'eng', { logger: m => {
        // optional progress
      }});
      return text;
    } catch (e) {
      console.warn("OCR failed", e);
      return "";
    }
  }

  // plain text files
  try {
    const text = await file.text();
    return text;
  } catch (e) {
    return "";
  }
}

async function prepareInputs() {
  // if file present, extract text; else use textarea
  let jd = jdText.value.trim();
  let resume = resumeText.value.trim();

  if (jdFile.files.length > 0) {
    const f = jdFile.files[0];
    const t = await extractTextFromFile(f);
    if (t && t.length > 10) jd = t;
  }

  if (resumeFile.files.length > 0) {
    const f = resumeFile.files[0];
    const t = await extractTextFromFile(f);
    if (t && t.length > 10) resume = t;
  }

  return { jd, resume };
}

generateBtn.onclick = async () => {
  output.innerText = "Preparing input...";

  const { jd, resume } = await prepareInputs();
  if (!jd || !resume) {
    output.innerText = "Please provide both Job Description and Resume (paste or upload files).";
    return;
  }

  // categories selected
  const cats = Array.from(document.querySelectorAll(".cat:checked")).map(n => n.value);
  if (cats.length === 0) {
    output.innerText = "Select at least one category.";
    return;
  }

  const perCategory = parseInt(numQ.value || "10", 10);
  const model = document.getElementById("modelSelect").value;

  output.innerText = "Generating... Please wait.";

  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jd, resume, categories: cats, perCategory, model })
    });

    if (!res.ok) {
      const txt = await res.text();
      output.innerText = "Server error: " + txt;
      return;
    }

    const data = await res.json();
    if (data.error) {
      output.innerText = "Error: " + data.error;
      return;
    }

    // Pretty-print categories & questions
    let out = "";
    for (const cat of Object.keys(data)) {
      out += `=== ${cat.toUpperCase()} (${data[cat].length} Qs) ===\n\n`;
      data[cat].forEach((q, i) => {
        out += `${i + 1}. ${q}\n\n`;
      });
      out += "\n";
    }
    output.innerText = out;

  } catch (err) {
    output.innerText = "Network or server error: " + err.message;
  }
};

clearBtn.onclick = () => {
  jdText.value = ""; resumeText.value = ""; jdFile.value = ""; resumeFile.value = ""; output.innerText = "Cleared.";
};
