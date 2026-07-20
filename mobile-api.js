(function initMobileApi() {
  const STORAGE_PREFIX = "pokemonBinder.";

  const isCapacitor =
    (window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === "function" &&
      window.Capacitor.isNativePlatform()) ||
    window.location.protocol === "capacitor:" ||
    window.location.protocol === "ionic:";

  window.PB_IS_MOBILE_APP = isCapacitor;
  const nativeStorageSetItem = localStorage.setItem.bind(localStorage);
  const nativeStorageRemoveItem = localStorage.removeItem.bind(localStorage);
  const nativeStorageClear = localStorage.clear.bind(localStorage);
  let preferenceWriteQueue = Promise.resolve();

  function isPersistedKey(key) {
    return typeof key === "string" && key.startsWith(STORAGE_PREFIX);
  }

  function getPreferencesPlugin() {
    if (!window.Capacitor) {
      return null;
    }

    return (
      window.Capacitor.Plugins?.Preferences ||
      window.Capacitor.registerPlugin("Preferences")
    );
  }

  function getAppPlugin() {
    if (!window.Capacitor) {
      return null;
    }

    return window.Capacitor.Plugins?.App || window.Capacitor.registerPlugin("App");
  }

  function getNativePlugin(name) {
    if (!window.Capacitor) {
      return null;
    }
    return window.Capacitor.Plugins?.[name] || window.Capacitor.registerPlugin(name);
  }

  function enqueuePreferenceWrite(operation) {
    preferenceWriteQueue = preferenceWriteQueue
      .catch((error) => {
        console.warn("Previous Preferences write failed:", error);
      })
      .then(operation);
    return preferenceWriteQueue;
  }

  function persistKey(key, value) {
    const Preferences = getPreferencesPlugin();
    if (!Preferences) {
      return Promise.resolve();
    }

    return enqueuePreferenceWrite(() => Preferences.set({ key, value }));
  }

  async function restoreStorageFromPreferences() {
    const Preferences = getPreferencesPlugin();
    if (!Preferences) {
      return;
    }

    const { keys } = await Preferences.keys();
    const persistedKeys = keys.filter((key) => isPersistedKey(key));

    for (const key of persistedKeys) {
      const { value } = await Preferences.get({ key });
      if (value !== null && value !== undefined) {
        nativeStorageSetItem(key, value);
      }
    }

    for (const key of Object.keys(localStorage)) {
      if (!isPersistedKey(key)) {
        continue;
      }

      const localValue = localStorage.getItem(key);
      if (!localValue) {
        continue;
      }

      const { value: storedValue } = await Preferences.get({ key });
      if (storedValue === null || storedValue === undefined) {
        await Preferences.set({ key, value: localValue });
      }
    }
  }

  function flushStorageToPreferences() {
    const Preferences = getPreferencesPlugin();
    if (!Preferences) {
      return Promise.resolve();
    }

    const snapshot = Object.keys(localStorage)
      .filter(isPersistedKey)
      .map((key) => ({ key, value: localStorage.getItem(key) }));

    return enqueuePreferenceWrite(() =>
      Promise.all(snapshot.map(({ key, value }) => Preferences.set({ key, value }))),
    );
  }

  function installStoragePersistence() {
    localStorage.setItem = function patchedSetItem(key, value) {
      nativeStorageSetItem(key, value);
      if (isPersistedKey(key)) {
        persistKey(key, value).catch((error) => {
          console.warn("Preferences set failed:", error);
        });
      }
    };

    localStorage.removeItem = function patchedRemoveItem(key) {
      nativeStorageRemoveItem(key);
      if (isPersistedKey(key)) {
        enqueuePreferenceWrite(() => getPreferencesPlugin()?.remove({ key }))
          .catch((error) => console.warn("Preferences remove failed:", error));
      }
    };

    localStorage.clear = function patchedClear() {
      const keys = Object.keys(localStorage).filter(isPersistedKey);
      nativeStorageClear();
      keys.forEach((key) => {
        enqueuePreferenceWrite(() => getPreferencesPlugin()?.remove({ key }))
          .catch((error) => console.warn("Preferences remove failed:", error));
      });
    };
  }

  window.PB_persistNow = () => flushStorageToPreferences();

  window.PB_shareFile = async ({ filename, content, mimeType }) => {
    if (!isCapacitor) {
      return false;
    }

    const Filesystem = getNativePlugin("Filesystem");
    const Share = getNativePlugin("Share");
    if (!Filesystem || !Share) {
      return false;
    }

    await Filesystem.writeFile({
      path: filename,
      data: content,
      directory: "CACHE",
      encoding: "utf8",
    });
    const { uri } = await Filesystem.getUri({
      path: filename,
      directory: "CACHE",
    });

    try {
      await Share.share({
        title: "Резервная копия Pokemon Binder Pokedex",
        dialogTitle: "Сохранить или отправить резервную копию",
        files: [uri],
      });
    } finally {
      Filesystem.deleteFile({ path: filename, directory: "CACHE" }).catch(() => {});
    }
    return true;
  };

  function installZoomPrevention() {
    let lastTouchEnd = 0;

    document.addEventListener(
      "touchend",
      (event) => {
        const now = Date.now();
        if (now - lastTouchEnd <= 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      },
      { passive: false },
    );

    document.addEventListener(
      "gesturestart",
      (event) => {
        event.preventDefault();
      },
      { passive: false },
    );
  }

  function installLifecycleFlush() {
    const App = getAppPlugin();
    if (App && typeof App.addListener === "function") {
      App.addListener("pause", () => {
        flushStorageToPreferences().catch((error) => {
          console.warn("Preferences flush failed:", error);
        });
      });
    }

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") {
        flushStorageToPreferences().catch((error) => {
          console.warn("Preferences flush failed:", error);
        });
      }
    });
  }

  window.PB_storageReady = (async () => {
    if (!isCapacitor) {
      return;
    }

    document.documentElement.classList.add("mobile-app");
    installStoragePersistence();
    installZoomPrevention();
    await restoreStorageFromPreferences();
    installLifecycleFlush();
  })();

  if (!isCapacitor) {
    return;
  }

  let pokemonIndexCache = null;

  async function loadPokemonIndex() {
    if (pokemonIndexCache) {
      return pokemonIndexCache;
    }

    const response = await fetch("./data/pokemon-index.json");
    if (!response.ok) {
      throw new Error("Pokemon index is unavailable");
    }

    pokemonIndexCache = await response.json();
    return pokemonIndexCache;
  }

  function resolvePokemonId(query) {
    const normalized = decodeURIComponent(String(query)).trim().toLowerCase();
    if (/^\d+$/.test(normalized)) {
      const pokemonId = Number(normalized);
      return pokemonId >= 1 && pokemonId <= 1025 ? pokemonId : null;
    }

    const match = pokemonIndexCache.find((entry) => entry.name === normalized);
    return match ? match.id : null;
  }

  async function fetchPokemonLocal(query) {
    await loadPokemonIndex();
    const pokemonId = resolvePokemonId(query);
    if (!pokemonId) {
      return new Response(JSON.stringify({ error: "Pokemon not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await fetch(`./data/pokemon-details/${pokemonId}.json`);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Pokemon not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const pokemon = await response.json();
    return new Response(JSON.stringify(pokemon), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  async function fetchEvolutionLocal(pokemonId) {
    const response = await fetch(`./data/evolution-chains/${pokemonId}.json`);
    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Failed to load evolution chain" }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await response.json();
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  function readLocalCollection() {
    try {
      const parsed = JSON.parse(localStorage.getItem("pokemonBinder.collection"));
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed.map((entry) => ({
        key: entry.key || String(entry.pokemon.id),
        pokemon: entry.pokemon,
        slot: entry.slot,
        addedAt: entry.addedAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  function writeLocalCollection(entries) {
    localStorage.setItem("pokemonBinder.collection", JSON.stringify(entries));
    return flushStorageToPreferences();
  }

  async function handleCollectionRequest(url, options = {}) {
    const method = (options.method || "GET").toUpperCase();

    if (method === "GET" && url.endsWith("/api/collection")) {
      return new Response(JSON.stringify(readLocalCollection()), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "POST" && url.endsWith("/api/collection")) {
      const body = options.body ? JSON.parse(options.body) : {};
      const pokemon = body.pokemon;
      if (!pokemon || !pokemon.id) {
        return new Response(JSON.stringify({ error: "Invalid pokemon payload" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const entries = readLocalCollection().filter((entry) => entry.pokemon.id !== pokemon.id);
      entries.push({
        key: String(pokemon.id),
        pokemon,
        addedAt: new Date().toISOString(),
      });
      await writeLocalCollection(entries);

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "DELETE" && url.endsWith("/api/collection")) {
      await writeLocalCollection([]);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const deleteMatch = url.match(/\/api\/collection\/(\d+)$/);
    if (method === "DELETE" && deleteMatch) {
      const pokemonId = Number(deleteMatch[1]);
      const entries = readLocalCollection().filter((entry) => entry.pokemon.id !== pokemonId);
      await writeLocalCollection(entries);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  async function handleMobileApi(url, options) {
    if (url.includes("/api/pokemon/")) {
      const query = url.split("/api/pokemon/")[1];
      return fetchPokemonLocal(query);
    }

    if (url.includes("/api/evolution/")) {
      const query = url.split("/api/evolution/")[1];
      await loadPokemonIndex();
      const pokemonId = resolvePokemonId(query);
      if (!pokemonId) {
        return new Response(JSON.stringify({ error: "Pokemon not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" },
        });
      }
      return fetchEvolutionLocal(pokemonId);
    }

    if (url.includes("/api/collection")) {
      return handleCollectionRequest(url, options);
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = function mobileFetch(url, options) {
    const requestUrl = typeof url === "string" ? url : url.url;

    if (/^https?:\/\//i.test(requestUrl) && !requestUrl.startsWith(window.location.origin)) {
      return Promise.reject(new Error("Offline mode: external network requests are disabled."));
    }

    if (requestUrl.includes("/api/")) {
      return handleMobileApi(requestUrl, options || {});
    }
    return nativeFetch(url, options);
  };
})();
