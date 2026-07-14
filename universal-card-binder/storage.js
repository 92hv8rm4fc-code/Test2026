(function exposeFolioGridStorage() {
  const DB_NAME = "foliogrid-db";
  const DB_VERSION = 1;
  const LISTS_STORE = "lists";
  const CARDS_STORE = "cards";

  let databasePromise;

  function requestAsPromise(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function transactionAsPromise(transaction) {
    return new Promise((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error("Transaction aborted"));
    });
  }

  function openDatabase() {
    if (databasePromise) {
      return databasePromise;
    }

    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;

        if (!database.objectStoreNames.contains(LISTS_STORE)) {
          database.createObjectStore(LISTS_STORE, { keyPath: "id" });
        }

        if (!database.objectStoreNames.contains(CARDS_STORE)) {
          const cards = database.createObjectStore(CARDS_STORE, { keyPath: "id" });
          cards.createIndex("listId", "listId", { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return databasePromise;
  }

  async function getLists() {
    const database = await openDatabase();
    const transaction = database.transaction(LISTS_STORE, "readonly");
    const lists = await requestAsPromise(transaction.objectStore(LISTS_STORE).getAll());
    return lists.sort((left, right) => left.createdAt.localeCompare(right.createdAt));
  }

  async function getList(listId) {
    const database = await openDatabase();
    const transaction = database.transaction(LISTS_STORE, "readonly");
    return requestAsPromise(transaction.objectStore(LISTS_STORE).get(listId));
  }

  async function getCards(listId) {
    const database = await openDatabase();
    const transaction = database.transaction(CARDS_STORE, "readonly");
    const cards = await requestAsPromise(
      transaction.objectStore(CARDS_STORE).index("listId").getAll(listId),
    );
    return cards.sort((left, right) => left.sequence - right.sequence);
  }

  async function createList(list, cards) {
    const database = await openDatabase();
    const transaction = database.transaction([LISTS_STORE, CARDS_STORE], "readwrite");
    transaction.objectStore(LISTS_STORE).put(list);
    const cardStore = transaction.objectStore(CARDS_STORE);
    cards.forEach((card) => cardStore.put(card));
    await transactionAsPromise(transaction);
  }

  async function putList(list) {
    const database = await openDatabase();
    const transaction = database.transaction(LISTS_STORE, "readwrite");
    transaction.objectStore(LISTS_STORE).put(list);
    await transactionAsPromise(transaction);
  }

  async function putCard(card) {
    const database = await openDatabase();
    const transaction = database.transaction(CARDS_STORE, "readwrite");
    transaction.objectStore(CARDS_STORE).put(card);
    await transactionAsPromise(transaction);
  }

  async function deleteList(listId) {
    const database = await openDatabase();
    const transaction = database.transaction([LISTS_STORE, CARDS_STORE], "readwrite");
    transaction.objectStore(LISTS_STORE).delete(listId);

    const index = transaction.objectStore(CARDS_STORE).index("listId");
    const request = index.openKeyCursor(IDBKeyRange.only(listId));
    request.onsuccess = () => {
      const cursor = request.result;
      if (!cursor) {
        return;
      }
      transaction.objectStore(CARDS_STORE).delete(cursor.primaryKey);
      cursor.continue();
    };

    await transactionAsPromise(transaction);
  }

  async function exportAll() {
    const database = await openDatabase();
    const transaction = database.transaction([LISTS_STORE, CARDS_STORE], "readonly");
    const listsRequest = transaction.objectStore(LISTS_STORE).getAll();
    const cardsRequest = transaction.objectStore(CARDS_STORE).getAll();
    const [lists, cards] = await Promise.all([
      requestAsPromise(listsRequest),
      requestAsPromise(cardsRequest),
    ]);
    return { lists, cards };
  }

  async function replaceAll(lists, cards) {
    const database = await openDatabase();
    const transaction = database.transaction([LISTS_STORE, CARDS_STORE], "readwrite");
    const listStore = transaction.objectStore(LISTS_STORE);
    const cardStore = transaction.objectStore(CARDS_STORE);
    listStore.clear();
    cardStore.clear();
    lists.forEach((list) => listStore.put(list));
    cards.forEach((card) => cardStore.put(card));
    await transactionAsPromise(transaction);
  }

  window.FolioGridStorage = {
    getLists,
    getList,
    getCards,
    createList,
    putList,
    putCard,
    deleteList,
    exportAll,
    replaceAll,
  };
})();
