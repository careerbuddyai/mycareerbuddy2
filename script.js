<!-- ========================= -->
if (!file) return;


if (file.type === "application/pdf") {
textarea.value = "Extracting text from PDF... please wait";
const text = await extractPDF(file);
textarea.value = text;
} else if (file.type.startsWith("image")) {
textarea.value = "Extracting text from image...";
const formData = new FormData();
formData.append("image", file);


const res = await fetch("/api/ocr", { method: "POST", body: formData });
const data = await res.json();
textarea.value = data.text;
} else {
alert("Unsupported file format");
}
}


document.getElementById("jdFile").onchange = () => handleFile(jdFile, jd);
document.getElementById("resumeFile").onchange = () => handleFile(resumeFile, resume);


// GENERATE QUESTIONS


document.getElementById("generateBtn").onclick = async () => {
output.innerText = "Generating... Please wait";


const res = await fetch("/api/generate", {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify({ jd: jd.value, resume: resume.value })
});


const data = await res.text();
output.innerText = data;
};


// CLEAR


document.getElementById("clearBtn").onclick = () => {
jd.value = "";
resume.value = "";
output.innerText = "";
};


// DOWNLOAD PDF


document.getElementById("downloadBtn").onclick = () => {
const blob = new Blob([output.innerText], { type: "text/plain" });
const link = document.createElement("a");
link.href = URL.createObjectURL(blob);
link.download = "questions.txt";
link.click();
};