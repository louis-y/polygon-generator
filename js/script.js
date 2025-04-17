// =====================
// Element References
// =====================
const svg = document.getElementById("svg");
const polygon = document.getElementById("polygon");

const sidesSlider = document.getElementById("sides");
const varianceSlider = document.getElementById("variance");
const roughnessSlider = document.getElementById("roughness");

const sidesVal = document.getElementById("sidesVal");
const varianceVal = document.getElementById("varianceVal");
const roughnessVal = document.getElementById("roughnessVal");

const colorInput = document.getElementById("color");
const bgColorInput = document.getElementById("bgColor");

const hexInput = document.getElementById("hexInput");
const bgHexInput = document.getElementById("bgHexInput");

const pageTitle = document.getElementById("pageTitle");
const copyBtn = document.getElementById("copyBtn");

const urlParams = new URLSearchParams(window.location.search);
const hasParams = ["sides", "variance", "roughness", "color", "bg", "seed"].some(p => urlParams.has(p));
let currentSeed = Date.now();

// =====================
// Utility Functions
// =====================
function getRandomHexColor() {
  return `#${Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0")}`;
}

function isLightColor(hex) {
  const r = parseInt(hex.substr(1, 2), 16);
  const g = parseInt(hex.substr(3, 2), 16);
  const b = parseInt(hex.substr(5, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 186;
}

function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = t + Math.imul(t ^ (t >>> 7), 61 | t) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generatePolygon(sides, radius, variance, roughness, seed) {
  const rand = mulberry32(seed);
  const angleStep = (Math.PI * 2) / sides;
  const points = [];

  for (let i = 0; i < sides; i++) {
    const angle = i * angleStep;
    const r = radius + rand() * variance - variance / 2;
    const x = Math.cos(angle) * r + roughness * (rand() - 0.5);
    const y = Math.sin(angle) * r + roughness * (rand() - 0.5);
    points.push([x + 250, y + 250]);
  }

  return points.map(([x, y]) => `${x},${y}`).join(" ");
}

function getParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    sides: parseInt(params.get("sides")) || 6,
    variance: parseFloat(params.get("variance")) || 30,
    roughness: parseFloat(params.get("roughness")) || 10,
    color: `#${params.get("color") || "FF5733"}`,
    bg: `#${params.get("bg") || "FFFFFF"}`,
    seed: parseInt(params.get("seed")) || Date.now(),
  };
}

function generateURL() {
  const url = new URL(window.location.href);
  url.searchParams.set("sides", sidesSlider.value);
  url.searchParams.set("variance", varianceSlider.value);
  url.searchParams.set("roughness", roughnessSlider.value);
  url.searchParams.set("color", colorInput.value.slice(1));
  url.searchParams.set("bg", bgColorInput.value.slice(1));
  url.searchParams.set("seed", currentSeed);
  return url.toString();
}

function copyLink() {
  const link = generateURL();
  const copyBtn = document.getElementById("copyBtn");

  navigator.clipboard.writeText(link)
    .then(() => {
      copyBtn.textContent = "Copied!";
      copyBtn.disabled = true;
      setTimeout(() => {
        copyBtn.textContent = "Copy Link";
        copyBtn.disabled = false;
      }, 2000);
    })
    .catch(err => {
      console.error("Copy failed", err);
      copyBtn.textContent = "Error";
    });
}

// =====================
// Drawing & Updates
// =====================
function drawPolygon() {
  const sides = parseInt(sidesSlider.value);
  const variance = parseFloat(varianceSlider.value);
  const roughness = parseFloat(roughnessSlider.value);
  polygon.setAttribute("points", generatePolygon(sides, 100, variance, roughness, currentSeed));
}

function applyColors() {
  polygon.setAttribute("fill", colorInput.value);
  document.body.style.backgroundColor = bgColorInput.value;
  pageTitle.style.color = isLightColor(bgColorInput.value) ? "#111" : "#FFF";
  hexInput.value = colorInput.value.slice(1).toUpperCase();
  bgHexInput.value = bgColorInput.value.slice(1).toUpperCase();
}

function updatePolygon() {
  if (!hasParams) currentSeed = Date.now();
  drawPolygon();
  applyColors();
  sidesVal.textContent = sidesSlider.value;
  varianceVal.textContent = varianceSlider.value;
  roughnessVal.textContent = roughnessSlider.value;
}

function randomize() {
  sidesSlider.value = Math.floor(Math.random() * 10) + 3;
  varianceSlider.value = Math.floor(Math.random() * 100);
  roughnessSlider.value = Math.floor(Math.random() * 50);
  colorInput.value = getRandomHexColor();
  bgColorInput.value = getRandomHexColor();
  currentSeed = Date.now();
  updatePolygon();
}

function downloadSVG() {
  const bbox = polygon.getBBox();
  const padding = 10;
  const clonedSVG = svg.cloneNode(true);
  clonedSVG.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clonedSVG.setAttribute("width", bbox.width + padding * 2);
  clonedSVG.setAttribute("height", bbox.height + padding * 2);
  clonedSVG.setAttribute("viewBox", `${bbox.x - padding} ${bbox.y - padding} ${bbox.width + padding * 2} ${bbox.height + padding * 2}`);

  const svgData = new XMLSerializer().serializeToString(clonedSVG);
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "polygon.svg";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function downloadPNG() {
  const bbox = polygon.getBBox();
  const padding = 10;
  const scale = 4;
  const clonedSVG = svg.cloneNode(true);
  clonedSVG.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const width = bbox.width + padding * 2;
  const height = bbox.height + padding * 2;
  clonedSVG.setAttribute("width", width);
  clonedSVG.setAttribute("height", height);
  clonedSVG.setAttribute("viewBox", `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`);

  const svgData = new XMLSerializer().serializeToString(clonedSVG);
  const blob = new Blob([svgData], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0);

    const pngUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "polygon.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  img.src = url;
}

// =====================
// Input Handlers
// =====================
hexInput.addEventListener("focus", e => e.target.select());
bgHexInput.addEventListener("focus", e => e.target.select());

hexInput.addEventListener("input", (e) => {
  const val = e.target.value.trim().replace(/^#/, "");
  if (/^[0-9A-Fa-f]{6}$/.test(val)) {
    colorInput.value = `#${val}`;
    applyColors();
  }
});

bgHexInput.addEventListener("input", (e) => {
  const val = e.target.value.trim().replace(/^#/, "");
  if (/^[0-9A-Fa-f]{6}$/.test(val)) {
    bgColorInput.value = `#${val}`;
    applyColors();
  }
});

colorInput.addEventListener("input", applyColors);
bgColorInput.addEventListener("input", applyColors);

[sidesSlider, varianceSlider, roughnessSlider].forEach((el) =>
  el.addEventListener("input", updatePolygon)
);

// =====================
// Initialization
// =====================
const params = getParams();

if (hasParams) {
  sidesSlider.value = params.sides;
  varianceSlider.value = params.variance;
  roughnessSlider.value = params.roughness;
  colorInput.value = params.color;
  bgColorInput.value = params.bg;
  currentSeed = params.seed;
  updatePolygon();
} else {
  randomize();
}