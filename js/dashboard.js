(() => {
  const grid = document.getElementById("moduleGrid");
  const frame = document.getElementById("moduleFrame");
  const moduleHeader = document.getElementById("moduleHeader");
  const installIdText = document.getElementById("installIdText");
  const MODULES = window.MODULES || [];

  // ---------- Installation ID ----------
  async function getInstallationId() {
    if (window.electronAPI && window.electronAPI.getInstallationId) {
      return await window.electronAPI.getInstallationId();
    } else {
      let id = localStorage.getItem("sst_install_id");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("sst_install_id", id);
      }
      return id;
    }
  }

  let installId = null;

  // ---------- License helpers ----------
  function getLicenses() {
    try {
      return JSON.parse(localStorage.getItem("sst_licenses") || "{}");
    } catch {
      return {};
    }
  }

  function saveLicenses(o) {
    localStorage.setItem("sst_licenses", JSON.stringify(o));
  }

  async function sha256hex(t) {
    const e = new TextEncoder().encode(t);
    const n = await crypto.subtle.digest("SHA-256", e);
    return Array.from(new Uint8Array(n))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }

  // ---------- Build cards ----------
  function renderModuleCards() {
    console.log("renderModuleCards() triggered");
    console.log("MODULES data inside render:", MODULES);

    grid.innerHTML = "";
    const licenses = getLicenses();

    MODULES.forEach((m, index)=>{
  if (document.querySelector(`.card[data-code='${m.code}']`)) return; // prevent duplicate cards

      const isUnlocked = licenses[m.code] === true || m.active === true;
      const card = document.createElement("div");
      card.className = "card" + (isUnlocked ? "" : " locked");
      card.dataset.code = m.code;
      card.innerHTML = `
        <div class="icon">${getIcon(m.code)}</div>
        <div class="title">${m.name}</div>
        <div class="badge">${isUnlocked ? "Active" : "Locked"}</div>`;
      card.onclick = () => {
        if (!isUnlocked) {
          showActivationModal();
          moduleSelect.value = m.code;
          licenseKeyInput.value = "";
          modalMsg.textContent = "";
          return;
        }
        loadModule(m);
      };
      grid.appendChild(card);
    });

    console.log("Rendered cards:", document.querySelectorAll(".card").length);
  }



  function getIcon(code) {
    const i = {
      timetable: "🕒",
      progress: "📊",
      payslip: "💰",
      dues: "💳",
      attendance: "📋",
      library: "📚",
      inventory: "📦",
      notice: "📢",
      fee: "🧾",
      transport: "🚌",
      hostel: "🏠",
      aistudy: "🤖",
    };
    return i[code] || "📁";
  }

async function loadModule(m) {
  console.log("Loading module:", m.code);

  const result = await window.electronAPI.resolveModule(m.code);
  console.log("Resolve result:", result);

  if (result.found) {
    moduleHeader.textContent = m.name;
    frame.src = `file://${__dirname}/modules/${m.code}.html`;

  } else {
    alert(`Module "${m.code}" not found on this system.`);
  }
}







  // ---------- Modal handling ----------
  const modal = document.getElementById("modal");
  const moduleSelect = document.getElementById("moduleSelect");
  const licenseKeyInput = document.getElementById("licenseKey");
  const modalMsg = document.getElementById("modalMsg");

  function showActivationModal() {
    if (modal) modal.classList.remove("hidden");
  }
  function hideActivationModal() {
    if (modal) modal.classList.add("hidden");
  }

  function populateModuleSelect() {
    if (!moduleSelect) return;
    moduleSelect.innerHTML = '<option value="">-- Select Module --</option>';
    MODULES.forEach((m) => {
      const o = document.createElement("option");
      o.value = m.code;
      o.textContent = m.name;
      moduleSelect.appendChild(o);
    });
  }

  // ---------- Activation ----------
  const activateBtn = document.getElementById("modalActivateBtn");
  if (activateBtn) {
    activateBtn.onclick = async () => {
      const mod = moduleSelect.value;
      const key = licenseKeyInput.value.trim();
      if (!mod) return (modalMsg.textContent = "Please select module.");
      if (!key) return (modalMsg.textContent = "Please paste license key.");
      modalMsg.textContent = "Verifying...";
      const exp = await sha256hex(installId + "::" + mod);
      if (key.toLowerCase() === exp.toLowerCase()) {
        const l = getLicenses();
        l[mod] = true;
        saveLicenses(l);
        modalMsg.textContent = "Activated ✓";
        renderModuleCards();
        setTimeout(hideActivationModal, 800);
      } else modalMsg.textContent = "Invalid key.";
    };
  }

  const closeBtn = document.getElementById("modalCloseBtn");
  if (closeBtn) closeBtn.onclick = hideActivationModal;

  const btnActivate = document.getElementById("btnActivate");
  if (btnActivate)
    btnActivate.onclick = () => {
      showActivationModal();
      moduleSelect.value = "";
      licenseKeyInput.value = "";
      modalMsg.textContent = "";
    };

  const btnReset = document.getElementById("btnReset");
  if (btnReset)
    btnReset.onclick = () => {
      if (!confirm("Reset all activated modules?")) return;
      localStorage.removeItem("sst_licenses");
      renderModuleCards();
      frame.src = "";
      moduleHeader.textContent = "Select a module";
    };

  // ---------- Sidebar toggle ----------
  const toggleSidebar = document.getElementById("toggleSidebar");
  if (toggleSidebar)
    toggleSidebar.onclick = () => {
      document.querySelector(".grid").classList.toggle("hidden");
      setTimeout(adjustIframeHeight, 200);
    };

  function adjustIframeHeight() {
    const headerHeight = document.querySelector(".app-header").offsetHeight;
    const newHeight = window.innerHeight - headerHeight - 24;
    frame.style.height = newHeight + "px";
  }
  window.addEventListener("resize", adjustIframeHeight);

function autoLoadFirstModule() {
  const licenses = getLicenses();
  const first = MODULES.find(m => licenses[m.code] === true || m.active === true);
  if (first) loadModule(first);
}



  // ---------- Initialize ----------
  window.addEventListener("DOMContentLoaded", async () => {
    console.log("✅ Dashboard initialized");

    installId = await getInstallationId();
    if (installIdText) installIdText.textContent = installId;

    populateModuleSelect();
    renderModuleCards();
    adjustIframeHeight();
autoLoadFirstModule();
  });
})();
