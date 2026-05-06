const isNode = typeof window === "undefined";
const windowObj = isNode ? { localStorage: new Map() } : window;
const storage = windowObj.localStorage;

const toSnakeCase = (str) => {
  return str.replace(/([A-Z])/g, "_$1").toLowerCase();
};

const getAppParamValue = (
  paramName,
  { defaultValue = undefined, removeFromUrl = false } = {},
) => {
  if (isNode) {
    return defaultValue;
  }

  // GANTI: Gunakan prefix siba_ agar konsisten
  const storageKey = `siba_${toSnakeCase(paramName)}`;

  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);

  if (removeFromUrl) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${
      urlParams.toString() ? `?${urlParams.toString()}` : ""
    }${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }

  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }

  if (defaultValue) {
    // Hanya simpan jika di storage masih kosong
    if (!storage.getItem(storageKey)) {
      storage.setItem(storageKey, defaultValue);
    }
    return storage.getItem(storageKey) || defaultValue;
  }

  const storedValue = storage.getItem(storageKey);
  return storedValue || null;
};

const getAppParams = () => {
  // Fitur untuk logout paksa via URL parameter ?clear_access_token=true
  if (getAppParamValue("clear_access_token") === "true") {
    storage.removeItem("siba_access_token");
    storage.removeItem("token");
  }

  return {
    // GANTI: Pastikan VITE_... di file .env kamu juga mulai disesuaikan namanya nanti
    appId: getAppParamValue("app_id", {
      defaultValue:
        import.meta.env.VITE_SIBA_APP_ID || import.meta.env.VITE_BASE44_APP_ID,
    }),
    token: getAppParamValue("access_token", { removeFromUrl: true }),
    appBaseUrl: getAppParamValue("app_base_url", {
      defaultValue:
        import.meta.env.VITE_SIBA_APP_BASE_URL ||
        import.meta.env.VITE_BASE44_APP_BASE_URL,
    }),
  };
};

export const appParams = {
  ...getAppParams(),
};
