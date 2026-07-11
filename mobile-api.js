(function initMobileApi() {
  const isCapacitor =
    window.location.protocol === "capacitor:" ||
    window.location.protocol === "ionic:" ||
    (window.Capacitor && typeof window.Capacitor.isNativePlatform === "function" &&
      window.Capacitor.isNativePlatform());

  window.PB_IS_MOBILE_APP = isCapacitor;
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
    if (requestUrl.includes("/api/")) {
      return handleMobileApi(requestUrl, options || {});
    }
    return nativeFetch(url, options);
  };
})();
