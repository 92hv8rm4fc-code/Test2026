import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

class FakeStorage {
  getItem(key) {
    return Object.prototype.hasOwnProperty.call(this, key) ? this[key] : null;
  }

  setItem(key, value) {
    this[key] = String(value);
  }

  removeItem(key) {
    delete this[key];
  }

  clear() {
    Object.keys(this).forEach((key) => delete this[key]);
  }
}

const preferenceValues = new Map();
let setCall = 0;
const Preferences = {
  async keys() {
    return { keys: [...preferenceValues.keys()] };
  },
  async get({ key }) {
    return { value: preferenceValues.get(key) ?? null };
  },
  async set({ key, value }) {
    setCall += 1;
    const delay = setCall % 2 ? 8 : 1;
    await new Promise((resolve) => setTimeout(resolve, delay));
    preferenceValues.set(key, value);
  },
  async remove({ key }) {
    preferenceValues.delete(key);
  },
};

const plugins = {
  Preferences,
  App: { addListener() {} },
  Filesystem: {},
  Share: {},
};
const localStorage = new FakeStorage();
const document = {
  documentElement: { classList: { add() {} } },
  addEventListener() {},
};
const window = {
  Capacitor: {
    Plugins: plugins,
    isNativePlatform: () => true,
    registerPlugin: (name) => plugins[name],
  },
  location: { protocol: "capacitor:", origin: "capacitor://localhost" },
  fetch: async () => new Response("{}", { status: 200 }),
};

const context = vm.createContext({
  window,
  document,
  localStorage,
  console,
  Response,
  URL,
  setTimeout,
  clearTimeout,
});
const source = await readFile(new URL("../mobile-api.js", import.meta.url), "utf8");
vm.runInContext(source, context);
await window.PB_storageReady;

const collectionKey = "pokemonBinder.collection";
const pendingWrites = [];
for (let count = 1; count <= 18; count += 1) {
  const collection = Array.from({ length: count }, (_, index) => ({
    pokemon: { id: index + 1 },
  }));
  localStorage.setItem(collectionKey, JSON.stringify(collection));
  pendingWrites.push(window.PB_persistNow());
}
await Promise.all(pendingWrites);

assert.equal(
  JSON.parse(preferenceValues.get(collectionKey)).length,
  18,
  "Latest collection must win over all older asynchronous writes",
);

const wishlistKey = "pokemonBinder.wishlist";
localStorage.setItem(wishlistKey, JSON.stringify([{ pokemon: { id: 25 } }]));
await window.PB_persistNow();
localStorage.setItem(wishlistKey, "[]");
await window.PB_persistNow();

assert.deepEqual(
  JSON.parse(preferenceValues.get(wishlistKey)),
  [],
  "Deleted wishlist must remain deleted",
);

console.log("Mobile persistence race test passed");
