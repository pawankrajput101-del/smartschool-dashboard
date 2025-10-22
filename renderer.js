// renderer.js — clean, final
console.log("Renderer initializing");

// --- Modules list ---
const MODULES = [
  { code: "timetable", name: "Timetable", icon: "🕒" },
  { code: "progress", name: "Progress Report", icon: "📊" },
  { code: "payslip", name: "Payslip", icon: "💰" },
  { code: "dues", name: "Dues", icon: "💳" },
  { code: "attendance", name: "Attendance", icon: "📋" },
  { code: "library", name: "Library", icon: "📚" },
  { code: "inventory", name: "Inventory", icon: "📦" },
  { code: "notice", name: "Notice Board", icon: "📢" },
  { code: "fee", name: "Fee Management", icon: "🧾" },
  { code: "transport", name: "Transport", icon: "🚌" },
  { code: "hostel", name: "Hostel", icon: "🏠" },
  { code: "aistudy", name: "AI Study", icon: "🤖" }
];

// DOM refs
const gridInner = document.getElementById("gridInner");
const frame = document.getElementById("moduleFrame");
const moduleHeader = document.getElementById("moduleHeader");
const licenseBanner = document.getElementById("licenseBanner");
const btnActivate = document.getElementById("btnActivate");
const toggleSidebar = document.getElementById("toggleSidebar");
const moduleGrid = document.getElementById("moduleGrid");
const activationBox = document.getElementById("activationBox");
const installIdText = document.getElementById("installIdText");
const licenseInput = document.getElementById("licenseInput");
const submitLicense = document.getElementById("submitLicense");
const cancelLicense = document.getElementById("cancelLicense");

// --- Render modules ---
function renderModuleCards() {
  if (!gridInner) return;
  gridInner.innerHTML = "";
  MODULES.forEach(m => {
    // create single card
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.code = m.code;
    card.innerHTML = `<div class="icon">${m.icon}</div><div class="title">${m.name}</div>`;
    card.onclick = () => {
      moduleHeader.textContent = m.name;
      frame.src = `modules/${m.code}.html`;
    };
    gridInner.appendChild(card);
  });
  console.log("Modules rendered:", MODULES.length);
}

// --- Toggle sidebar ---
toggleSidebar.onclick = () => {
  moduleGrid.classList.toggle("hidden");
};

// --- Activation modal helpers ---
function openActivation() {
  activationBox.style.display = "flex";
}
function closeActivation() {
  activationBox.style.display = "none";
}

// --- Load installation id into modal ---
async function showInstallId() {
  try {
    const id = await window.electronAPI.getInstallationId();
    installIdText.textContent = id;
  } catch (e) {
    installIdText.textContent = "n/a";
  }
}

// --- Verify & save license ---
async function verifyAndSaveLicense(base64) {
  try {
    const decoded = JSON.parse(atob(base64));
    const { payload, signature } = decoded;
    const currentId = await window.electronAPI.getInstallationId();
    if (payload.installationId !== currentId) throw new Error("install-mismatch");

    const pem = await (await fetch("public.pem")).text();
    const b64 = pem.replace(/-----(BEGIN|END) PUBLIC KEY-----/g, "").replace(/\s+/g, "");
    const der = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
    const key = await crypto.subtle.importKey(
      "spki",
      der.buffer,
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const data = new TextEncoder().encode(JSON.stringify(payload));
    const sig = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, sig, data);
    if (!isValid) throw new Error("invalid-sign");

    await window.electronAPI.saveLicense(decoded);
    return { ok: true, payload };
  } catch (err) {
    return { ok: false, err: err.message || String(err) };
  }
}

// --- Activation flow ---
btnActivate.onclick = async () => {
  await showInstallId();
  openActivation();
};

cancelLicense.onclick = () => closeActivation();

submitLicense.onclick = async () => {
  const txt = licenseInput.value.trim();
  if (!txt) return alert("Please paste your license key.");
  submitLicense.disabled = true;
  const res = await verifyAndSaveLicense(txt);
  submitLicense.disabled = false;
  if (!res.ok) return alert("Activation failed: " + res.err);
  alert("Activation successful — restart app.");
  closeActivation();
};

// --- Banner & auto-check license on startup ---
async function updateBanner() {
  try {
    const license = await window.electronAPI.loadLicense();
    if (!license || !license.payload) {
      licenseBanner.textContent = "License not activated";
      licenseBanner.style.background = "#9e9e9e";
      btnActivate.style.display = "inline-block";
      return;
    }
    const expiry = new Date(license.payload.expiresAt);
    const today = new Date();
    const diffDays = Math.floor((expiry - today) / (1000*60*60*24));
    if (diffDays <= 0) {
      licenseBanner.textContent = "License expired";
      licenseBanner.style.background = "#c62828";
      btnActivate.style.display = "inline-block";
    } else if (diffDays <= 15) {
      licenseBanner.textContent = `Expiring soon (${diffDays} days)`;
      licenseBanner.style.background = "#ef6c00";
      btnActivate.style.display = "inline-block";
    } else {
      licenseBanner.textContent = `Valid for ${diffDays} days`;
      licenseBanner.style.background = "#2e7d32";
      btnActivate.style.display = "none";
    }
  } catch (e) {
    licenseBanner.textContent = "License check error";
    licenseBanner.style.background = "#9e9e9e";
    btnActivate.style.display = "inline-block";
  }
}

// --- Init on DOMContentLoaded ---
window.addEventListener("DOMContentLoaded", async () => {
  renderModuleCards();
  await updateBanner();
});
