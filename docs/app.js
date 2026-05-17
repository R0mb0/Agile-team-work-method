(() => {
  const PDF_FILE = "./Document.pdf";

  const subtitle = document.getElementById("subtitle");
  const themeLabel = document.getElementById("themeLabel");
  const statusPill = document.getElementById("statusPill");

  const pdfFrame = document.getElementById("pdfFrame");
  const overlay = document.getElementById("overlay");
  const fallback = document.getElementById("fallback");
  const fallbackText = document.getElementById("fallbackText");
  const techPre = document.getElementById("techPre");

  const downloadBtn = document.getElementById("downloadBtn");
  const openNewTabBtn = document.getElementById("openNewTabBtn");

  // Theme label
  const mql = window.matchMedia?.("(prefers-color-scheme: dark)");
  const setThemeLabel = () => {
    if (!mql) return (themeLabel.textContent = "auto");
    themeLabel.textContent = mql.matches ? "scuro (auto)" : "chiaro (auto)";
  };
  setThemeLabel();
  mql?.addEventListener?.("change", setThemeLabel);

  const showOverlay = (show) => overlay.toggleAttribute("hidden", !show);

  const setStatus = (text, kind = "neutral") => {
    statusPill.textContent = text;
    const map = {
      neutral: "var(--border)",
      ok: "color-mix(in srgb, var(--ok) 55%, var(--border))",
      warn: "color-mix(in srgb, var(--warn) 60%, var(--border))",
      bad: "color-mix(in srgb, var(--bad) 60%, var(--border))",
    };
    statusPill.style.borderColor = map[kind] ?? map.neutral;
  };

  const hideFallback = () => {
    fallback.hidden = true;
    pdfFrame.style.visibility = "visible";
  };

  const showFallback = (message, details = "") => {
    fallback.hidden = false;
    pdfFrame.style.visibility = "hidden";
    showOverlay(false);
    fallbackText.textContent = message;
    techPre.textContent = details || "Nessun dettaglio disponibile.";
    setStatus("Anteprima non disponibile", "bad");
    subtitle.textContent = "Errore di visualizzazione";
  };

  async function headCheck(url) {
    // Su file:// la HEAD non è affidabile: saltiamo.
    if (location.protocol === "file:") return { ok: true, note: "file:// (HEAD saltata)" };

    try {
      const res = await fetch(url, { method: "HEAD", cache: "no-store" });
      const ct = res.headers.get("content-type") || "";
      return { ok: res.ok, status: res.status, contentType: ct };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  }

  async function init() {
    subtitle.textContent = "Document.pdf";
    downloadBtn.href = PDF_FILE;
    openNewTabBtn.href = PDF_FILE;

    hideFallback();
    showOverlay(true);
    setStatus("Verifica file…", "neutral");

    const check = await headCheck(PDF_FILE);
    if (check.ok === false) {
      showFallback(
        "Non riesco a raggiungere il PDF. Controlla che Document.pdf esista e che GitHub Pages lo stia servendo correttamente.",
        JSON.stringify(check, null, 2)
      );
      return;
    }

    if (check.contentType && !check.contentType.toLowerCase().includes("pdf")) {
      setStatus("PDF trovato (content-type non standard)", "warn");
    } else {
      setStatus("PDF pronto", "ok");
    }

    const viewerUrl = `${PDF_FILE}#view=FitH`;
    pdfFrame.src = viewerUrl;

    // Timeout SOLO se l'iframe non fa load
    const TIMEOUT_MS = 12000;
    let loaded = false;

    const timeout = window.setTimeout(() => {
      if (loaded) return;

      showFallback(
        "L’anteprima non si è caricata in tempo. Su alcuni browser (soprattutto mobile/Safari) l’embed PDF può essere limitato: usa “Apri in nuova scheda”.",
        `Timeout ${TIMEOUT_MS}ms
Protocollo: ${location.protocol}
User-Agent: ${navigator.userAgent}
URL iframe: ${viewerUrl}
HEAD: ${JSON.stringify(check, null, 2)}`
      );
    }, TIMEOUT_MS);

    pdfFrame.addEventListener(
      "load",
      () => {
        loaded = true;
        window.clearTimeout(timeout);
        showOverlay(false);
        hideFallback();
        setStatus("Anteprima caricata", "ok");
        subtitle.textContent = "Anteprima pronta";
      },
      { once: true }
    );
  }

  init();
})();