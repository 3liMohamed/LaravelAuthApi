/* ----------------------------------------------------------------
   Crextio – Live Color & Theme Mode Switcher
   - Brand accent + page background (8 presets)
   - Light / Dark mode (Tailwind v4 class-based, <html class="dark">)
   Choices are persisted in localStorage.
---------------------------------------------------------------- */
(function () {
  const COLOR_KEY = "crextio-theme";
  const MODE_KEY = "crextio-mode"; // 'light' | 'dark'
  const LAYOUT_KEY = "crextio-layout"; // 'topnav' | 'sidebar'

  const PRESETS = [
    {
      id: "yellow",
      label: "Sunshine",
      accent: "#FDD05B",
      accentText: "#2A2C31",
      bgFrom: "#F8F6F0",
      bgTo: "#FFF5D1",
      darkFrom: "#15171C",
      darkTo: "#1F1B14",
    },
    {
      id: "mint",
      label: "Mint",
      accent: "#7DD3A8",
      accentText: "#0F3D26",
      bgFrom: "#F0F9F4",
      bgTo: "#D4F5E5",
      darkFrom: "#13201A",
      darkTo: "#0F2C1F",
    },
    {
      id: "coral",
      label: "Coral",
      accent: "#FF9485",
      accentText: "#3D1410",
      bgFrom: "#FFF4F1",
      bgTo: "#FFE0D6",
      darkFrom: "#1F1715",
      darkTo: "#2C1814",
    },
    {
      id: "lavender",
      label: "Lavender",
      accent: "#B8A5F0",
      accentText: "#22153D",
      bgFrom: "#F5F1FB",
      bgTo: "#E5DCFA",
      darkFrom: "#181428",
      darkTo: "#1F1830",
    },
    {
      id: "sky",
      label: "Sky",
      accent: "#7FC0FF",
      accentText: "#0F2740",
      bgFrom: "#F0F7FE",
      bgTo: "#D6ECFF",
      darkFrom: "#121A24",
      darkTo: "#0F2030",
    },
    {
      id: "rose",
      label: "Rose",
      accent: "#FF9DC2",
      accentText: "#3D0F25",
      bgFrom: "#FDF2F7",
      bgTo: "#FFE0EE",
      darkFrom: "#21161B",
      darkTo: "#2C1822",
    },
    {
      id: "lime",
      label: "Lime",
      accent: "#D3E96B",
      accentText: "#2A3D0A",
      bgFrom: "#F8FBEC",
      bgTo: "#EBF5C8",
      darkFrom: "#1A1D14",
      darkTo: "#212818",
    },
    {
      id: "graphite",
      label: "Graphite",
      accent: "#B8BCC4",
      accentText: "#1E1E20",
      bgFrom: "#F2F2F4",
      bgTo: "#DCDEE3",
      darkFrom: "#16171A",
      darkTo: "#1E1F23",
    },
  ];

  function getMode() {
    try {
      return localStorage.getItem(MODE_KEY) === "dark" ? "dark" : "light";
    } catch (e) {
      return "light";
    }
  }

  function getLayout() {
    try {
      return localStorage.getItem(LAYOUT_KEY) === "sidebar"
        ? "sidebar"
        : "topnav";
    } catch (e) {
      return "topnav";
    }
  }

  function getStoredPreset() {
    try {
      const id = localStorage.getItem(COLOR_KEY);
      return PRESETS.find((p) => p.id === id) || PRESETS[0];
    } catch (e) {
      return PRESETS[0];
    }
  }

  function applyMode(mode) {
    document.documentElement.classList.toggle("dark", mode === "dark");
  }

  function applyLayout(layout) {
    document.documentElement.setAttribute("data-layout", layout);
  }

  function applyTheme(preset, mode) {
    const root = document.documentElement;
    root.style.setProperty("--color-yellow", preset.accent);
    root.style.setProperty("--color-accent", preset.accent);
    root.style.setProperty("--color-accent-contrast", preset.accentText);

    const from = mode === "dark" ? preset.darkFrom : preset.bgFrom;
    const to = mode === "dark" ? preset.darkTo : preset.bgTo;
    if (document.body) {
      document.body.style.background = `linear-gradient(135deg, ${from} 0%, ${to} 100%)`;
    }
  }

  // Apply pre-paint to avoid flash
  let currentMode = getMode();
  let currentPreset = getStoredPreset();
  let currentLayout = getLayout();
  applyMode(currentMode);
  applyLayout(currentLayout);
  applyTheme(currentPreset, currentMode);
  document.addEventListener("DOMContentLoaded", () => {
    applyMode(currentMode);
    applyLayout(currentLayout);
    applyTheme(currentPreset, currentMode);
  });

  function buildSwitcher() {
    const wrap = document.createElement("div");
    wrap.id = "crextio-color-switcher";
    wrap.style.cssText =
      "position:fixed;right:1.25rem;bottom:1.25rem;z-index:45;font-family:inherit;";

    wrap.innerHTML = `
            <style>
                #crextio-color-switcher * { box-sizing: border-box; }
                #ccs-toggle {
                    width: 52px; height: 52px; border-radius: 9999px; border: none; cursor: pointer;
                    background: var(--color-accent, #FDD05B);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.18), 0 0 0 4px rgba(255,255,255,0.7);
                    display: flex; align-items: center; justify-content: center;
                    transition: transform .2s ease;
                }
                .dark #ccs-toggle { box-shadow: 0 8px 24px rgba(0,0,0,0.5), 0 0 0 4px rgba(36,38,44,0.7); }
                #ccs-toggle:hover { transform: scale(1.08) rotate(15deg); }
                #ccs-toggle svg { width: 24px; height: 24px; color: var(--color-accent-contrast, #2A2C31); }
                #ccs-panel {
                    position: absolute; bottom: 64px; right: 0;
                    width: 280px; padding: 18px;
                    background: rgba(255,255,255,0.96); backdrop-filter: blur(14px);
                    border-radius: 20px; border: 1px solid rgba(255,255,255,0.9);
                    box-shadow: 0 20px 50px rgba(0,0,0,0.18);
                    color: #2A2C31;
                }
                .dark #ccs-panel {
                    background: rgba(36,38,44,0.96);
                    border-color: rgba(255,255,255,0.08);
                    color: #E5E7EB;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.6);
                }
                #ccs-panel[hidden] { display: none; }
                .ccs-title {
                    font-size: 13px; font-weight: 600;
                    margin: 0 0 12px 0; letter-spacing: .02em;
                    display: flex; align-items: center; justify-content: space-between;
                }
                .ccs-close {
                    width: 22px; height: 22px; border: none; background: rgba(0,0,0,0.06);
                    border-radius: 9999px; cursor: pointer; color: inherit;
                    font-size: 14px; line-height: 1; padding: 0;
                }
                .dark .ccs-close { background: rgba(255,255,255,0.1); }

                .ccs-mode {
                    display: flex; gap: 4px; padding: 4px;
                    background: rgba(0,0,0,0.05); border-radius: 12px;
                    margin-bottom: 14px;
                }
                .dark .ccs-mode { background: rgba(255,255,255,0.06); }
                .ccs-mode-btn {
                    flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px;
                    padding: 8px 10px; border: none; background: transparent; cursor: pointer;
                    border-radius: 9px; font-size: 12px; font-weight: 500; color: inherit;
                    transition: background .15s ease;
                }
                .ccs-mode-btn svg { width: 14px; height: 14px; }
                .ccs-mode-btn.is-active {
                    background: #fff; color: #2A2C31;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
                }
                .dark .ccs-mode-btn.is-active {
                    background: rgba(255,255,255,0.12); color: #fff;
                }

                .ccs-section-label {
                    font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: .06em;
                    opacity: .6; margin: 0 0 8px 0;
                }
                .ccs-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
                .ccs-swatch {
                    aspect-ratio: 1 / 1; border-radius: 14px; border: 2px solid transparent;
                    cursor: pointer; padding: 0; position: relative;
                    transition: transform .15s ease, border-color .15s ease;
                }
                .ccs-swatch:hover { transform: translateY(-2px); }
                .ccs-swatch.is-active { border-color: currentColor; }
                .ccs-swatch.is-active::after {
                    content: '✓'; position: absolute; inset: 0;
                    display: flex; align-items: center; justify-content: center;
                    color: #2A2C31; font-weight: 700; font-size: 14px;
                }
                .ccs-label {
                    margin-top: 12px; padding-top: 12px;
                    border-top: 1px solid rgba(0,0,0,0.06);
                    font-size: 11px; opacity: .7; text-align: center;
                }
                .dark .ccs-label { border-top-color: rgba(255,255,255,0.08); }
                .ccs-label b { font-weight: 600; opacity: 1; }
                .ccs-reset {
                    width: 100%; margin-top: 10px; padding: 8px 10px; border-radius: 10px;
                    border: 1px solid rgba(0,0,0,0.08); background: transparent; color: inherit;
                    font: inherit; font-size: 12px; cursor: pointer;
                }
                .ccs-reset:hover { background: rgba(0,0,0,0.04); }
                .dark .ccs-reset { border-color: rgba(255,255,255,0.1); }
                .dark .ccs-reset:hover { background: rgba(255,255,255,0.06); }
            </style>
            <button id="ccs-toggle" type="button" aria-label="Open theme settings" title="Theme settings">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="13.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="10.5" r="2.5"/>
                    <circle cx="8.5" cy="7.5" r="2.5"/><circle cx="6.5" cy="12.5" r="2.5"/>
                    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.5-1.1-.3-.3-.5-.7-.5-1.1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5-4.5-9-10-9z"/>
                </svg>
            </button>
            <div id="ccs-panel" hidden>
                <h3 class="ccs-title">
                    Theme
                    <button class="ccs-close" type="button" aria-label="Close">×</button>
                </h3>

                <div class="ccs-mode" role="tablist" aria-label="Color mode">
                    <button class="ccs-mode-btn" data-mode="light" role="tab">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                        Light
                    </button>
                    <button class="ccs-mode-btn" data-mode="dark" role="tab">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                        Dark
                    </button>
                </div>

                <p class="ccs-section-label">Layout</p>
                <div class="ccs-mode" role="tablist" aria-label="Layout" style="margin-top:0;">
                    <button class="ccs-mode-btn" data-layout="topnav" role="tab">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="4" rx="1"/><rect x="3" y="10" width="18" height="10" rx="1"/></svg>
                        Top Nav
                    </button>
                    <button class="ccs-mode-btn" data-layout="sidebar" role="tab">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="6" height="16" rx="1"/><rect x="11" y="4" width="10" height="16" rx="1"/></svg>
                        Sidebar
                    </button>
                </div>

                <p class="ccs-section-label" style="margin-top:14px;">Accent color</p>
                <div class="ccs-grid">
                    ${PRESETS.map(
                      (p) => `
                        <button class="ccs-swatch" data-id="${p.id}"
                                style="background:${p.accent}"
                                title="${p.label}" aria-label="${p.label}"></button>
                    `,
                    ).join("")}
                </div>
                <div class="ccs-label">Current: <b data-current-label></b></div>
                <button class="ccs-reset" type="button" data-reset-data>Reset sample data</button>
            </div>
        `;

    document.body.appendChild(wrap);

    const toggle = wrap.querySelector("#ccs-toggle");
    const panel = wrap.querySelector("#ccs-panel");
    const closeBtn = wrap.querySelector(".ccs-close");
    const labelEl = wrap.querySelector("[data-current-label]");
    const modeBtns = wrap.querySelectorAll(".ccs-mode-btn[data-mode]");
    const layoutBtns = wrap.querySelectorAll(".ccs-mode-btn[data-layout]");
    const swatches = wrap.querySelectorAll(".ccs-swatch");

    function refreshActive() {
      modeBtns.forEach((b) =>
        b.classList.toggle("is-active", b.dataset.mode === currentMode),
      );
      layoutBtns.forEach((b) =>
        b.classList.toggle("is-active", b.dataset.layout === currentLayout),
      );
      swatches.forEach((s) =>
        s.classList.toggle("is-active", s.dataset.id === currentPreset.id),
      );
      labelEl.textContent = `${currentPreset.label} · ${currentMode === "dark" ? "Dark" : "Light"} · ${currentLayout === "sidebar" ? "Sidebar" : "Top Nav"}`;
    }
    refreshActive();
    function syncAppearance() {
      currentMode = getMode();
      currentPreset = getStoredPreset();
      currentLayout = getLayout();
      applyMode(currentMode);
      applyLayout(currentLayout);
      applyTheme(currentPreset, currentMode);
      refreshActive();
    }
    window.addEventListener("storage", syncAppearance);
    window.addEventListener("crextio-appearance", syncAppearance);

    toggle.addEventListener("click", (e) => {
      e.stopPropagation();
      panel.hidden = !panel.hidden;
    });
    closeBtn.addEventListener("click", () => (panel.hidden = true));
    wrap.querySelector("[data-reset-data]").addEventListener("click", () => {
      panel.hidden = true;
      window.dispatchEvent(new Event("crextio-reset"));
    });
    document.addEventListener("click", (e) => {
      if (!wrap.contains(e.target)) panel.hidden = true;
    });

    modeBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        currentMode = btn.dataset.mode;
        applyMode(currentMode);
        applyTheme(currentPreset, currentMode);
        try {
          localStorage.setItem(MODE_KEY, currentMode);
        } catch (e) {}
        refreshActive();
      });
    });

    layoutBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        currentLayout = btn.dataset.layout;
        applyLayout(currentLayout);
        try {
          localStorage.setItem(LAYOUT_KEY, currentLayout);
        } catch (e) {}
        refreshActive();
      });
    });

    swatches.forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = PRESETS.find((p) => p.id === btn.dataset.id);
        if (!preset) return;
        currentPreset = preset;
        applyTheme(currentPreset, currentMode);
        try {
          localStorage.setItem(COLOR_KEY, preset.id);
        } catch (e) {}
        refreshActive();
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildSwitcher);
  } else {
    buildSwitcher();
  }
})();
