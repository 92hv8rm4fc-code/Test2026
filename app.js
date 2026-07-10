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
};

const POKEMON_INDEX_URL = "./data/pokemon-index.json";
const POKEMON_API_URL = "./api/pokemon";
const COLLECTION_API_URL = "./api/collection";
const OFFICIAL_DEX_SIZE = 1025;
const POKEDEX_FALLBACK_LIMIT = OFFICIAL_DEX_SIZE;

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

const elements = {
  tabButtons: document.querySelectorAll(".tab-button"),
  tabPanels: document.querySelectorAll(".tab-panel"),
  searchForm: document.querySelector("#searchForm"),
  pokemonQuery: document.querySelector("#pokemonQuery"),
  searchStatus: document.querySelector("#searchStatus"),
  pokemonResult: document.querySelector("#pokemonResult"),
  pokemonSuggestions: document.querySelector("#pokemonSuggestions"),
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
  capacityText: document.querySelector("#capacityText"),
  freeSlots: document.querySelector("#freeSlots"),
  refreshPokedex: document.querySelector("#refreshPokedex"),
  showUncollectedPokemon: document.querySelector("#showUncollectedPokemon"),
  pokedexGrid: document.querySelector("#pokedexGrid"),
  pokedexStatus: document.querySelector("#pokedexStatus"),
  pokedexSummary: document.querySelector("#pokedexSummary"),
  pokedexDetails: document.querySelector("#pokedexDetails"),
};

let settings = loadSettings();
let collection = loadCollection();
let currentPokemon = null;
let pokemonIndex = loadPokemonIndexCache();
let pokedexEntries = [];
let showUncollectedPokemon = loadPokedexShowUncollected();
let isPokemonIndexLoading = false;
let isPokedexLoading = false;

init();

function init() {
  hydrateSettingsForm();
  renderCollection();
  updateCapacity();
  renderPokemonSuggestions();
  loadPokemonIndex();
  loadCollectionFromServer();

  elements.searchForm.addEventListener("submit", handleSearch);
  elements.settingsForm.addEventListener("submit", handleSettingsSave);
  elements.resetSettings.addEventListener("click", resetSettings);
  elements.clearCollection.addEventListener("click", clearCollection);
  elements.refreshPokedex.addEventListener("click", () => loadPokedex(true));
  elements.showUncollectedPokemon.checked = showUncollectedPokemon;
  elements.showUncollectedPokemon.addEventListener("change", handlePokedexFilterChange);

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
    // Fall back to the public API when the local index is not available.
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
  if (!pokemonIndex.length) {
    return;
  }

  const options = pokemonIndex.map((entry) => {
    const option = document.createElement("option");
    option.value = entry.name;
    option.label = `#${entry.id.toString().padStart(4, "0")}`;
    return option;
  });

  elements.pokemonSuggestions.replaceChildren(...options);
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
  const visibleEntries = showUncollectedPokemon
    ? pokedexEntries
    : pokedexEntries.filter((entry) => collectedIds.has(entry.id));

  elements.pokedexSummary.textContent = showUncollectedPokemon
    ? `Собрано ${collectedIds.size} из ${pokedexEntries.length} покемонов.`
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
    const tile = document.createElement("button");
    tile.type = "button";
    tile.className = `pokedex-tile${isCollected ? " collected" : ""}`;
    tile.ariaLabel = `${entry.name}, номер ${entry.id}${isCollected ? ", собран" : ", не собран"}`;

    const image = document.createElement("img");
    image.src = entry.sprite || getPokemonArtworkUrl(entry.id);
    image.alt = "";
    image.loading = "lazy";

    const number = document.createElement("span");
    number.textContent = `#${entry.id.toString().padStart(4, "0")}`;

    const name = document.createElement("strong");
    name.textContent = entry.name;

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
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function normalizePokemon(data) {
  if (Array.isArray(data.types) && typeof data.types[0] === "string") {
    return {
      id: data.id,
      name: data.name,
      height: data.height,
      weight: data.weight,
      baseExperience: data.baseExperience ?? "n/a",
      sprite: data.sprite || "",
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
    sprite:
      data.sprites.other?.["official-artwork"]?.front_default ||
      data.sprites.front_default ||
      "",
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

  image.src = pokemon.sprite;
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

  const placement = createPlacementPreview(pokemon);
  addButton.disabled = !canPokemonFitInBinder(pokemon.id);
  addButton.addEventListener("click", () => addPokemonToBinder(pokemon));
  fragment.querySelector(".pokemon-details").insertBefore(placement, addButton);
  elements.pokemonResult.className = "pokemon-result";
  elements.pokemonResult.replaceChildren(card);
}

async function showPokedexDetails(entry) {
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
  const card = document.createElement("div");
  card.className = "pokedex-details-card";

  const image = document.createElement("img");
  image.src = pokemon.sprite;
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

  if (!collectionEntry) {
    const placement = createPlacementPreview(pokemon);
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "Добавить в биндер";
    addButton.disabled = !canPokemonFitInBinder(pokemon.id);
    addButton.addEventListener("click", () => {
      addPokemonToBinder(pokemon);
      renderPokedexDetails(pokemon);
    });
    body.append(placement, addButton);
  }

  card.append(image, body);
  elements.pokedexDetails.className = "panel pokedex-details";
  elements.pokedexDetails.replaceChildren(card);
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
      updateCapacity();
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
  updateCapacity();
  setStatus(`${pokemon.name} добавлен: ${formatSlot(slot)}.`);

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

function renderCollection() {
  const capacity = getCapacity(settings);
  elements.collectionSummary.textContent = collection.length
    ? `Добавлено ${collection.length} из ${capacity} возможных карточек.`
    : "Пока нет добавленных покемонов.";

  if (!collection.length) {
    const empty = document.createElement("div");
    empty.className = "collection-empty";
    empty.textContent = "Добавь первого покемона через поиск выше.";
    elements.collectionList.replaceChildren(empty);
    return;
  }

  const items = collection.map((entry) => {
    const item = document.createElement("article");
    item.className = "collection-item";

    const image = document.createElement("img");
    image.src = entry.pokemon.sprite;
    image.alt = entry.pokemon.name;

    const info = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = `#${entry.pokemon.id} ${entry.pokemon.name}`;
    const slot = document.createElement("p");
    slot.className = "slot";
    slot.textContent = formatSlot(entry.slot);
    info.append(title, slot);

    const remove = document.createElement("button");
    remove.className = "remove-button";
    remove.type = "button";
    remove.textContent = "x";
    remove.ariaLabel = `Убрать ${entry.pokemon.name}`;
    remove.addEventListener("click", () => removeEntry(entry.key));

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
  updateCapacity();

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
  updateCapacity();
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
  updateCapacity();
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
  updateCapacity();
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

function updateCapacity() {
  const capacity = getCapacity(settings);
  const free = Math.max(0, capacity - collection.length);
  elements.freeSlots.textContent = free.toString();
  elements.capacityText.textContent = `${collection.length}/${capacity} занято`;
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
