const DEFAULT_SETTINGS = {
  binderCount: 2,
  sheetsPerBinder: 30,
  sidesPerSheet: 2,
  slotsPerSide: 9,
};

const STORAGE_KEYS = {
  settings: "pokemonBinder.settings",
  collection: "pokemonBinder.collection",
  pokemonIndex: "pokemonBinder.pokemonIndex",
  pokedexShowUncollected: "pokemonBinder.pokedexShowUncollected",
  collectionFilters: "pokemonBinder.collectionFilters",
  pokedexFilters: "pokemonBinder.pokedexFilters",
  wishlist: "pokemonBinder.wishlist",
};

const POKEMON_INDEX_URL = "./data/pokemon-index.json";
const POKEMON_API_URL = "./api/pokemon";
const COLLECTION_API_URL = "./api/collection";
const EVOLUTION_API_URL = "./api/evolution";
const POKEMON_DETAILS_URL = "./data/pokemon-details";
const OFFICIAL_DEX_SIZE = 1025;
const POKEDEX_FALLBACK_LIMIT = OFFICIAL_DEX_SIZE;

const DEFAULT_COLLECTION_FILTERS = {
  search: "",
  type: "",
  generation: "",
  sort: "number-asc",
};

const DEFAULT_POKEDEX_FILTERS = {
  search: "",
  type: "",
  generation: "",
  sort: "number-asc",
};

const SORT_LABELS = {
  "name-asc": "Имя A → Z",
  "name-desc": "Имя Z → A",
  "number-asc": "Номер ↑",
  "number-desc": "Номер ↓",
};

const GENERATIONS = [
  { id: 1, label: "Поколение I", min: 1, max: 151 },
  { id: 2, label: "Поколение II", min: 152, max: 251 },
  { id: 3, label: "Поколение III", min: 252, max: 386 },
  { id: 4, label: "Поколение IV", min: 387, max: 493 },
  { id: 5, label: "Поколение V", min: 494, max: 649 },
  { id: 6, label: "Поколение VI", min: 650, max: 721 },
  { id: 7, label: "Поколение VII", min: 722, max: 809 },
  { id: 8, label: "Поколение VIII", min: 810, max: 905 },
  { id: 9, label: "Поколение IX", min: 906, max: 1025 },
];

const ALL_TYPES = [
  "bug",
  "dark",
  "dragon",
  "electric",
  "fairy",
  "fighting",
  "fire",
  "flying",
  "ghost",
  "grass",
  "ground",
  "ice",
  "normal",
  "poison",
  "psychic",
  "rock",
  "steel",
  "water",
];

const TYPE_COLORS = {
  bug: "#92bc2c",
  dark: "#595761",
  dragon: "#0c69c8",
  electric: "#f2d94e",
  fairy: "#ee90e6",
  fighting: "#d3425f",
  fire: "#fba54c",
  flying: "#a1bbec",
  ghost: "#5f6dbc",
  grass: "#5fbd58",
  ground: "#da7c4d",
  ice: "#75d0c1",
  normal: "#a0a29f",
  poison: "#b763cf",
  psychic: "#fa8581",
  rock: "#c9bb8a",
  steel: "#5695a3",
  water: "#539ddf",
};

const TYPE_TILE_COLORS = {
  bug: { bg: "#eef4e3", border: "#d4e2bc", collectedBg: "#e4efd4" },
  dark: { bg: "#ececee", border: "#d0d0d6", collectedBg: "#e2e2e8" },
  dragon: { bg: "#e4eef8", border: "#b8d0ec", collectedBg: "#d6e6f4" },
  electric: { bg: "#faf6df", border: "#efe4a8", collectedBg: "#f5efcb" },
  fairy: { bg: "#faeef8", border: "#ecd4ea", collectedBg: "#f4e6f2" },
  fighting: { bg: "#f8e8ec", border: "#e8bcc8", collectedBg: "#f2dce2" },
  fire: { bg: "#fbf0e6", border: "#f0d4b8", collectedBg: "#f6e6d4" },
  flying: { bg: "#eef2fa", border: "#ccd8f0", collectedBg: "#e4eaf6" },
  ghost: { bg: "#eceef8", border: "#c8cce8", collectedBg: "#e0e4f2" },
  grass: { bg: "#eaf4ea", border: "#c4dfc4", collectedBg: "#deeede" },
  ground: { bg: "#f6ece6", border: "#e6cbb8", collectedBg: "#efe2d8" },
  ice: { bg: "#e8f6f2", border: "#bfe4da", collectedBg: "#d8eee8" },
  normal: { bg: "#f0f0ee", border: "#d6d6d4", collectedBg: "#e8e8e6" },
  poison: { bg: "#f4eaf6", border: "#dcc8e4", collectedBg: "#ecdef0" },
  psychic: { bg: "#faecea", border: "#f0ccc8", collectedBg: "#f4e4e2" },
  rock: { bg: "#f4f0e8", border: "#ddd0b8", collectedBg: "#ece6da" },
  steel: { bg: "#e8f0f2", border: "#c0d4da", collectedBg: "#dce8ec" },
  water: { bg: "#e8f2fa", border: "#b8d4ec", collectedBg: "#d8e8f4" },
};

const TRAINER_RANKS = [
  { id: "rookie", name: "Новичок", min: 0, lore: "Лига", hint: "Добавь первого покемона в биндер" },
  { id: "beginner", name: "Начинающий тренер", min: 1, lore: "Лига", hint: "Путь коллекционера начался" },
  { id: "badge", name: "Значок", min: 10, lore: "Лига", hint: "Как первый значок Гима" },
  { id: "skilled", name: "Умелый", min: 35, lore: "Лига", hint: "Несколько значков в кармане" },
  { id: "league", name: "Участник Лиги", min: 80, lore: "Лига", hint: "Серьёзный претендент" },
  { id: "gym_leader", name: "Гим-лидер", min: 150, lore: "Лига", hint: "Сила своего типа" },
  { id: "elite_four", name: "Элитная четвёрка", min: 300, lore: "Лига", hint: "Вершина региональной Лиги" },
  { id: "champion", name: "Чемпион Лиги", min: 500, lore: "Лига", hint: "Сильнейший в регионе" },
  { id: "normal", name: "Нормальный класс", min: 600, lore: "Мировой рейтинг", hint: "Вход в World Coronation Series" },
  { id: "great", name: "Великий класс", min: 750, lore: "Мировой рейтинг", hint: "Покеболл-ранг" },
  { id: "ultra", name: "Ультра класс", min: 900, lore: "Мировой рейтинг", hint: "Ультраболл-ранг" },
  { id: "master", name: "Мастер-класс", min: 1000, lore: "Мировой рейтинг", hint: "Топ-8 мира" },
  { id: "monarch", name: "Монарх", min: 1025, lore: "Мировой рейтинг", hint: "Полный National Dex" },
];

const COLLECTION_ACHIEVEMENTS = [
  { id: "catch_1", title: "Первый партнёр", description: "Добавь первого покемона в биндер", goal: 1 },
  { id: "catch_10", title: "Начинающий коллекционер", description: "Собери 10 покемонов", goal: 10 },
  { id: "catch_25", title: "Покедекс оживает", description: "Собери 25 покемонов", goal: 25 },
  { id: "catch_50", title: "Полка заполняется", description: "Собери 50 покемонов", goal: 50 },
  { id: "catch_100", title: "Серьёзная коллекция", description: "Собери 100 покемонов", goal: 100 },
  { id: "catch_250", title: "Охотник за редкостями", description: "Собери 250 покемонов", goal: 250 },
  { id: "catch_500", title: "Чемпионский запас", description: "Собери 500 покемонов", goal: 500 },
  { id: "catch_1025", title: "Полный National Dex", description: "Собери всех 1025 покемонов", goal: 1025 },
];

const TYPE_ACHIEVEMENTS = ALL_TYPES.flatMap((type) => [
  {
    id: `type_${type}_1`,
    title: `Знакомство: ${type}`,
    description: `Добавь хотя бы одного покемона типа ${type}`,
    type,
    goal: 1,
  },
  {
    id: `type_${type}_5`,
    title: `Поклонник ${type}`,
    description: `Собери 5 покемонов типа ${type}`,
    type,
    goal: 5,
  },
]);

const GENERATION_ACHIEVEMENTS = GENERATIONS.flatMap((generation) => {
  const total = generation.max - generation.min + 1;
  return [
    {
      id: `gen_${generation.id}_1`,
      title: `${generation.label}: старт`,
      description: `Добавь первого покемона из ${generation.label}`,
      generation: generation.id,
      goal: 1,
    },
    {
      id: `gen_${generation.id}_half`,
      title: `${generation.label}: исследователь`,
      description: `Собери половину покемонов ${generation.label}`,
      generation: generation.id,
      goal: Math.ceil(total / 2),
    },
    {
      id: `gen_${generation.id}_complete`,
      title: `${generation.label}: чемпион`,
      description: `Собери всех покемонов ${generation.label}`,
      generation: generation.id,
      goal: total,
    },
  ];
});

const SPECIAL_ACHIEVEMENTS = [
  {
    id: "all_types",
    title: "Мастер стихий",
    description: "Собери хотя бы по одному покемону каждого типа",
    check: (stats) => ALL_TYPES.every((type) => (stats.byType[type] || 0) >= 1),
  },
  {
    id: "wishlist",
    title: "Список мечты",
    description: "Добавь покемона в wishlist",
    check: (stats) => stats.wishlistCount >= 1,
  },
];

const elements = {
  tabButtons: document.querySelectorAll(".tab-button"),
  tabPanels: document.querySelectorAll(".tab-panel"),
  searchForm: document.querySelector("#searchForm"),
  pokemonQuery: document.querySelector("#pokemonQuery"),
  searchStatus: document.querySelector("#searchStatus"),
  pokemonResult: document.querySelector("#pokemonResult"),
  pokemonSuggestionList: document.querySelector("#pokemonSuggestionList"),
  pokemonTemplate: document.querySelector("#pokemonTemplate"),
  settingsForm: document.querySelector("#settingsForm"),
  binderCount: document.querySelector("#binderCount"),
  sheetsPerBinder: document.querySelector("#sheetsPerBinder"),
  sidesPerSheet: document.querySelector("#sidesPerSheet"),
  slotsPerSide: document.querySelector("#slotsPerSide"),
  resetSettings: document.querySelector("#resetSettings"),
  clearCollection: document.querySelector("#clearCollection"),
  collectionList: document.querySelector("#collectionList"),
  collectionSummary: document.querySelector("#collectionSummary"),
  collectionSearch: document.querySelector("#collectionSearch"),
  collectionSortDropdown: document.querySelector("#collectionSortDropdown"),
  collectionFilterDropdown: document.querySelector("#collectionFilterDropdown"),
  collectionCount: document.querySelector("#collectionCount"),
  collectionProgress: document.querySelector("#collectionProgress"),
  trainerRank: document.querySelector("#trainerRank"),
  trainerRankHint: document.querySelector("#trainerRankHint"),
  trainerRankCard: document.querySelector("#trainerRankCard"),
  achievementsSummary: document.querySelector("#achievementsSummary"),
  achievementsList: document.querySelector("#achievementsList"),
  refreshPokedex: document.querySelector("#refreshPokedex"),
  showUncollectedPokemon: document.querySelector("#showUncollectedPokemon"),
  pokedexSearch: document.querySelector("#pokedexSearch"),
  pokedexSortDropdown: document.querySelector("#pokedexSortDropdown"),
  pokedexFilterDropdown: document.querySelector("#pokedexFilterDropdown"),
  pokedexGrid: document.querySelector("#pokedexGrid"),
  pokedexStatus: document.querySelector("#pokedexStatus"),
  pokedexSummary: document.querySelector("#pokedexSummary"),
  pokedexDetails: document.querySelector("#pokedexDetails"),
  wishlistList: document.querySelector("#wishlistList"),
  wishlistSummary: document.querySelector("#wishlistSummary"),
  wishlistStatus: document.querySelector("#wishlistStatus"),
  copyWishlist: document.querySelector("#copyWishlist"),
  clearWishlist: document.querySelector("#clearWishlist"),
};

let settings = { ...DEFAULT_SETTINGS };
let collection = [];
let collectionFilters = { ...DEFAULT_COLLECTION_FILTERS };
let pokedexFilters = { ...DEFAULT_POKEDEX_FILTERS };
let wishlist = [];
let currentPokemon = null;
let pokemonIndex = [];
let pokedexEntries = [];
let showUncollectedPokemon = true;
let isPokemonIndexLoading = false;
let isPokedexLoading = false;
let selectedPokedexId = null;
let hideSuggestionListTimeout = null;

function bootstrapApp() {
  settings = loadSettings();
  collection = loadCollection().map((entry) => ({
    ...entry,
    slot: entry.slot || getSlotByPokemonNumber(entry.pokemon.id, settings),
  }));
  collectionFilters = loadCollectionFilters();
  pokedexFilters = loadPokedexFilters();
  wishlist = loadWishlist();
  pokemonIndex = loadPokemonIndexCache();
  showUncollectedPokemon = loadPokedexShowUncollected();
  init();
}

if (window.PB_storageReady) {
  window.PB_storageReady.then(bootstrapApp).catch((error) => {
    console.warn("Storage bootstrap failed:", error);
    bootstrapApp();
  });
} else {
  bootstrapApp();
}

function init() {
  hydrateSettingsForm();
  setupListToolbars();
  hydrateCollectionFiltersForm();
  hydratePokedexFiltersForm();
  renderCollection();
  renderWishlist();
  updateProgressHeader();
  renderPokemonSuggestions();
  setupPokemonAutocomplete();
  loadPokemonIndex();
  loadCollectionFromServer();

  elements.searchForm.addEventListener("submit", handleSearch);
  elements.searchForm.addEventListener("submit", hidePokemonSuggestions);
  elements.settingsForm.addEventListener("submit", handleSettingsSave);
  elements.resetSettings.addEventListener("click", resetSettings);
  elements.clearCollection.addEventListener("click", clearCollection);
  elements.refreshPokedex.addEventListener("click", () => loadPokedex(true));
  elements.showUncollectedPokemon.checked = showUncollectedPokemon;
  elements.showUncollectedPokemon.addEventListener("change", handlePokedexFilterChange);
  elements.collectionSearch.addEventListener("input", handleCollectionFiltersChange);
  elements.pokedexSearch.addEventListener("input", handlePokedexFiltersChange);
  elements.copyWishlist.addEventListener("click", copyWishlistToClipboard);
  elements.clearWishlist.addEventListener("click", clearWishlist);

  elements.tabButtons.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tabTarget));
  });
}

function switchTab(targetId) {
  elements.tabButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.tabTarget === targetId);
  });
  elements.tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === targetId);
  });

  if (targetId === "pokedexTab" && !pokedexEntries.length) {
    loadPokedex();
  }

  if (targetId === "achievementsTab") {
    renderAchievements();
  }
}

async function handleSearch(event) {
  event.preventDefault();

  const query = elements.pokemonQuery.value.trim().toLowerCase();
  if (!query) {
    return;
  }

  setStatus("Ищу покемона...");
  elements.searchForm.querySelector("button").disabled = true;

  try {
    const response = await fetchWithTimeout(
      `${POKEMON_API_URL}/${encodeURIComponent(query)}`,
      45000,
    );

    if (!response.ok) {
      throw new Error("Покемон не найден. Попробуй имя на английском или номер.");
    }

    const pokemon = normalizePokemon(await response.json());
    currentPokemon = pokemon;
    renderPokemon(pokemon);
    setStatus(`Нашёл #${pokemon.id} ${pokemon.name}.`);
  } catch (error) {
    currentPokemon = null;
    const message =
      error.name === "AbortError"
        ? "PokeAPI долго не отвечает. Проверь интернет и попробуй ещё раз."
        : error.message;
    renderEmptyResult(message);
    setStatus(message, true);
  } finally {
    elements.searchForm.querySelector("button").disabled = false;
  }
}

async function fetchWithTimeout(url, timeoutMs, options = {}) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function loadPokemonIndex(forceRefresh = false) {
  if (isPokemonIndexLoading || (isOfficialDexIndex(pokemonIndex) && !forceRefresh)) {
    return;
  }

  isPokemonIndexLoading = true;

  try {
    const index = await fetchPokemonIndex();
    pokemonIndex = index;
    savePokemonIndexCache();
    renderPokemonSuggestions();
  } catch (error) {
    console.warn("Pokemon index was not loaded:", error);
  } finally {
    isPokemonIndexLoading = false;
  }
}

async function fetchPokemonIndex() {
  try {
    const localResponse = await fetchWithTimeout(POKEMON_INDEX_URL, 8000);
    if (localResponse.ok) {
      const localIndex = await localResponse.json();
      if (Array.isArray(localIndex) && localIndex.length) {
        return normalizePokemonIndex(localIndex);
      }
    }
  } catch {
    // Local index is required for offline iOS builds.
  }

  if (window.PB_IS_MOBILE_APP) {
    throw new Error("Локальный индекс покемонов недоступен. Переустанови приложение.");
  }

  const response = await fetchWithTimeout(
    `https://pokeapi.co/api/v2/pokemon?limit=${POKEDEX_FALLBACK_LIMIT}&offset=0`,
    30000,
  );

  if (!response.ok) {
    throw new Error("Не удалось загрузить список имён покемонов.");
  }

  const data = await response.json();
  return normalizePokemonIndex(data.results);
}

function normalizePokemonIndex(entries) {
  return entries
    .map((entry) => {
      const id = Number.isFinite(entry.id) ? entry.id : getPokemonIdFromUrl(entry.url);
      return {
        id,
        name: entry.name,
        sprite: getPokemonArtworkUrl(id),
      };
    })
    .filter((entry) => isOfficialDexPokemon(entry.id))
    .sort((left, right) => left.id - right.id);
}

function isOfficialDexPokemon(pokemonId) {
  return Number.isFinite(pokemonId) && pokemonId >= 1 && pokemonId <= OFFICIAL_DEX_SIZE;
}

function isOfficialDexIndex(index) {
  return (
    index.length === OFFICIAL_DEX_SIZE &&
    index[0]?.id === 1 &&
    index[index.length - 1]?.id === OFFICIAL_DEX_SIZE
  );
}

function renderPokemonSuggestions() {
  updatePokemonAutocomplete(elements.pokemonQuery.value);
}

function setupPokemonAutocomplete() {
  elements.pokemonQuery.addEventListener("input", () => {
    updatePokemonAutocomplete(elements.pokemonQuery.value);
  });

  elements.pokemonQuery.addEventListener("focus", () => {
    updatePokemonAutocomplete(elements.pokemonQuery.value);
  });

  elements.pokemonQuery.addEventListener("blur", () => {
    hideSuggestionListTimeout = window.setTimeout(() => {
      hidePokemonSuggestions();
    }, 180);
  });

  elements.pokemonQuery.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      hidePokemonSuggestions();
    }
  });
}

function hidePokemonSuggestions() {
  elements.pokemonSuggestionList.hidden = true;
  elements.pokemonSuggestionList.replaceChildren();
}

function updatePokemonAutocomplete(rawQuery) {
  if (hideSuggestionListTimeout) {
    window.clearTimeout(hideSuggestionListTimeout);
    hideSuggestionListTimeout = null;
  }

  const query = rawQuery.trim().toLowerCase();
  if (!query || !pokemonIndex.length) {
    hidePokemonSuggestions();
    return;
  }

  const matches = pokemonIndex
    .filter((entry) => {
      const idText = String(entry.id);
      return entry.name.startsWith(query) || idText.startsWith(query);
    })
    .slice(0, 10);

  if (!matches.length) {
    hidePokemonSuggestions();
    return;
  }

  const items = matches.map((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-suggestion";
    button.setAttribute("role", "option");

    const image = document.createElement("img");
    image.src = entry.sprite || getPokemonArtworkUrl(entry.id);
    image.alt = "";

    const name = document.createElement("strong");
    name.textContent = entry.name;

    const number = document.createElement("span");
    number.textContent = `#${entry.id.toString().padStart(4, "0")}`;

    button.append(image, name, number);
    button.addEventListener("mousedown", (event) => {
      event.preventDefault();
    });
    button.addEventListener("click", () => {
      elements.pokemonQuery.value = entry.name;
      hidePokemonSuggestions();
      elements.searchForm.requestSubmit();
    });
    return button;
  });

  elements.pokemonSuggestionList.replaceChildren(...items);
  elements.pokemonSuggestionList.hidden = false;
}

function scrollPokedexDetailsIntoView() {
  window.requestAnimationFrame(() => {
    elements.pokedexDetails.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  });
}

function getPokemonGeneration(pokemonId) {
  const generation = GENERATIONS.find(
    (entry) => pokemonId >= entry.min && pokemonId <= entry.max,
  );
  return generation ? generation.id : null;
}

function setupListToolbars() {
  setupListToolbar({
    sortDropdown: elements.collectionSortDropdown,
    filterDropdown: elements.collectionFilterDropdown,
    getFilters: () => collectionFilters,
    setSort: (sort) => {
      collectionFilters = { ...collectionFilters, sort };
      saveCollectionFilters();
      renderCollection();
    },
    setFilter: (key, value) => {
      collectionFilters = { ...collectionFilters, [key]: value };
      saveCollectionFilters();
      renderCollection();
    },
  });

  setupListToolbar({
    sortDropdown: elements.pokedexSortDropdown,
    filterDropdown: elements.pokedexFilterDropdown,
    getFilters: () => pokedexFilters,
    setSort: (sort) => {
      pokedexFilters = { ...pokedexFilters, sort };
      savePokedexFilters();
      renderPokedexGrid();
    },
    setFilter: (key, value) => {
      pokedexFilters = { ...pokedexFilters, [key]: value };
      savePokedexFilters();
      renderPokedexGrid();
    },
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".dropdown")) {
      closeAllDropdowns();
    }
  });
}

function setupListToolbar({ sortDropdown, filterDropdown, getFilters, setSort, setFilter }) {
  const sortMenu = sortDropdown.querySelector(".dropdown__menu");
  sortMenu.replaceChildren(
    ...Object.entries(SORT_LABELS).map(([value, label]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "dropdown__item";
      button.dataset.sort = value;
      button.setAttribute("role", "menuitem");
      button.textContent = label;
      button.addEventListener("click", () => {
        setSort(value);
        updateDropdownLabels(sortDropdown, filterDropdown, getFilters());
        closeAllDropdowns();
      });
      return button;
    }),
  );

  const filterMenu = filterDropdown.querySelector(".dropdown__menu");
  const typeHeading = document.createElement("p");
  typeHeading.className = "dropdown__heading";
  typeHeading.textContent = "Тип";

  const typeGroup = document.createElement("div");
  typeGroup.className = "dropdown__group";
  typeGroup.append(
    createFilterOption("Все типы", "type", "", setFilter, sortDropdown, filterDropdown, getFilters),
    ...ALL_TYPES.map((type) =>
      createFilterOption(type, "type", type, setFilter, sortDropdown, filterDropdown, getFilters),
    ),
  );

  const generationHeading = document.createElement("p");
  generationHeading.className = "dropdown__heading";
  generationHeading.textContent = "Поколение";

  const generationGroup = document.createElement("div");
  generationGroup.className = "dropdown__group";
  generationGroup.append(
    createFilterOption(
      "Все поколения",
      "generation",
      "",
      setFilter,
      sortDropdown,
      filterDropdown,
      getFilters,
    ),
    ...GENERATIONS.map((generation) =>
      createFilterOption(
        generation.label,
        "generation",
        String(generation.id),
        setFilter,
        sortDropdown,
        filterDropdown,
        getFilters,
      ),
    ),
  );

  filterMenu.append(typeHeading, typeGroup, generationHeading, generationGroup);

  sortDropdown.querySelector(".dropdown__toggle").addEventListener("click", (event) => {
    event.stopPropagation();
    toggleDropdown(sortDropdown);
  });

  filterDropdown.querySelector(".dropdown__toggle").addEventListener("click", (event) => {
    event.stopPropagation();
    toggleDropdown(filterDropdown);
  });

  updateDropdownLabels(sortDropdown, filterDropdown, getFilters());
}

function createFilterOption(label, key, value, setFilter, sortDropdown, filterDropdown, getFilters) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "dropdown__item";
  button.dataset.filterKey = key;
  button.dataset.filterValue = value;
  button.setAttribute("role", "menuitem");
  button.textContent = label;
  button.addEventListener("click", () => {
    setFilter(key, value);
    updateDropdownLabels(sortDropdown, filterDropdown, getFilters());
    closeAllDropdowns();
  });
  return button;
}

function toggleDropdown(dropdown) {
  const isOpen = dropdown.classList.contains("open");
  closeAllDropdowns();
  if (!isOpen) {
    dropdown.classList.add("open");
    dropdown.querySelector(".dropdown__toggle").setAttribute("aria-expanded", "true");
  }
}

function closeAllDropdowns() {
  document.querySelectorAll(".dropdown.open").forEach((dropdown) => {
    dropdown.classList.remove("open");
    dropdown.querySelector(".dropdown__toggle").setAttribute("aria-expanded", "false");
  });
}

function updateDropdownLabels(sortDropdown, filterDropdown, filters) {
  const sortToggle = sortDropdown.querySelector(".dropdown__toggle");
  sortToggle.textContent = `Сортировка: ${SORT_LABELS[filters.sort] || SORT_LABELS["number-asc"]}`;

  sortDropdown.querySelectorAll("[data-sort]").forEach((button) => {
    button.classList.toggle("active", button.dataset.sort === filters.sort);
  });

  const activeFilters = [filters.type, filters.generation].filter(Boolean).length;
  const filterToggle = filterDropdown.querySelector(".dropdown__toggle");
  filterToggle.textContent = activeFilters ? `Фильтры (${activeFilters})` : "Фильтры";

  filterDropdown.querySelectorAll("[data-filter-key]").forEach((button) => {
    const key = button.dataset.filterKey;
    const value = button.dataset.filterValue;
    button.classList.toggle("active", String(filters[key] || "") === value);
  });
}

function hydrateCollectionFiltersForm() {
  elements.collectionSearch.value = collectionFilters.search;
  updateDropdownLabels(
    elements.collectionSortDropdown,
    elements.collectionFilterDropdown,
    collectionFilters,
  );
}

function hydratePokedexFiltersForm() {
  elements.pokedexSearch.value = pokedexFilters.search;
  updateDropdownLabels(elements.pokedexSortDropdown, elements.pokedexFilterDropdown, pokedexFilters);
}

function handleCollectionFiltersChange() {
  collectionFilters = {
    ...collectionFilters,
    search: elements.collectionSearch.value.trim().toLowerCase(),
  };
  saveCollectionFilters();
  renderCollection();
}

function handlePokedexFiltersChange() {
  pokedexFilters = {
    ...pokedexFilters,
    search: elements.pokedexSearch.value.trim().toLowerCase(),
  };
  savePokedexFilters();
  renderPokedexGrid();
}

function getPrimaryType(subject) {
  const types = subject.pokemon?.types || subject.types || [];
  return types[0] || "normal";
}

function matchesSearchQuery(subject, query) {
  if (!query) {
    return true;
  }

  const name = subject.pokemon?.name || subject.name || "";
  return name.includes(query);
}

function matchesTypeFilter(subject, typeFilter) {
  if (!typeFilter) {
    return true;
  }

  const types = subject.pokemon?.types || subject.types || [];
  return types.includes(typeFilter);
}

function matchesGenerationFilter(subject, generationFilter) {
  if (!generationFilter) {
    return true;
  }

  const pokemonId = subject.pokemon?.id || subject.id;
  return String(getPokemonGeneration(pokemonId)) === String(generationFilter);
}

function sortEntries(entries, sortKey) {
  const [key, direction] = sortKey.split("-");
  const factor = direction === "desc" ? -1 : 1;

  return [...entries].sort((left, right) => {
    if (key === "name") {
      const leftName = left.pokemon?.name || left.name || "";
      const rightName = right.pokemon?.name || right.name || "";
      return leftName.localeCompare(rightName) * factor;
    }

    return ((left.pokemon?.id || left.id) - (right.pokemon?.id || right.id)) * factor;
  });
}

function getTypeTileColors(types) {
  return TYPE_TILE_COLORS[getPrimaryType({ types })] || TYPE_TILE_COLORS.normal;
}

function applyTypeTileColors(tile, types, isCollected) {
  const colors = getTypeTileColors(types);
  tile.style.background = isCollected ? colors.collectedBg : colors.bg;
  tile.style.borderColor = colors.border;
}

async function enrichPokedexWithTypes() {
  const batchSize = 80;

  for (let index = 0; index < pokedexEntries.length; index += batchSize) {
    const batch = pokedexEntries.slice(index, index + batchSize);
    await Promise.all(
      batch.map(async (entry) => {
        if (entry.types?.length) {
          return;
        }

        try {
          const response = await fetchWithTimeout(`${POKEMON_DETAILS_URL}/${entry.id}.json`, 5000);
          if (!response.ok) {
            return;
          }

          const details = await response.json();
          entry.types = details.types || [];
        } catch {
          entry.types = [];
        }
      }),
    );
  }
}

async function fetchEvolutionChain(pokemonId) {
  const response = await fetchWithTimeout(`${EVOLUTION_API_URL}/${pokemonId}`, 8000);
  if (!response.ok) {
    throw new Error("Evolution chain is unavailable");
  }

  return response.json();
}

function createEvolutionSection(evolutionData, currentId, onSelect) {
  const section = document.createElement("section");
  section.className = "evolution-section";

  const heading = document.createElement("h4");
  heading.className = "evolution-heading";
  heading.textContent = "Эволюции";
  section.append(heading, buildEvolutionStrip(evolutionData, currentId, onSelect));
  return section;
}

function buildEvolutionStrip(evolutionData, currentId, onSelect) {
  const strip = document.createElement("div");
  strip.className = "evolution-strip";

  evolutionData.chain.forEach((stage, index) => {
    if (index > 0) {
      const arrow = document.createElement("span");
      arrow.className = "evolution-arrow";
      arrow.textContent = "→";
      arrow.setAttribute("aria-hidden", "true");
      strip.append(arrow);
    }

    const item = document.createElement("button");
    item.type = "button";
    item.className = `evolution-item${stage.id === currentId ? " current" : ""}`;
    item.disabled = stage.id === currentId;

    const image = document.createElement("img");
    image.src = getPokemonArtworkUrl(stage.id);
    image.alt = stage.name;
    image.loading = "lazy";

    const label = document.createElement("span");
    label.textContent = stage.name;

    item.append(image, label);

    if (stage.id !== currentId && onSelect) {
      item.addEventListener("click", () => onSelect(stage));
    }

    strip.append(item);
  });

  return strip;
}

async function renderEvolutionStrip(container, pokemon, onSelect) {
  container.replaceChildren(makeParagraph("Загружаю эволюции..."));

  try {
    const evolutionData = await fetchEvolutionChain(pokemon.id);
    if (evolutionData.chain.length <= 1) {
      container.replaceChildren();
      return;
    }

    container.replaceChildren(createEvolutionSection(evolutionData, pokemon.id, onSelect));
  } catch (error) {
    console.warn("Evolution chain was not loaded:", error);
    container.replaceChildren();
  }
}

async function openPokemonFromEvolution(stage) {
  setStatus(`Открываю #${stage.id} ${stage.name}...`);

  try {
    const response = await fetchWithTimeout(
      `${POKEMON_API_URL}/${encodeURIComponent(stage.name)}`,
      45000,
    );

    if (!response.ok) {
      throw new Error("Не удалось открыть покемона из цепочки эволюции.");
    }

    const pokemon = normalizePokemon(await response.json());
    currentPokemon = pokemon;
    elements.pokemonQuery.value = pokemon.name;
    renderPokemon(pokemon);
    setStatus(`Нашёл #${pokemon.id} ${pokemon.name}.`);
  } catch (error) {
    setStatus(error.message, true);
  }
}

async function loadPokedex(forceRefresh = false) {
  if (isPokedexLoading || (pokedexEntries.length && !forceRefresh)) {
    return;
  }

  isPokedexLoading = true;
  elements.refreshPokedex.disabled = true;
  setPokedexStatus("Загружаю список покемонов...");

  try {
    if (!isOfficialDexIndex(pokemonIndex) || forceRefresh) {
      pokemonIndex = await fetchPokemonIndex();
      savePokemonIndexCache();
      renderPokemonSuggestions();
    }

    pokedexEntries = [...pokemonIndex];
    await enrichPokedexWithTypes();

    renderPokedexGrid();
    setPokedexStatus(`Загружено ${pokedexEntries.length} покемонов.`);
  } catch (error) {
    const message =
      error.name === "AbortError"
        ? "PokeAPI долго не отвечает. VPN включён, но запрос всё равно не вернулся вовремя."
        : error.message;
    setPokedexStatus(message, true);
  } finally {
    isPokedexLoading = false;
    elements.refreshPokedex.disabled = false;
  }
}

function handlePokedexFilterChange(event) {
  showUncollectedPokemon = event.target.checked;
  savePokedexShowUncollected();
  renderPokedexGrid();
}

function renderPokedexGrid() {
  if (!pokedexEntries.length) {
    elements.pokedexSummary.textContent = "Список Pokedex ещё не загружен.";
    elements.pokedexGrid.replaceChildren();
    return;
  }

  const collectedIds = getCollectedPokemonIds();
  let visibleEntries = showUncollectedPokemon
    ? pokedexEntries
    : pokedexEntries.filter((entry) => collectedIds.has(entry.id));

  visibleEntries = visibleEntries.filter(
    (entry) =>
      matchesSearchQuery(entry, pokedexFilters.search) &&
      matchesTypeFilter(entry, pokedexFilters.type) &&
      matchesGenerationFilter(entry, pokedexFilters.generation),
  );
  visibleEntries = sortEntries(visibleEntries, pokedexFilters.sort);

  elements.pokedexSummary.textContent = showUncollectedPokemon
    ? `Собрано ${collectedIds.size} из ${pokedexEntries.length} покемонов. Показано ${visibleEntries.length}.`
    : `Показано ${visibleEntries.length} собранных покемонов.`;

  if (!visibleEntries.length) {
    elements.pokedexGrid.replaceChildren(
      makeParagraph(
        showUncollectedPokemon
          ? "Список пуст."
          : "Пока нет собранных покемонов. Включи «Показывать не собранных», чтобы увидеть весь список.",
      ),
    );
    return;
  }

  const tiles = visibleEntries.map((entry) => {
    const isCollected = collectedIds.has(entry.id);
    const isSelected = selectedPokedexId === entry.id;
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `pokedex-tile${isCollected ? " collected" : ""}${isSelected ? " selected" : ""}`;
    tile.ariaLabel = `${entry.name}, номер ${entry.id}${isCollected ? ", собран" : ", не собран"}`;

    const image = document.createElement("img");
    image.src = entry.sprite || getPokemonArtworkUrl(entry.id);
    image.alt = "";
    image.loading = "lazy";

    const number = document.createElement("span");
    number.textContent = `#${entry.id.toString().padStart(4, "0")}`;

    const name = document.createElement("strong");
    name.textContent = entry.name;

    applyTypeTileColors(tile, entry.types || [], isCollected);
    tile.append(image, number, name);
    tile.addEventListener("click", () => showPokedexDetails(entry));
    return tile;
  });

  elements.pokedexGrid.replaceChildren(...tiles);
}

function getCollectedPokemonIds() {
  return new Set(collection.map((entry) => entry.pokemon.id));
}

function getPokemonIdFromUrl(url) {
  const match = url.match(/\/pokemon\/(\d+)\/?$/);
  return match ? Number(match[1]) : NaN;
}

function getPokemonArtworkUrl(id) {
  return `./data/sprites/${id}.png`;
}

function resolvePokemonSprite(pokemonOrId) {
  const id = typeof pokemonOrId === "number" ? pokemonOrId : pokemonOrId?.id;
  return Number.isFinite(id) ? getPokemonArtworkUrl(id) : "";
}

function configureAddBinderButton(button, pokemon) {
  button.className = "add-button binder-action-button";
  button.innerHTML =
    '<span class="binder-action-icon binder-action-icon--add" aria-hidden="true">+</span><span>В биндер</span>';
  button.setAttribute("aria-label", "Добавить в биндер");
  button.disabled = !canPokemonFitInBinder(pokemon.id);
}

function createRemoveBinderButton(onClick) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "remove-from-binder-button binder-action-button";
  button.innerHTML =
    '<span class="binder-action-icon binder-action-icon--remove" aria-hidden="true"></span><span>Из биндера</span>';
  button.setAttribute("aria-label", "Убрать из биндера");
  button.addEventListener("click", onClick);
  return button;
}

function normalizePokemon(data) {
  if (Array.isArray(data.types) && typeof data.types[0] === "string") {
    return {
      id: data.id,
      name: data.name,
      height: data.height,
      weight: data.weight,
      baseExperience: data.baseExperience ?? "n/a",
      sprite: getPokemonArtworkUrl(data.id),
      types: data.types,
      abilities: data.abilities || [],
      stats: data.stats || [],
    };
  }

  return {
    id: data.id,
    name: data.name,
    height: data.height / 10,
    weight: data.weight / 10,
    baseExperience: data.base_experience ?? "n/a",
    sprite: getPokemonArtworkUrl(data.id),
    types: data.types.map((typeEntry) => typeEntry.type.name),
    abilities: data.abilities.map((abilityEntry) => abilityEntry.ability.name),
    stats: data.stats.map((statEntry) => ({
      name: statEntry.stat.name,
      value: statEntry.base_stat,
    })),
  };
}

function renderPokemon(pokemon) {
  const fragment = elements.pokemonTemplate.content.cloneNode(true);
  const card = fragment.querySelector(".pokemon-card");
  const image = fragment.querySelector(".pokemon-art");
  const number = fragment.querySelector(".pokemon-number");
  const title = fragment.querySelector("h3");
  const types = fragment.querySelector(".type-list");
  const facts = fragment.querySelector(".facts");
  const addButton = fragment.querySelector(".add-button");
  const wishlistButton = fragment.querySelector(".wishlist-button");
  const actions = fragment.querySelector(".pokemon-actions");
  const collectionEntry = collection.find((entry) => entry.pokemon.id === pokemon.id);

  image.src = resolvePokemonSprite(pokemon);
  image.alt = `${pokemon.name} artwork`;
  number.textContent = `#${pokemon.id.toString().padStart(4, "0")}`;
  title.textContent = pokemon.name;

  pokemon.types.forEach((type) => {
    const pill = document.createElement("span");
    pill.className = "type-pill";
    pill.textContent = type;
    pill.style.background = TYPE_COLORS[type] || "#64708a";
    types.append(pill);
  });

  [
    ["Рост", `${pokemon.height} м`],
    ["Вес", `${pokemon.weight} кг`],
    ["Опыт", pokemon.baseExperience],
    ["Способности", pokemon.abilities.join(", ")],
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    item.innerHTML = `<dt>${label}</dt><dd>${value}</dd>`;
    facts.append(item);
  });

  if (collectionEntry) {
    addButton.remove();
    actions.insertBefore(
      createRemoveBinderButton(() => {
        removeEntry(collectionEntry.key);
        renderPokemon(pokemon);
        setStatus(`${pokemon.name} убран из биндера.`);
      }),
      wishlistButton,
    );
  } else {
    configureAddBinderButton(addButton, pokemon);
    addButton.addEventListener("click", async () => {
      await addPokemonToBinder(pokemon);
      renderPokemon(pokemon);
    });
  }

  updateWishlistButton(wishlistButton, pokemon);
  wishlistButton.addEventListener("click", () => toggleWishlistPokemon(pokemon, wishlistButton));
  fragment.querySelector(".pokemon-details").insertBefore(
    createPlacementSection(pokemon),
    fragment.querySelector(".pokemon-actions"),
  );
  elements.pokemonResult.className = "pokemon-result";
  elements.pokemonResult.replaceChildren(card);

  const evolutionWrap = card.querySelector(".evolution-strip-wrap");
  renderEvolutionStrip(evolutionWrap, pokemon, (stage) => openPokemonFromEvolution(stage));
}

async function showPokedexDetails(entry) {
  selectedPokedexId = entry.id;
  renderPokedexGrid();
  elements.pokedexDetails.className = "panel pokedex-details empty";
  elements.pokedexDetails.replaceChildren(makeParagraph(`Загружаю #${entry.id} ${entry.name}...`));

  try {
    const response = await fetchWithTimeout(
      `${POKEMON_API_URL}/${entry.id}`,
      45000,
    );

    if (!response.ok) {
      throw new Error("Не удалось загрузить детали покемона.");
    }

    const pokemon = normalizePokemon(await response.json());
    renderPokedexDetails(pokemon);
  } catch (error) {
    const message =
      error.name === "AbortError"
        ? "PokeAPI долго не отвечает. Попробуй открыть детали ещё раз."
        : error.message;
    elements.pokedexDetails.replaceChildren(makeParagraph(message));
  }
}

function renderPokedexDetails(pokemon) {
  const collectionEntry = collection.find((entry) => entry.pokemon.id === pokemon.id);
  const wrapper = document.createElement("div");
  wrapper.className = "pokedex-details-layout";

  const evolutionWrap = document.createElement("div");
  evolutionWrap.className = "evolution-strip-wrap";
  renderEvolutionStrip(evolutionWrap, pokemon, async (stage) => {
    await showPokedexDetails({ id: stage.id, name: stage.name });
  });

  const card = document.createElement("div");
  card.className = "pokedex-details-card";

  const image = document.createElement("img");
  image.src = resolvePokemonSprite(pokemon);
  image.alt = `${pokemon.name} artwork`;

  const body = document.createElement("div");
  const number = document.createElement("p");
  number.className = "pokemon-number";
  number.textContent = `#${pokemon.id.toString().padStart(4, "0")}`;

  const title = document.createElement("h3");
  title.textContent = pokemon.name;

  const note = document.createElement("span");
  note.className = `collected-note${collectionEntry ? "" : " missing"}`;
  note.textContent = collectionEntry ? `Собран: ${formatSlot(collectionEntry.slot)}` : "Пока не собран";

  const types = document.createElement("div");
  types.className = "type-list";
  pokemon.types.forEach((type) => {
    const pill = document.createElement("span");
    pill.className = "type-pill";
    pill.textContent = type;
    pill.style.background = TYPE_COLORS[type] || "#64708a";
    types.append(pill);
  });

  const facts = document.createElement("dl");
  facts.className = "facts";
  [
    ["Рост", `${pokemon.height} м`],
    ["Вес", `${pokemon.weight} кг`],
    ["Опыт", pokemon.baseExperience],
    ["Способности", pokemon.abilities.join(", ")],
  ].forEach(([label, value]) => {
    const item = document.createElement("div");
    item.innerHTML = `<dt>${label}</dt><dd>${value}</dd>`;
    facts.append(item);
  });

  body.append(number, title, note, types, facts);

  const actions = document.createElement("div");
  actions.className = "pokemon-actions";

  if (!collectionEntry) {
    body.append(createPlacementSection(pokemon));
    const addButton = document.createElement("button");
    addButton.type = "button";
    configureAddBinderButton(addButton, pokemon);
    addButton.addEventListener("click", () => {
      addPokemonToBinder(pokemon);
      renderPokedexDetails(pokemon);
    });
    actions.append(addButton);
  } else {
    actions.append(
      createRemoveBinderButton(() => {
        removeEntry(collectionEntry.key);
        renderPokedexDetails(pokemon);
        setPokedexStatus(`${pokemon.name} убран из биндера.`);
      }),
    );
  }

  const wishlistButton = document.createElement("button");
  wishlistButton.type = "button";
  wishlistButton.className = "wishlist-button";
  updateWishlistButton(wishlistButton, pokemon);
  wishlistButton.addEventListener("click", () => {
    toggleWishlistPokemon(pokemon, wishlistButton);
  });
  actions.append(wishlistButton);
  body.append(actions);

  card.append(image, body);
  wrapper.append(card, evolutionWrap);
  elements.pokedexDetails.className = "panel pokedex-details";
  elements.pokedexDetails.replaceChildren(wrapper);
  scrollPokedexDetailsIntoView();
}

function makeParagraph(text) {
  const paragraph = document.createElement("p");
  paragraph.textContent = text;
  return paragraph;
}

function renderEmptyResult(message = "Здесь появится найденный покемон.") {
  elements.pokemonResult.className = "pokemon-result empty";
  const text = document.createElement("p");
  text.textContent = message;
  elements.pokemonResult.replaceChildren(text);
}

async function loadCollectionFromServer() {
  const cachedCollection = [...collection];

  try {
    const response = await fetchWithTimeout(COLLECTION_API_URL, 8000);
    if (!response.ok) {
      throw new Error("Collection API is unavailable");
    }

    const serverCollection = await response.json();
    if (serverCollection.length) {
      collection = hydrateCollection(serverCollection);
      saveCollection();
      renderCollection();
      refreshPokedexView();
      updateProgressHeader();
      return;
    }

    if (cachedCollection.length) {
      await Promise.all(cachedCollection.map((entry) => persistCollectionEntry(entry)));
    }
  } catch (error) {
    console.warn("Collection DB was not loaded:", error);
  }
}

function hydrateCollection(entries) {
  return entries.map((entry) => ({
    key: entry.key || String(entry.pokemon.id),
    pokemon: entry.pokemon,
    slot: getSlotByPokemonNumber(entry.pokemon.id, settings),
    addedAt: entry.addedAt,
  }));
}

async function addPokemonToBinder(pokemon) {
  const capacity = getCapacity(settings);

  if (collection.some((entry) => entry.pokemon.id === pokemon.id)) {
    setStatus(`${pokemon.name} уже есть в биндере.`, true);
    return;
  }

  if (!canPokemonFitInBinder(pokemon.id)) {
    setStatus(
      `#${pokemon.id} не помещается в текущие настройки: всего ${capacity} ячеек.`,
      true,
    );
    return;
  }

  const slot = getSlotByPokemonNumber(pokemon.id, settings);
  const entry = {
    key: crypto.randomUUID ? crypto.randomUUID() : `${pokemon.id}-${Date.now()}`,
    pokemon,
    slot,
    addedAt: new Date().toISOString(),
  };

  collection = [...collection, entry];
  saveCollection();
  renderCollection();
  refreshPokedexView();
  updateProgressHeader();
  setStatus(`${pokemon.name} добавлен: ${formatSlot(slot)}.`);

  if (currentPokemon?.id === pokemon.id) {
    renderPokemon(pokemon);
  }

  try {
    await persistCollectionEntry(entry);
  } catch {
    setStatus(`${pokemon.name} добавлен локально, но база временно недоступна.`, true);
  }
}

async function persistCollectionEntry(entry) {
  const response = await fetchWithTimeout(COLLECTION_API_URL, 8000, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pokemon: entry.pokemon }),
  });

  if (!response.ok) {
    throw new Error("Failed to save collection entry");
  }
}

function getCapacity(currentSettings) {
  return (
    currentSettings.binderCount *
    currentSettings.sheetsPerBinder *
    currentSettings.sidesPerSheet *
    currentSettings.slotsPerSide
  );
}

function getSlotByIndex(index, currentSettings) {
  const slotsPerSheet = currentSettings.sidesPerSheet * currentSettings.slotsPerSide;
  const slotsPerBinder = currentSettings.sheetsPerBinder * slotsPerSheet;
  const binder = Math.floor(index / slotsPerBinder) + 1;
  const indexInBinder = index % slotsPerBinder;
  const sheet = Math.floor(indexInBinder / slotsPerSheet) + 1;
  const indexInSheet = indexInBinder % slotsPerSheet;
  const sideIndex = Math.floor(indexInSheet / currentSettings.slotsPerSide);
  const cell = (indexInSheet % currentSettings.slotsPerSide) + 1;

  return {
    binder,
    sheet,
    side: sideIndex === 0 ? "лицевая" : "задняя",
    cell,
  };
}

function getSlotByPokemonNumber(pokemonId, currentSettings) {
  return getSlotByIndex(pokemonId - 1, currentSettings);
}

function canPokemonFitInBinder(pokemonId) {
  return pokemonId <= getCapacity(settings);
}

function createPlacementSection(pokemon) {
  const details = document.createElement("details");
  details.className = "placement-toggle";

  const summary = document.createElement("summary");
  summary.textContent = "Место в биндере";

  details.append(summary, createPlacementPreview(pokemon));

  if (!canPokemonFitInBinder(pokemon.id)) {
    details.classList.add("placement-toggle--disabled");
    summary.textContent = "Не помещается в биндер";
  }

  return details;
}

function getCollectionStats() {
  const byType = Object.fromEntries(ALL_TYPES.map((type) => [type, 0]));
  const byGeneration = Object.fromEntries(GENERATIONS.map((generation) => [generation.id, 0]));

  collection.forEach((entry) => {
    (entry.pokemon.types || []).forEach((type) => {
      if (byType[type] !== undefined) {
        byType[type] += 1;
      }
    });

    const generationId = getPokemonGeneration(entry.pokemon.id);
    if (generationId) {
      byGeneration[generationId] += 1;
    }
  });

  return {
    total: collection.length,
    byType,
    byGeneration,
    wishlistCount: wishlist.length,
  };
}

function getTrainerRankState(stats) {
  let current = TRAINER_RANKS[0];
  let next = TRAINER_RANKS[1] || null;

  for (const rank of TRAINER_RANKS) {
    if (stats.total >= rank.min) {
      current = rank;
    }
  }

  const currentIndex = TRAINER_RANKS.findIndex((rank) => rank.id === current.id);
  next = TRAINER_RANKS[currentIndex + 1] || null;
  return { current, next };
}

function getAchievementEntries(stats) {
  const collectionAchievements = COLLECTION_ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    category: "collection",
    unlocked: stats.total >= achievement.goal,
    progress: Math.min(stats.total, achievement.goal),
  }));

  const typeAchievements = TYPE_ACHIEVEMENTS.map((achievement) => {
    const progress = stats.byType[achievement.type] || 0;
    return {
      ...achievement,
      category: "type",
      unlocked: progress >= achievement.goal,
      progress: Math.min(progress, achievement.goal),
    };
  });

  const generationAchievements = GENERATION_ACHIEVEMENTS.map((achievement) => {
    const progress = stats.byGeneration[achievement.generation] || 0;
    return {
      ...achievement,
      category: "generation",
      unlocked: progress >= achievement.goal,
      progress: Math.min(progress, achievement.goal),
    };
  });

  const specialAchievements = SPECIAL_ACHIEVEMENTS.map((achievement) => ({
    ...achievement,
    category: "special",
    unlocked: achievement.check(stats),
    progress: achievement.check(stats) ? 1 : 0,
    goal: 1,
  }));

  return [...collectionAchievements, ...typeAchievements, ...generationAchievements, ...specialAchievements];
}

function updateTrainerCard() {
  const stats = getCollectionStats();
  const { current, next } = getTrainerRankState(stats);

  elements.trainerRank.textContent = current.name;
  elements.trainerRankHint.textContent = next
    ? `До «${next.name}»: ещё ${next.min - stats.total}`
    : current.hint;
}

function renderAchievements() {
  const stats = getCollectionStats();
  const { current, next } = getTrainerRankState(stats);
  const achievements = getAchievementEntries(stats);
  const unlockedCount = achievements.filter((achievement) => achievement.unlocked).length;

  elements.achievementsSummary.textContent = `Открыто ${unlockedCount} из ${achievements.length} достижений.`;

  const rankCard = elements.trainerRankCard;
  rankCard.replaceChildren();

  const lore = document.createElement("p");
  lore.className = "eyebrow";
  lore.textContent = current.lore;

  const title = document.createElement("h3");
  title.textContent = current.name;

  const hint = document.createElement("p");
  hint.textContent = current.hint;

  rankCard.append(lore, title, hint);

  if (next) {
    const progress = document.createElement("div");
    progress.className = "rank-progress";
    const range = next.min - current.min;
    const value = stats.total - current.min;
    const percent = range > 0 ? Math.round((value / range) * 100) : 100;

    progress.innerHTML = `
      <div class="rank-progress__bar" aria-hidden="true">
        <div class="rank-progress__fill" style="width: ${percent}%"></div>
      </div>
      <small>До ранга «${next.name}»: ${stats.total} / ${next.min}</small>
    `;
    rankCard.append(progress);
  }

  elements.achievementsList.replaceChildren(
    ...achievements.map((achievement) => {
      const card = document.createElement("article");
      card.className = `achievement-card${achievement.unlocked ? " unlocked" : " locked"}`;

      const badge = document.createElement("span");
      badge.className = "achievement-card__badge";
      badge.textContent = achievement.unlocked ? "Получено" : "Закрыто";

      const achievementTitle = document.createElement("h4");
      achievementTitle.textContent = achievement.title;

      const description = document.createElement("p");
      description.textContent = achievement.description;

      card.append(badge, achievementTitle, description);

      if (achievement.goal && achievement.goal > 1) {
        const progressNote = document.createElement("p");
        progressNote.textContent = `Прогресс: ${achievement.progress ?? 0} / ${achievement.goal}`;
        card.append(progressNote);
      }

      return card;
    }),
  );

  updateTrainerCard();
}

function updateProgressHeader() {
  elements.collectionCount.textContent = collection.length.toString();
  elements.collectionProgress.textContent = `из ${OFFICIAL_DEX_SIZE}`;
  updateTrainerCard();
}

function createPlacementPreview(pokemon) {
  const placement = document.createElement("div");
  placement.className = "slot-preview";

  if (!canPokemonFitInBinder(pokemon.id)) {
    placement.textContent = `#${pokemon.id}: не помещается в текущую вместимость биндера.`;
    return placement;
  }

  const slot = getSlotByPokemonNumber(pokemon.id, settings);
  const text = document.createElement("p");
  text.textContent = `Класть сюда: ${formatSlot(slot)}.`;

  const grid = document.createElement("div");
  grid.className = "slot-map";
  grid.style.setProperty("--slot-columns", getSlotMapColumns(settings.slotsPerSide));
  grid.ariaLabel = `Схема ячеек стороны листа, нужна ячейка ${slot.cell}`;

  for (let cell = 1; cell <= settings.slotsPerSide; cell += 1) {
    const item = document.createElement("span");
    item.className = `slot-map__cell${cell === slot.cell ? " active" : ""}`;
    item.textContent = cell;
    if (cell === slot.cell) {
      item.ariaLabel = `Ячейка ${cell}, сюда положить карту`;
    }
    grid.append(item);
  }

  placement.append(text, grid);
  return placement;
}

function getSlotMapColumns(slotCount) {
  if (slotCount === 9) {
    return 3;
  }

  return Math.ceil(Math.sqrt(slotCount));
}

function recalculateSlots() {
  collection = collection.map((entry) => ({
    ...entry,
    slot: getSlotByPokemonNumber(entry.pokemon.id, settings),
  }));
  saveCollection();
}

function formatSlot(slot) {
  return `биндер ${slot.binder}, лист ${slot.sheet}, ${slot.side} сторона, ячейка ${slot.cell}`;
}

function isInWishlist(pokemonId) {
  return wishlist.some((entry) => entry.pokemon.id === pokemonId);
}

function updateWishlistButton(button, pokemon) {
  const inWishlist = isInWishlist(pokemon.id);
  button.textContent = inWishlist ? "Убрать из wishlist" : "В wishlist";
  button.classList.toggle("in-wishlist", inWishlist);
  button.setAttribute("aria-pressed", String(inWishlist));
}

function addToWishlist(pokemon) {
  if (isInWishlist(pokemon.id)) {
    setWishlistStatus(`${pokemon.name} уже в wishlist.`, true);
    return;
  }

  wishlist = [
    ...wishlist,
    {
      key: crypto.randomUUID ? crypto.randomUUID() : `${pokemon.id}-${Date.now()}`,
      pokemon,
      addedAt: new Date().toISOString(),
    },
  ].sort((left, right) => left.pokemon.id - right.pokemon.id);

  saveWishlist();
  renderWishlist();
  setWishlistStatus(`${pokemon.name} добавлен в wishlist.`);
}

function removeFromWishlist(pokemonId) {
  const removedEntry = wishlist.find((entry) => entry.pokemon.id === pokemonId);
  wishlist = wishlist.filter((entry) => entry.pokemon.id !== pokemonId);
  saveWishlist();
  renderWishlist();

  if (removedEntry) {
    setWishlistStatus(`${removedEntry.pokemon.name} убран из wishlist.`);
  }
}

function toggleWishlistPokemon(pokemon, button = null) {
  if (isInWishlist(pokemon.id)) {
    removeFromWishlist(pokemon.id);
  } else {
    addToWishlist(pokemon);
  }

  if (button) {
    updateWishlistButton(button, pokemon);
  }

  updateProgressHeader();
  if (document.querySelector("#achievementsTab")?.classList.contains("active")) {
    renderAchievements();
  }
}

function formatWishlistLine(pokemon) {
  return `${pokemon.id} ${pokemon.name}`;
}

function buildWishlistClipboardText() {
  return [...wishlist]
    .sort((left, right) => left.pokemon.id - right.pokemon.id)
    .map((entry) => formatWishlistLine(entry.pokemon))
    .join("\n");
}

async function copyWishlistToClipboard() {
  if (!wishlist.length) {
    setWishlistStatus("Wishlist пуст — нечего копировать.", true);
    return;
  }

  const text = buildWishlistClipboardText();

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.append(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }

    setWishlistStatus(`Скопировано ${wishlist.length} покемонов в буфер обмена.`);
  } catch {
    setWishlistStatus("Не удалось скопировать список. Попробуй ещё раз.", true);
  }
}

function clearWishlist() {
  if (!wishlist.length) {
    return;
  }

  const shouldClear = window.confirm("Очистить весь wishlist?");
  if (!shouldClear) {
    return;
  }

  wishlist = [];
  saveWishlist();
  renderWishlist();
  setWishlistStatus("Wishlist очищен.");
}

function renderWishlist() {
  elements.copyWishlist.disabled = !wishlist.length;
  elements.clearWishlist.disabled = !wishlist.length;

  elements.wishlistSummary.textContent = wishlist.length
    ? `В wishlist ${wishlist.length} покемонов.`
    : "Пока нет желаемых покемонов.";

  if (!wishlist.length) {
    const empty = document.createElement("div");
    empty.className = "collection-empty";
    empty.textContent = "Добавь покемона в wishlist через поиск или вкладку Pokedex.";
    elements.wishlistList.replaceChildren(empty);
    return;
  }

  const items = wishlist.map((entry) => {
    const item = document.createElement("article");
    item.className = "collection-item wishlist-item";

    const colors = getTypeTileColors(entry.pokemon.types || []);
    item.style.background = colors.collectedBg;
    item.style.borderColor = colors.border;

    const image = document.createElement("img");
    image.src = resolvePokemonSprite(entry.pokemon);
    image.alt = entry.pokemon.name;

    const info = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = `#${entry.pokemon.id} ${entry.pokemon.name}`;
    const line = document.createElement("p");
    line.className = "slot";
    line.textContent = formatWishlistLine(entry.pokemon);
    info.append(title, line);

    const remove = createRemoveIconButton(
      `Убрать ${entry.pokemon.name} из wishlist`,
      () => removeFromWishlist(entry.pokemon.id),
    );

    item.append(image, info, remove);
    return item;
  });

  elements.wishlistList.replaceChildren(...items);
}

function createRemoveIconButton(ariaLabel, onClick) {
  const button = document.createElement("button");
  button.className = "remove-button";
  button.type = "button";
  button.setAttribute("aria-label", ariaLabel);

  const icon = document.createElement("span");
  icon.className = "remove-button__icon";
  icon.setAttribute("aria-hidden", "true");
  button.append(icon);
  button.addEventListener("click", onClick);
  return button;
}

function setWishlistStatus(message, isError = false) {
  elements.wishlistStatus.textContent = message;
  elements.wishlistStatus.classList.toggle("error", isError);
}

function renderCollection() {
  const capacity = getCapacity(settings);
  const visibleCollection = sortEntries(
    collection.filter(
      (entry) =>
        matchesSearchQuery(entry, collectionFilters.search) &&
        matchesTypeFilter(entry, collectionFilters.type) &&
        matchesGenerationFilter(entry, collectionFilters.generation),
    ),
    collectionFilters.sort,
  );

  elements.collectionSummary.textContent = collection.length
    ? `Добавлено ${collection.length} из ${capacity} возможных карточек. Показано ${visibleCollection.length}.`
    : "Пока нет добавленных покемонов.";

  if (!collection.length) {
    const empty = document.createElement("div");
    empty.className = "collection-empty";
    empty.textContent = "Добавь первого покемона через поиск выше.";
    elements.collectionList.replaceChildren(empty);
    return;
  }

  if (!visibleCollection.length) {
    const empty = document.createElement("div");
    empty.className = "collection-empty";
    empty.textContent = "Ни одна карточка не подходит под выбранные фильтры.";
    elements.collectionList.replaceChildren(empty);
    return;
  }

  const items = visibleCollection.map((entry) => {
    const item = document.createElement("article");
    item.className = "collection-item";

    const colors = getTypeTileColors(entry.pokemon.types);
    item.style.background = colors.collectedBg;
    item.style.borderColor = colors.border;

    const image = document.createElement("img");
    image.src = resolvePokemonSprite(entry.pokemon);
    image.alt = entry.pokemon.name;

    const info = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = `#${entry.pokemon.id} ${entry.pokemon.name}`;
    const slot = document.createElement("p");
    slot.className = "slot";
    slot.textContent = formatSlot(entry.slot);
    info.append(title, slot);

    const remove = createRemoveIconButton(`Убрать ${entry.pokemon.name}`, () =>
      removeEntry(entry.key),
    );

    item.append(image, info, remove);
    return item;
  });

  elements.collectionList.replaceChildren(...items);
}

function removeEntry(key) {
  const removedEntry = collection.find((entry) => entry.key === key);
  collection = collection.filter((entry) => entry.key !== key);
  recalculateSlots();
  renderCollection();
  refreshPokedexView();
  updateProgressHeader();

  if (removedEntry) {
    deleteCollectionEntry(removedEntry.pokemon.id).catch((error) => {
      console.warn("Collection DB entry was not deleted:", error);
    });
  }
}

async function deleteCollectionEntry(pokemonId) {
  const response = await fetchWithTimeout(`${COLLECTION_API_URL}/${pokemonId}`, 8000, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete collection entry");
  }
}

function handleSettingsSave(event) {
  event.preventDefault();

  const nextSettings = {
    binderCount: readPositiveNumber(elements.binderCount),
    sheetsPerBinder: readPositiveNumber(elements.sheetsPerBinder),
    sidesPerSheet: Number(elements.sidesPerSheet.value),
    slotsPerSide: readPositiveNumber(elements.slotsPerSide),
  };
  const nextCapacity = getCapacity(nextSettings);
  const overflowingEntry = collection.find((entry) => entry.pokemon.id > nextCapacity);

  if (overflowingEntry) {
    setStatus(
      `Новые настройки дают ${nextCapacity} ячеек, но #${overflowingEntry.pokemon.id} ${overflowingEntry.pokemon.name} туда не помещается.`,
      true,
    );
    return;
  }

  settings = nextSettings;
  saveSettings();
  recalculateSlots();
  renderCollection();
  refreshPokedexView();
  updateProgressHeader();
  setStatus("Настройки биндера сохранены.");
}

function readPositiveNumber(input) {
  return Math.max(1, Number(input.value));
}

function resetSettings() {
  settings = { ...DEFAULT_SETTINGS };
  saveSettings();
  hydrateSettingsForm();
  recalculateSlots();
  renderCollection();
  refreshPokedexView();
  updateProgressHeader();
  setStatus("Настройки сброшены к варианту 2 x 30 x 2 x 9.");
}

function clearCollection() {
  if (!collection.length) {
    return;
  }

  const shouldClear = window.confirm("Очистить весь список добавленных покемонов?");
  if (!shouldClear) {
    return;
  }

  collection = [];
  saveCollection();
  renderCollection();
  refreshPokedexView();
  updateProgressHeader();
  setStatus("Список биндера очищен.");

  clearCollectionOnServer().catch((error) => {
    console.warn("Collection DB was not cleared:", error);
  });
}

async function clearCollectionOnServer() {
  const response = await fetchWithTimeout(COLLECTION_API_URL, 8000, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to clear collection");
  }
}

function refreshPokedexView() {
  if (pokedexEntries.length) {
    renderPokedexGrid();
  }
}

function hydrateSettingsForm() {
  elements.binderCount.value = settings.binderCount;
  elements.sheetsPerBinder.value = settings.sheetsPerBinder;
  elements.sidesPerSheet.value = settings.sidesPerSheet;
  elements.slotsPerSide.value = settings.slotsPerSide;
}

function setStatus(message, isError = false) {
  elements.searchStatus.textContent = message;
  elements.searchStatus.classList.toggle("error", isError);
}

function setPokedexStatus(message, isError = false) {
  elements.pokedexStatus.textContent = message;
  elements.pokedexStatus.classList.toggle("error", isError);
}

function loadSettings() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.settings));
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

function loadPokedexShowUncollected() {
  const stored = localStorage.getItem(STORAGE_KEYS.pokedexShowUncollected);
  return stored === null ? true : stored === "true";
}

function savePokedexShowUncollected() {
  localStorage.setItem(STORAGE_KEYS.pokedexShowUncollected, String(showUncollectedPokemon));
}

function loadCollection() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.collection));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveCollection() {
  localStorage.setItem(STORAGE_KEYS.collection, JSON.stringify(collection));
}

function loadPokemonIndexCache() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.pokemonIndex));
    return Array.isArray(parsed) ? normalizePokemonIndex(parsed) : [];
  } catch {
    return [];
  }
}

function savePokemonIndexCache() {
  localStorage.setItem(STORAGE_KEYS.pokemonIndex, JSON.stringify(pokemonIndex));
}

function loadCollectionFilters() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.collectionFilters));
    return normalizeListFilters(parsed, DEFAULT_COLLECTION_FILTERS);
  } catch {
    return { ...DEFAULT_COLLECTION_FILTERS };
  }
}

function loadPokedexFilters() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.pokedexFilters));
    return normalizeListFilters(parsed, DEFAULT_POKEDEX_FILTERS);
  } catch {
    return { ...DEFAULT_POKEDEX_FILTERS };
  }
}

function normalizeListFilters(parsed, defaults) {
  if (!parsed || typeof parsed !== "object") {
    return { ...defaults };
  }

  if (parsed.sort) {
    return {
      search: parsed.search || "",
      type: parsed.type || "",
      generation: parsed.generation || "",
      sort: SORT_LABELS[parsed.sort] ? parsed.sort : defaults.sort,
    };
  }

  let sort = defaults.sort;
  if (parsed.sortPrimary === "name") {
    sort = "name-asc";
  } else if (parsed.sortPrimary === "number" || parsed.sortPrimary === "binder") {
    sort = "number-asc";
  }

  return {
    search: parsed.search || "",
    type: parsed.type || "",
    generation: "",
    sort,
  };
}

function saveCollectionFilters() {
  localStorage.setItem(STORAGE_KEYS.collectionFilters, JSON.stringify(collectionFilters));
}

function savePokedexFilters() {
  localStorage.setItem(STORAGE_KEYS.pokedexFilters, JSON.stringify(pokedexFilters));
}

function loadWishlist() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEYS.wishlist));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveWishlist() {
  localStorage.setItem(STORAGE_KEYS.wishlist, JSON.stringify(wishlist));
}
