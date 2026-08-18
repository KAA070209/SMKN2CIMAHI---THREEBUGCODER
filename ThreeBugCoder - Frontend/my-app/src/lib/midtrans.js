let snapPromise = null;
let snapPromiseScriptUrl = "";

const MIDTRANS_SNAP_URLS = {
  production: "https://app.midtrans.com/snap/snap.js",
  sandbox: "https://app.sandbox.midtrans.com/snap/snap.js",
};

function normalizeEnvironment(environment) {
  const value = String(environment || "").trim().toLowerCase();
  if (["production", "prod", "live", "true", "1"].includes(value)) return "production";
  if (["sandbox", "staging", "stg", "development", "dev", "test", "false", "0"].includes(value)) return "sandbox";
  return "";
}

function inferEnvironment({ environment, clientKey, snapUrl } = {}) {
  const explicitEnvironment = normalizeEnvironment(environment);
  if (explicitEnvironment) return explicitEnvironment;

  const normalizedSnapUrl = String(snapUrl || "").toLowerCase();
  if (normalizedSnapUrl.includes("app.sandbox.midtrans.com")) return "sandbox";
  if (normalizedSnapUrl.includes("app.midtrans.com")) return "production";

  const normalizedClientKey = String(clientKey || "").trim().toLowerCase();
  if (normalizedClientKey.startsWith("sb-mid-client-")) return "sandbox";

  return "production";
}

function getSnapScriptUrl(options = {}) {
  const environment = inferEnvironment(options);
  return MIDTRANS_SNAP_URLS[environment] || MIDTRANS_SNAP_URLS.production;
}

export function getMidtransSnapEnvironment(options = {}) {
  return inferEnvironment(options);
}

function removeSnapScript() {
  const existing = document.getElementById("midtrans-snap-script");
  if (existing) existing.remove();
}

function clearSnapInstance() {
  try {
    delete window.snap;
  } catch {
    window.snap = undefined;
  }
}

export function resetMidtransSnap() {
  removeSnapScript();
  clearSnapInstance();
  snapPromise = null;
  snapPromiseScriptUrl = "";
}

export function loadMidtransSnap(clientKey, { environment, snapUrl, forceReload = false } = {}) {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Snap hanya bisa dimuat di browser."));
  }

  const scriptUrl = getSnapScriptUrl({ environment, clientKey, snapUrl });

  if (forceReload) {
    resetMidtransSnap();
  } else if (window.snap && document.getElementById("midtrans-snap-script")?.src === scriptUrl) {
    return Promise.resolve(window.snap);
  }

  if (snapPromise && snapPromiseScriptUrl === scriptUrl) return snapPromise;
  if (snapPromise && snapPromiseScriptUrl !== scriptUrl) {
    resetMidtransSnap();
  }

  snapPromise = new Promise((resolve, reject) => {
    snapPromiseScriptUrl = scriptUrl;
    const start = Date.now();

    const waitForSnap = () => {
      if (window.snap) return resolve(window.snap);
      if (Date.now() - start > 10000) {
        snapPromise = null;
        snapPromiseScriptUrl = "";
        return reject(new Error("Timeout: window.snap tidak muncul setelah script dimuat."));
      }
      setTimeout(waitForSnap, 150);
    };

    const fail = () => {
      snapPromise = null;
      snapPromiseScriptUrl = "";
      reject(new Error(`Script Midtrans gagal dimuat (cek koneksi, ad-blocker, atau CSP ke ${new URL(scriptUrl).host}).`));
    };

    const existing = document.getElementById("midtrans-snap-script");
    if (existing) {
      if (existing.src !== scriptUrl) {
        existing.remove();
        clearSnapInstance();
      } else {
        if (window.snap) return resolve(window.snap);
        existing.addEventListener("load", waitForSnap, { once: true });
        existing.addEventListener("error", fail, { once: true });
        return;
      }
    }

    const script = document.createElement("script");
    script.id = "midtrans-snap-script";
    script.src = scriptUrl;
    script.setAttribute("data-client-key", clientKey || "");
    script.async = true;
    script.onload = waitForSnap;
    script.onerror = fail;
    document.head.appendChild(script);
  });

  return snapPromise;
}
