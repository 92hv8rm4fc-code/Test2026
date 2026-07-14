const DEFAULT_BINDER = {
  binderCount: 1,
  sheetsPerBinder: 30,
  sidesPerSheet: 2,
  slotsPerSide: 9,
};

const state = {
  lists: [],
  activeList: null,
  cards: [],
  selectedCard: null,
  renderedLimit: 80,
  wizard: {
    sourceType: "paste",
    sourceFileName: null,
    columns: [],
    rows: [],
    preparedRows: [],
    sortRules: [],
  },
};

const elements = {
  tabs: document.querySelectorAll(".tab-button"),
  panels: document.querySelectorAll(".tab-panel"),
  emptyState: document.querySelector("#emptyState"),
  openImportButtons: document.querySelectorAll("[data-open-import]"),
  openRestoreButtons: document.querySelectorAll("[data-open-restore]"),
  headerProgress: document.querySelector("#headerProgress"),
  headerProgressBar: document.querySelector("#headerProgressBar"),
  collectionTitle: document.querySelector("#collectionTitle"),
  collectionSummary: document.querySelector("#collectionSummary"),
  cardSearch: document.querySelector("#cardSearch"),
  collectionFilter: document.querySelector("#collectionFilter"),
  collectionSort: document.querySelector("#collectionSort"),
  cardGrid: document.querySelector("#cardGrid"),
  loadMoreCards: document.querySelector("#loadMoreCards"),
  wishlistSummary: document.querySelector("#wishlistSummary"),
  wishlistGrid: document.querySelector("#wishlistGrid"),
  copyWishlist: document.querySelector("#copyWishlist"),
  wishlistCopyStatus: document.querySelector("#wishlistCopyStatus"),
  listCards: document.querySelector("#listCards"),
  binderForm: document.querySelector("#binderForm"),
  binderCount: document.querySelector("#binderCount"),
  sheetsPerBinder: document.querySelector("#sheetsPerBinder"),
  sidesPerSheet: document.querySelector("#sidesPerSheet"),
  slotsPerSide: document.querySelector("#slotsPerSide"),
  binderStatus: document.querySelector("#binderStatus"),
  exportBackup: document.querySelector("#exportBackup"),
  restoreBackupFile: document.querySelector("#restoreBackupFile"),
  backupStatus: document.querySelector("#backupStatus"),
  importDialog: document.querySelector("#importDialog"),
  importListName: document.querySelector("#importListName"),
  importPaste: document.querySelector("#importPaste"),
  pasteColumnSeparator: document.querySelector("#pasteColumnSeparator"),
  customColumnSeparatorWrap: document.querySelector("#customColumnSeparatorWrap"),
  customColumnSeparator: document.querySelector("#customColumnSeparator"),
  columnSeparatorHint: document.querySelector("#columnSeparatorHint"),
  importFile: document.querySelector("#importFile"),
  importHasHeaders: document.querySelector("#importHasHeaders"),
  pasteSource: document.querySelector("#pasteSource"),
  fileSource: document.querySelector("#fileSource"),
  importSourceStatus: document.querySelector("#importSourceStatus"),
  parseImport: document.querySelector("#parseImport"),
  titleColumn: document.querySelector("#titleColumn"),
  orderMode: document.querySelector("#orderMode"),
  numberingMode: document.querySelector("#numberingMode"),
  numberColumnWrap: document.querySelector("#numberColumnWrap"),
  numberColumn: document.querySelector("#numberColumn"),
  sortRulesFieldset: document.querySelector("#sortRulesFieldset"),
  sortRules: document.querySelector("#sortRules"),
  addSortRule: document.querySelector("#addSortRule"),
  buildPreview: document.querySelector("#buildPreview"),
  previewSummary: document.querySelector("#previewSummary"),
  previewHead: document.querySelector("#previewHead"),
  previewBody: document.querySelector("#previewBody"),
  finishImport: document.querySelector("#finishImport"),
  cardDialog: document.querySelector("#cardDialog"),
  cardDialogNumber: document.querySelector("#cardDialogNumber"),
  cardDialogTitle: document.querySelector("#cardDialogTitle"),
  cardPhotoPreview: document.querySelector("#cardPhotoPreview"),
  cardPhotoInput: document.querySelector("#cardPhotoInput"),
  removeCardPhoto: document.querySelector("#removeCardPhoto"),
  cardFields: document.querySelector("#cardFields"),
  cardSlot: document.querySelector("#cardSlot"),
  toggleCollected: document.querySelector("#toggleCollected"),
  toggleWishlist: document.querySelector("#toggleWishlist"),
};

initialize();

async function initialize() {
  bindEvents();
  await refreshLists();
}

function bindEvents() {
  elements.tabs.forEach((button) => {
    button.addEventListener("click", () => switchTab(button.dataset.tab));
  });

  elements.openImportButtons.forEach((button) => {
    button.addEventListener("click", openImportWizard);
  });
  elements.openRestoreButtons.forEach((button) => {
    button.addEventListener("click", () => elements.restoreBackupFile.click());
  });

  elements.cardSearch.addEventListener("input", () => {
    state.renderedLimit = 80;
    renderCollection();
  });
  elements.collectionFilter.addEventListener("change", () => {
    state.renderedLimit = 80;
    renderCollection();
  });
  elements.collectionSort.addEventListener("change", () => {
    state.renderedLimit = 80;
    renderCollection();
  });
  elements.loadMoreCards.addEventListener("click", () => {
    state.renderedLimit += 100;
    renderCollection();
  });

  document.querySelectorAll('input[name="sourceType"]').forEach((radio) => {
    radio.addEventListener("change", handleSourceTypeChange);
  });
  elements.pasteColumnSeparator.addEventListener("change", updateColumnSeparatorControls);
  elements.parseImport.addEventListener("click", parseImportSource);
  elements.orderMode.addEventListener("change", updateOrderControls);
  elements.numberingMode.addEventListener("change", updateOrderControls);
  elements.addSortRule.addEventListener("click", () => addSortRule());
  elements.buildPreview.addEventListener("click", buildImportPreview);
  elements.finishImport.addEventListener("click", finishImport);
  document.querySelectorAll("[data-back-step]").forEach((button) => {
    button.addEventListener("click", () => showWizardStep(Number(button.dataset.backStep)));
  });

  elements.binderForm.addEventListener("submit", saveBinderSettings);
  elements.exportBackup.addEventListener("click", exportBackup);
  elements.restoreBackupFile.addEventListener("change", restoreBackup);
  elements.copyWishlist.addEventListener("click", copyWishlist);
  elements.cardPhotoInput.addEventListener("change", handleCardPhoto);
  elements.removeCardPhoto.addEventListener("click", removeCardPhoto);
  elements.toggleCollected.addEventListener("click", () => toggleSelectedCard("collected"));
  elements.toggleWishlist.addEventListener("click", () => toggleSelectedCard("wishlist"));

  document.addEventListener(
    "touchend",
    (() => {
      let lastTouchEnd = 0;
      return (event) => {
        const now = Date.now();
        if (now - lastTouchEnd < 300) {
          event.preventDefault();
        }
        lastTouchEnd = now;
      };
    })(),
    { passive: false },
  );
}

async function refreshLists(preferredListId = null) {
  state.lists = await FolioGridStorage.getLists();
  const storedId = localStorage.getItem("foliogrid.activeListId");
  const nextId =
    preferredListId ||
    (state.lists.some((list) => list.id === storedId) ? storedId : state.lists[0]?.id);

  document.body.classList.toggle("has-no-lists", !state.lists.length);
  elements.emptyState.hidden = Boolean(state.lists.length);

  if (!nextId) {
    state.activeList = null;
    state.cards = [];
    renderAll();
    return;
  }

  await selectList(nextId);
}

async function selectList(listId) {
  state.activeList = state.lists.find((list) => list.id === listId) || null;
  state.cards = state.activeList ? await FolioGridStorage.getCards(listId) : [];
  state.renderedLimit = 80;
  localStorage.setItem("foliogrid.activeListId", listId);
  hydrateBinderForm();
  renderAll();
}

function switchTab(panelId) {
  elements.tabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === panelId);
  });
  elements.panels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === panelId);
  });
}

function renderAll() {
  renderHeader();
  renderCollection();
  renderWishlist();
  renderLists();
}

function renderHeader() {
  const collected = state.cards.filter((card) => card.collected).length;
  const total = state.cards.length;
  const percent = total ? Math.round((collected / total) * 100) : 0;
  elements.headerProgress.textContent = `${collected} / ${total}`;
  elements.headerProgressBar.style.width = `${percent}%`;
}

function getVisibleCards() {
  const query = elements.cardSearch.value.trim().toLocaleLowerCase("ru");
  const statusFilter = elements.collectionFilter.value;

  const cards = state.cards.filter((card) => {
    if (statusFilter === "collected" && !card.collected) {
      return false;
    }
    if (statusFilter === "missing" && card.collected) {
      return false;
    }
    if (!query) {
      return true;
    }
    return [card.title, card.displayNumber, ...Object.values(card.fields)]
      .join(" ")
      .toLocaleLowerCase("ru")
      .includes(query);
  });

  const sort = elements.collectionSort.value;
  if (sort === "title-asc") {
    cards.sort((left, right) => compareValues(left.title, right.title));
  } else if (sort === "title-desc") {
    cards.sort((left, right) => compareValues(right.title, left.title));
  } else if (sort === "number") {
    cards.sort((left, right) => compareValues(left.displayNumber, right.displayNumber));
  } else {
    cards.sort((left, right) => left.sequence - right.sequence);
  }
  return cards;
}

function renderCollection() {
  if (!state.activeList) {
    elements.collectionTitle.textContent = "Моя коллекция";
    elements.collectionSummary.textContent = "Создай первый список.";
    elements.cardGrid.replaceChildren();
    elements.loadMoreCards.hidden = true;
    return;
  }

  const visibleCards = getVisibleCards();
  const collected = state.cards.filter((card) => card.collected).length;
  elements.collectionTitle.textContent = state.activeList.name;
  elements.collectionSummary.textContent =
    `Собрано ${collected} из ${state.cards.length}. Показано ${visibleCards.length}.`;

  const fragment = document.createDocumentFragment();
  visibleCards.slice(0, state.renderedLimit).forEach((card) => {
    fragment.append(createCardTile(card));
  });

  if (!visibleCards.length) {
    fragment.append(createEmptyMessage("Карточки по выбранным условиям не найдены."));
  }

  elements.cardGrid.replaceChildren(fragment);
  elements.loadMoreCards.hidden = visibleCards.length <= state.renderedLimit;
}

function createCardTile(card) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `card-tile ${card.collected ? "collected" : "missing"}`;

  if (card.photo) {
    const image = document.createElement("img");
    image.className = "card-image";
    image.src = card.photo;
    image.alt = "";
    image.loading = "lazy";
    button.append(image);
  } else {
    const placeholder = document.createElement("span");
    placeholder.className = "card-placeholder";
    button.append(placeholder);
  }

  const number = document.createElement("span");
  number.className = "card-number";
  number.textContent = `#${card.displayNumber}`;

  const title = document.createElement("strong");
  title.className = "card-title";
  title.textContent = card.title;

  const badges = document.createElement("span");
  badges.className = "card-badges";
  if (card.collected) {
    badges.append(createBadge("В коллекции", "collected"));
  }
  if (card.wishlist) {
    badges.append(createBadge("Wishlist", "wishlist"));
  }

  button.append(number, title, badges);
  button.addEventListener("click", () => openCard(card.id));
  return button;
}

function createBadge(text, className) {
  const badge = document.createElement("span");
  badge.className = `badge ${className}`;
  badge.textContent = text;
  return badge;
}

function createEmptyMessage(text) {
  const message = document.createElement("p");
  message.className = "muted";
  message.textContent = text;
  return message;
}

function renderWishlist() {
  const wishedCards = state.cards.filter((card) => card.wishlist);
  elements.wishlistSummary.textContent = wishedCards.length
    ? `${wishedCards.length} карточек в активном списке.`
    : "Пока пусто.";
  elements.copyWishlist.disabled = !wishedCards.length;

  const fragment = document.createDocumentFragment();
  wishedCards.forEach((card) => fragment.append(createCardTile(card)));
  if (!wishedCards.length) {
    fragment.append(createEmptyMessage("Добавляй карточки в wishlist из их карточки."));
  }
  elements.wishlistGrid.replaceChildren(fragment);
}

function renderLists() {
  elements.exportBackup.disabled = !state.lists.length;
  const fragment = document.createDocumentFragment();
  state.lists.forEach((list) => {
    const item = document.createElement("article");
    item.className = `list-card${list.id === state.activeList?.id ? " active" : ""}`;

    const body = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = list.name;
    const summary = document.createElement("p");
    summary.className = "muted small";
    summary.textContent = `${list.cardCount} карточек · ${sourceLabel(list.sourceType)}`;
    body.append(title, summary);

    const actions = document.createElement("div");
    actions.className = "list-card-actions";
    const select = document.createElement("button");
    select.className = "secondary-button";
    select.type = "button";
    select.textContent = list.id === state.activeList?.id ? "Открыт" : "Открыть";
    select.disabled = list.id === state.activeList?.id;
    select.addEventListener("click", () => selectList(list.id));

    const remove = document.createElement("button");
    remove.className = "icon-button";
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Удалить список ${list.name}`);
    remove.addEventListener("click", () => removeList(list));
    actions.append(select, remove);

    item.append(body, actions);
    fragment.append(item);
  });

  if (!state.lists.length) {
    fragment.append(createEmptyMessage("Списков пока нет."));
  }
  elements.listCards.replaceChildren(fragment);
}

function sourceLabel(type) {
  return { paste: "вставка", csv: "CSV", xlsx: "XLSX" }[type] || type;
}

async function removeList(list) {
  if (!window.confirm(`Удалить список «${list.name}» и все отметки/фотографии?`)) {
    return;
  }
  await FolioGridStorage.deleteList(list.id);
  await refreshLists();
}

function hydrateBinderForm() {
  const binder = state.activeList?.binder || DEFAULT_BINDER;
  elements.binderCount.value = binder.binderCount;
  elements.sheetsPerBinder.value = binder.sheetsPerBinder;
  elements.sidesPerSheet.value = binder.sidesPerSheet;
  elements.slotsPerSide.value = binder.slotsPerSide;
  elements.binderForm.querySelector("button").disabled = !state.activeList;
}

async function saveBinderSettings(event) {
  event.preventDefault();
  if (!state.activeList) {
    return;
  }

  state.activeList = {
    ...state.activeList,
    binder: {
      binderCount: positiveNumber(elements.binderCount.value),
      sheetsPerBinder: positiveNumber(elements.sheetsPerBinder.value),
      sidesPerSheet: positiveNumber(elements.sidesPerSheet.value),
      slotsPerSide: positiveNumber(elements.slotsPerSide.value),
    },
    updatedAt: new Date().toISOString(),
  };
  await FolioGridStorage.putList(state.activeList);
  state.lists = state.lists.map((list) =>
    list.id === state.activeList.id ? state.activeList : list,
  );
  elements.binderStatus.textContent = "Настройки сохранены.";
}

function positiveNumber(value) {
  return Math.max(1, Number(value) || 1);
}

function getCardSlot(card) {
  const binder = state.activeList?.binder || DEFAULT_BINDER;
  const index = Math.max(0, card.sequence - 1);
  const slotsPerSheet = binder.sidesPerSheet * binder.slotsPerSide;
  const slotsPerBinder = binder.sheetsPerBinder * slotsPerSheet;
  const binderNumber = Math.floor(index / slotsPerBinder) + 1;

  if (binderNumber > binder.binderCount) {
    return "Не помещается в текущие настройки биндера.";
  }

  const indexInBinder = index % slotsPerBinder;
  const sheet = Math.floor(indexInBinder / slotsPerSheet) + 1;
  const indexInSheet = indexInBinder % slotsPerSheet;
  const sideIndex = Math.floor(indexInSheet / binder.slotsPerSide);
  const cell = (indexInSheet % binder.slotsPerSide) + 1;
  const side = sideIndex === 0 ? "лицевая сторона" : "задняя сторона";
  return `Биндер ${binderNumber}, лист ${sheet}, ${side}, ячейка ${cell}.`;
}

function openCard(cardId) {
  state.selectedCard = state.cards.find((card) => card.id === cardId) || null;
  if (!state.selectedCard) {
    return;
  }
  renderCardDialog();
  elements.cardDialog.showModal();
}

function renderCardDialog() {
  const card = state.selectedCard;
  elements.cardDialogNumber.textContent = `#${card.displayNumber}`;
  elements.cardDialogTitle.textContent = card.title;
  elements.cardSlot.textContent = getCardSlot(card);
  elements.toggleCollected.textContent = card.collected
    ? "Убрать из коллекции"
    : "Добавить в коллекцию";
  elements.toggleWishlist.textContent = card.wishlist ? "Убрать из wishlist" : "В wishlist";

  if (card.photo) {
    const image = document.createElement("img");
    image.src = card.photo;
    image.alt = `Фото ${card.title}`;
    elements.cardPhotoPreview.className = "photo-preview";
    elements.cardPhotoPreview.replaceChildren(image);
    elements.removeCardPhoto.hidden = false;
  } else {
    elements.cardPhotoPreview.className = "photo-preview empty";
    elements.cardPhotoPreview.replaceChildren();
    elements.removeCardPhoto.hidden = true;
  }

  const fieldList = document.createElement("dl");
  fieldList.className = "detail-fields";
  state.activeList.columns.forEach((column) => {
    const row = document.createElement("div");
    row.className = "detail-field";
    const label = document.createElement("dt");
    label.textContent = column.label;
    const value = document.createElement("dd");
    value.textContent = card.fields[column.key] || "—";
    row.append(label, value);
    fieldList.append(row);
  });
  elements.cardFields.replaceChildren(fieldList);
}

async function toggleSelectedCard(field) {
  if (!state.selectedCard) {
    return;
  }
  state.selectedCard = {
    ...state.selectedCard,
    [field]: !state.selectedCard[field],
    updatedAt: new Date().toISOString(),
  };
  await saveSelectedCard();
}

async function handleCardPhoto(event) {
  const file = event.target.files?.[0];
  if (!file || !state.selectedCard) {
    return;
  }

  const photo = await resizeImage(file, 1400, 0.8);
  state.selectedCard = {
    ...state.selectedCard,
    photo,
    updatedAt: new Date().toISOString(),
  };
  event.target.value = "";
  await saveSelectedCard();
}

async function removeCardPhoto() {
  if (!state.selectedCard) {
    return;
  }
  state.selectedCard = {
    ...state.selectedCard,
    photo: null,
    updatedAt: new Date().toISOString(),
  };
  await saveSelectedCard();
}

async function saveSelectedCard() {
  await FolioGridStorage.putCard(state.selectedCard);
  state.cards = state.cards.map((card) =>
    card.id === state.selectedCard.id ? state.selectedCard : card,
  );
  renderCardDialog();
  renderHeader();
  renderCollection();
  renderWishlist();
}

function resizeImage(file, maxDimension, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error("Не удалось прочитать изображение."));
      image.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext("2d").drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function copyWishlist() {
  const text = state.cards
    .filter((card) => card.wishlist)
    .map((card) => `${card.displayNumber} ${card.title}`)
    .join("\n");

  if (!text) {
    return;
  }

  try {
    await navigator.clipboard.writeText(text);
    elements.wishlistCopyStatus.textContent = "Список скопирован.";
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    document.body.append(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    elements.wishlistCopyStatus.textContent = "Список скопирован.";
  }
}

async function exportBackup() {
  elements.backupStatus.classList.remove("error");
  elements.backupStatus.textContent = "Подготавливаю резервную копию…";

  try {
    const data = await FolioGridStorage.exportAll();
    const payload = {
      format: "foliogrid-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      lists: data.lists,
      cards: data.cards,
    };
    const filename = `foliogrid-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([JSON.stringify(payload)], filename, {
      type: "application/json",
    });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "Резервная копия FolioGrid",
        files: [file],
      });
    } else {
      downloadFile(file, filename);
    }
    elements.backupStatus.textContent = "Резервная копия готова.";
  } catch (error) {
    if (error.name === "AbortError") {
      elements.backupStatus.textContent = "";
      return;
    }
    elements.backupStatus.textContent = `Не удалось создать backup: ${error.message}`;
    elements.backupStatus.classList.add("error");
  }
}

function downloadFile(file, filename) {
  const url = URL.createObjectURL(file);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function restoreBackup(event) {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) {
    return;
  }

  elements.backupStatus.classList.remove("error");
  elements.backupStatus.textContent = "Проверяю резервную копию…";

  try {
    const payload = JSON.parse(await file.text());
    validateBackup(payload);
    const photoCount = payload.cards.filter((card) => Boolean(card.photo)).length;
    const confirmed = window.confirm(
      `Заменить текущие данные? В backup: ${payload.lists.length} списков, ` +
        `${payload.cards.length} карточек и ${photoCount} фотографий.`,
    );
    if (!confirmed) {
      elements.backupStatus.textContent = "Восстановление отменено.";
      return;
    }

    await FolioGridStorage.replaceAll(payload.lists, payload.cards);
    localStorage.removeItem("foliogrid.activeListId");
    await refreshLists(payload.lists[0]?.id);
    elements.backupStatus.textContent =
      `Восстановлено: ${payload.lists.length} списков и ${payload.cards.length} карточек.`;
  } catch (error) {
    elements.backupStatus.textContent = `Не удалось восстановить backup: ${error.message}`;
    elements.backupStatus.classList.add("error");
  }
}

function validateBackup(payload) {
  if (
    payload?.format !== "foliogrid-backup" ||
    payload.version !== 1 ||
    !Array.isArray(payload.lists) ||
    !Array.isArray(payload.cards)
  ) {
    throw new Error("это не резервная копия FolioGrid");
  }

  const listIds = new Set();
  payload.lists.forEach((list) => {
    if (
      !list ||
      typeof list.id !== "string" ||
      typeof list.name !== "string" ||
      !Array.isArray(list.columns)
    ) {
      throw new Error("повреждены данные списка");
    }
    listIds.add(list.id);
  });

  payload.cards.forEach((card) => {
    if (
      !card ||
      typeof card.id !== "string" ||
      typeof card.listId !== "string" ||
      !listIds.has(card.listId) ||
      typeof card.title !== "string" ||
      typeof card.fields !== "object"
    ) {
      throw new Error("повреждены данные карточек");
    }
  });
}

function openImportWizard() {
  resetWizard();
  elements.importDialog.showModal();
}

function resetWizard() {
  state.wizard = {
    sourceType: "paste",
    sourceFileName: null,
    columns: [],
    rows: [],
    preparedRows: [],
    sortRules: [],
  };
  elements.importListName.value = "";
  elements.importPaste.value = "";
  elements.pasteColumnSeparator.value = "auto";
  elements.customColumnSeparator.value = "";
  elements.importFile.value = "";
  elements.importHasHeaders.checked = false;
  elements.importSourceStatus.textContent = "";
  document.querySelector('input[name="sourceType"][value="paste"]').checked = true;
  elements.pasteSource.hidden = false;
  elements.fileSource.hidden = true;
  updateColumnSeparatorControls();
  showWizardStep(1);
}

function handleSourceTypeChange(event) {
  state.wizard.sourceType = event.target.value;
  const isPaste = state.wizard.sourceType === "paste";
  elements.pasteSource.hidden = !isPaste;
  elements.fileSource.hidden = isPaste;
  elements.importHasHeaders.checked = !isPaste;
  elements.importFile.accept = state.wizard.sourceType === "xlsx" ? ".xlsx" : ".csv";
}

function updateColumnSeparatorControls() {
  const mode = elements.pasteColumnSeparator.value;
  elements.customColumnSeparatorWrap.hidden = mode !== "custom";
  const hints = {
    auto:
      "Каждая новая строка — карточка. Авто распознаёт CSV и таблицы из Excel/Numbers.",
    tab: "Каждая новая строка — карточка, а табуляция разделяет её столбцы.",
    comma: "Каждая новая строка — карточка, а запятая разделяет её столбцы.",
    semicolon: "Каждая новая строка — карточка, а точка с запятой разделяет её столбцы.",
    space: "Каждая новая строка — карточка, а пробелы разделяют её столбцы.",
    custom: "Каждая новая строка — карточка. Укажи символ между столбцами, например |.",
  };
  elements.columnSeparatorHint.textContent = hints[mode];
}

async function parseImportSource() {
  elements.importSourceStatus.textContent = "";
  const listName = elements.importListName.value.trim();
  if (!listName) {
    elements.importSourceStatus.textContent = "Укажи название списка.";
    return;
  }

  try {
    let matrix;
    if (state.wizard.sourceType === "paste") {
      const text = elements.importPaste.value.trim();
      if (!text) {
        throw new Error("Вставь список или таблицу.");
      }
      matrix = parsePastedText(text);
      state.wizard.sourceFileName = null;
    } else {
      const file = elements.importFile.files?.[0];
      if (!file) {
        throw new Error("Выбери файл.");
      }
      state.wizard.sourceFileName = file.name;
      if (state.wizard.sourceType === "xlsx") {
        matrix = await parseXlsx(file);
      } else {
        matrix = parseDelimitedText(await file.text());
      }
    }

    prepareParsedMatrix(matrix, elements.importHasHeaders.checked);
    if (!state.wizard.rows.length) {
      throw new Error("В источнике нет строк с карточками.");
    }
    configureImportMapping();
    showWizardStep(2);
  } catch (error) {
    elements.importSourceStatus.textContent = error.message;
  }
}

function parsePastedText(text) {
  const mode = elements.pasteColumnSeparator.value;
  if (mode === "auto") {
    return parseDelimitedText(text);
  }

  const normalized = text.replace(/\r\n?/g, "\n").trim();
  const separators = {
    tab: "\t",
    comma: ",",
    semicolon: ";",
    space: " ",
  };
  const separator =
    mode === "custom" ? elements.customColumnSeparator.value : separators[mode];

  if (!separator) {
    throw new Error("Укажи символ, который разделяет столбцы.");
  }

  const rows = parseCsv(normalized, separator);
  if (mode === "space") {
    return rows.map((row) => row.filter((value) => value !== ""));
  }
  return rows;
}

function parseDelimitedText(text) {
  const normalized = text.replace(/\r\n?/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  if (normalized.includes("\t")) {
    return normalized.split("\n").map((line) => line.split("\t").map(cleanCell));
  }

  const firstLine = normalized.split("\n")[0];
  const commaCount = (firstLine.match(/,/g) || []).length;
  const semicolonCount = (firstLine.match(/;/g) || []).length;
  const delimiter = semicolonCount > commaCount ? ";" : commaCount ? "," : null;
  if (!delimiter) {
    return normalized.split("\n").map((line) => [cleanCell(line)]);
  }
  return parseCsv(normalized, delimiter);
}

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cleanCell(value));
      value = "";
    } else if (char === "\n" && !quoted) {
      row.push(cleanCell(value));
      rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  row.push(cleanCell(value));
  rows.push(row);
  return rows;
}

async function parseXlsx(file) {
  if (!window.FolioGridReadXlsx) {
    throw new Error("Модуль XLSX не загрузился.");
  }
  const rows = await window.FolioGridReadXlsx(file);
  return rows.map((row) =>
    row.map((value) =>
      value instanceof Date ? value.toISOString().slice(0, 10) : cleanCell(value),
    ),
  );
}

function cleanCell(value) {
  return String(value ?? "").trim();
}

function prepareParsedMatrix(matrix, hasHeaders) {
  const normalized = matrix
    .map((row) => row.map(cleanCell))
    .filter((row) => row.some(Boolean));
  if (!normalized.length) {
    throw new Error("Не удалось прочитать данные.");
  }

  const width = Math.max(...normalized.map((row) => row.length));
  const headerRow = hasHeaders ? normalized.shift() : [];
  const usedKeys = new Set();
  const columns = Array.from({ length: width }, (_, index) => {
    const label = cleanCell(headerRow[index]) || `Столбец ${index + 1}`;
    let key = makeColumnKey(label, index);
    while (usedKeys.has(key)) {
      key = `${key}_${index + 1}`;
    }
    usedKeys.add(key);
    return { key, label, index };
  });

  state.wizard.columns = columns;
  state.wizard.rows = normalized.map((row, sourceIndex) => {
    const values = {};
    columns.forEach((column) => {
      values[column.key] = cleanCell(row[column.index]);
    });
    return { sourceIndex, values };
  });
}

function makeColumnKey(label, index) {
  const key = label
    .toLocaleLowerCase("ru")
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]+/gu, "_")
    .replace(/^_+|_+$/g, "");
  return key || `column_${index + 1}`;
}

function configureImportMapping() {
  fillColumnSelect(elements.titleColumn);
  fillColumnSelect(elements.numberColumn);
  const likelyTitle = state.wizard.columns.find((column) =>
    /name|title|назван|имя/i.test(column.label),
  );
  elements.titleColumn.value = likelyTitle?.key || state.wizard.columns[0].key;
  elements.orderMode.value = "source";
  elements.numberingMode.value = "sequential";
  state.wizard.sortRules = [];
  elements.sortRules.replaceChildren();
  updateOrderControls();
}

function fillColumnSelect(select) {
  select.replaceChildren(
    ...state.wizard.columns.map((column) => {
      const option = document.createElement("option");
      option.value = column.key;
      option.textContent = column.label;
      return option;
    }),
  );
}

function updateOrderControls() {
  const isCustom = elements.orderMode.value === "custom";
  elements.sortRulesFieldset.hidden = !isCustom;
  elements.numberColumnWrap.hidden = elements.numberingMode.value !== "existing";
  if (isCustom && !state.wizard.sortRules.length) {
    addSortRule();
  }
}

function addSortRule() {
  if (state.wizard.sortRules.length >= 3) {
    return;
  }
  state.wizard.sortRules.push({
    column: state.wizard.columns[0]?.key,
    direction: "asc",
  });
  renderSortRules();
}

function renderSortRules() {
  elements.sortRules.replaceChildren(
    ...state.wizard.sortRules.map((rule, index) => {
      const row = document.createElement("div");
      row.className = "sort-rule";

      const column = document.createElement("select");
      fillColumnSelect(column);
      column.value = rule.column;
      column.addEventListener("change", () => {
        state.wizard.sortRules[index].column = column.value;
      });

      const direction = document.createElement("select");
      direction.innerHTML = '<option value="asc">По возрастанию</option><option value="desc">По убыванию</option>';
      direction.value = rule.direction;
      direction.addEventListener("change", () => {
        state.wizard.sortRules[index].direction = direction.value;
      });

      const remove = document.createElement("button");
      remove.className = "icon-button";
      remove.type = "button";
      remove.textContent = "×";
      remove.setAttribute("aria-label", "Удалить правило");
      remove.addEventListener("click", () => {
        state.wizard.sortRules.splice(index, 1);
        renderSortRules();
      });

      row.append(column, direction, remove);
      return row;
    }),
  );
  elements.addSortRule.disabled = state.wizard.sortRules.length >= 3;
}

function buildImportPreview() {
  const titleColumn = elements.titleColumn.value;
  const rows = state.wizard.rows.filter((row) => row.values[titleColumn]);
  const orderMode = elements.orderMode.value;
  let prepared = [...rows];

  if (orderMode === "alphabetical") {
    prepared.sort((left, right) =>
      compareValues(left.values[titleColumn], right.values[titleColumn]),
    );
  } else if (orderMode === "custom") {
    prepared.sort((left, right) => compareRowsByRules(left, right, state.wizard.sortRules));
  }

  const numberingMode = elements.numberingMode.value;
  const numberColumn = numberingMode === "existing" ? elements.numberColumn.value : null;
  state.wizard.preparedRows = prepared.map((row, index) => ({
    ...row,
    sequence: index + 1,
    displayNumber:
      numberingMode === "existing" ? row.values[numberColumn] || String(index + 1) : String(index + 1),
    title: row.values[titleColumn],
  }));

  renderPreviewTable();
  showWizardStep(3);
}

function compareRowsByRules(left, right, rules) {
  for (const rule of rules) {
    const comparison = compareValues(left.values[rule.column], right.values[rule.column]);
    if (comparison !== 0) {
      return rule.direction === "desc" ? -comparison : comparison;
    }
  }
  return left.sourceIndex - right.sourceIndex;
}

function compareValues(left, right) {
  return String(left ?? "").localeCompare(String(right ?? ""), "ru", {
    numeric: true,
    sensitivity: "base",
  });
}

function renderPreviewTable() {
  const columns = state.wizard.columns;
  elements.previewSummary.textContent =
    `${state.wizard.preparedRows.length} карточек · «${elements.importListName.value.trim()}»`;

  const headRow = document.createElement("tr");
  ["№", ...columns.map((column) => column.label)].forEach((label) => {
    const cell = document.createElement("th");
    cell.textContent = label;
    headRow.append(cell);
  });
  elements.previewHead.replaceChildren(headRow);

  elements.previewBody.replaceChildren(
    ...state.wizard.preparedRows.slice(0, 20).map((row) => {
      const tableRow = document.createElement("tr");
      [row.displayNumber, ...columns.map((column) => row.values[column.key])].forEach((value) => {
        const cell = document.createElement("td");
        cell.textContent = value;
        tableRow.append(cell);
      });
      return tableRow;
    }),
  );
}

async function finishImport() {
  if (!state.wizard.preparedRows.length) {
    return;
  }
  elements.finishImport.disabled = true;

  try {
    const listId = crypto.randomUUID();
    const now = new Date().toISOString();
    const list = {
      id: listId,
      name: elements.importListName.value.trim(),
      createdAt: now,
      updatedAt: now,
      sourceType: state.wizard.sourceType,
      sourceFileName: state.wizard.sourceFileName,
      columns: state.wizard.columns.map(({ key, label }) => ({ key, label })),
      titleColumn: elements.titleColumn.value,
      numberingMode: elements.numberingMode.value,
      numberColumn:
        elements.numberingMode.value === "existing" ? elements.numberColumn.value : null,
      orderMode: elements.orderMode.value,
      sortRules: elements.orderMode.value === "custom" ? state.wizard.sortRules : [],
      binder: { ...DEFAULT_BINDER },
      cardCount: state.wizard.preparedRows.length,
    };
    const cards = state.wizard.preparedRows.map((row) => ({
      id: crypto.randomUUID(),
      listId,
      sequence: row.sequence,
      displayNumber: row.displayNumber,
      title: row.title,
      fields: row.values,
      collected: false,
      wishlist: false,
      photo: null,
      createdAt: now,
      updatedAt: now,
    }));

    await FolioGridStorage.createList(list, cards);
    elements.importDialog.close();
    await refreshLists(listId);
    switchTab("collectionPanel");
  } finally {
    elements.finishImport.disabled = false;
  }
}

function showWizardStep(step) {
  document.querySelectorAll(".wizard-step").forEach((section) => {
    section.classList.toggle("active", Number(section.dataset.step) === step);
  });
  document.querySelectorAll("[data-step-dot]").forEach((dot) => {
    dot.classList.toggle("active", Number(dot.dataset.stepDot) === step);
  });
}
