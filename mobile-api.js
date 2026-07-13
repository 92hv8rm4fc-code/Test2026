(function initMobileApi() {
  const STORAGE_PREFIX = "pokemonBinder.";

  const isCapacitor =
    (window.Capacitor &&
      typeof window.Capacitor.isNativePlatform === "function" &&
      window.Capacitor.isNativePlatform()) ||
    window.location.protocol === "capacitor:" ||
    window.location.protocol === "ionic:";

  window.PB_IS_MOBILE_APP = isCapacitor;

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

  async function persistKey(key, value) {
    const Preferences = getPreferencesPlugin();
    if (!Preferences) {
      return;
    }

    await Preferences.set({ key, value });
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
        localStorage.setItem(key, value);
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

  async function flushStorageToPreferences() {
    const Preferences = getPreferencesPlugin();
    if (!Preferences) {
      return;
    }

    await Promise.all(
      Object.keys(localStorage)
        .filter(isPersistedKey)
        .map((key) => Preferences.set({ key, value: localStorage.getItem(key) })),
    );
  }

  function installStoragePersistence() {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalRemoveItem = localStorage.removeItem.bind(localStorage);
    const originalClear = localStorage.clear.bind(localStorage);

    localStorage.setItem = function patchedSetItem(key, value) {
      originalSetItem(key, value);
      if (isPersistedKey(key)) {
        persistKey(key, value).catch((error) => {
          console.warn("Preferences set failed:", error);
        });
      }
    };

    localStorage.removeItem = function patchedRemoveItem(key) {
      originalRemoveItem(key);
      if (isPersistedKey(key)) {
        getPreferencesPlugin()
          ?.remove({ key })
          .catch((error) => console.warn("Preferences remove failed:", error));
      }
    };

    localStorage.clear = function patchedClear() {
      const keys = Object.keys(localStorage).filter(isPersistedKey);
      originalClear();
      keys.forEach((key) => {
        getPreferencesPlugin()
          ?.remove({ key })
          .catch((error) => console.warn("Preferences remove failed:", error));
      });
    };
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
      writeLocalCollection(entries);

      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (method === "DELETE" && url.endsWith("/api/collection")) {
      writeLocalCollection([]);
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const deleteMatch = url.match(/\/api\/collection\/(\d+)$/);
    if (method === "DELETE" && deleteMatch) {
      const pokemonId = Number(deleteMatch[1]);
      const entries = readLocalCollection().filter((entry) => entry.pokemon.id !== pokemonId);
      writeLocalCollection(entries);
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
