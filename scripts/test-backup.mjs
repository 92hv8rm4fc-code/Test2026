import assert from "node:assert/strict";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { chromium } from "playwright-core";

const root = path.resolve(new URL("..", import.meta.url).pathname);
const server = http.createServer(async (request, response) => {
  const requestPath = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
  const relativePath = requestPath === "/" ? "index.html" : requestPath.slice(1);
  const filePath = path.resolve(root, relativePath);

  if (!filePath.startsWith(root)) {
    response.writeHead(403).end();
    return;
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      throw new Error("Not a file");
    }
    response.writeHead(200, {
      "Content-Type": filePath.endsWith(".js")
        ? "text/javascript"
        : filePath.endsWith(".css")
          ? "text/css"
          : filePath.endsWith(".json")
            ? "application/json"
            : "text/html",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end("Not found");
  }
});

await new Promise((resolve) => server.listen(5176, "127.0.0.1", resolve));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.addInitScript(() => {
    const collection = Array.from({ length: 18 }, (_, index) => ({
      key: String(index + 1),
      pokemon: {
        id: index + 1,
        name: `pokemon-${index + 1}`,
        height: 1,
        weight: 1,
        baseExperience: 1,
        sprite: `./data/sprites/${index + 1}.png`,
        types: ["normal"],
        abilities: [],
        stats: [],
      },
      addedAt: new Date().toISOString(),
    }));
    const wishlist = [{ ...collection[0], key: "wishlist-1" }];
    localStorage.setItem("pokemonBinder.collection", JSON.stringify(collection));
    localStorage.setItem("pokemonBinder.wishlist", JSON.stringify(wishlist));
  });

  await page.goto("http://127.0.0.1:5176", { waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.querySelector("#collectionCount")?.textContent === "18",
  );

  const downloadPromise = page.waitForEvent("download");
  await page.click("#exportPokedexBackup");
  const download = await downloadPromise;
  const backupPath = await download.path();
  assert.ok(backupPath, "Backup file must be downloadable");

  await page.evaluate(() => {
    const reduced = JSON.parse(localStorage.getItem("pokemonBinder.collection")).slice(0, 5);
    localStorage.setItem("pokemonBinder.collection", JSON.stringify(reduced));
    localStorage.setItem("pokemonBinder.wishlist", "[]");
  });
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.querySelector("#collectionCount")?.textContent === "5",
  );

  await page.evaluate(() => {
    window.PB_IS_MOBILE_APP = true;
  });
  page.once("dialog", (dialog) => dialog.accept());
  await page.setInputFiles("#restorePokedexBackup", backupPath);
  await page.waitForFunction(
    () =>
      document.querySelector("#collectionCount")?.textContent === "18" &&
      document.querySelector("#wishlistSummary")?.textContent.includes("1"),
  );

  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForFunction(
    () => document.querySelector("#collectionCount")?.textContent === "18",
  );
  console.log("Pokedex backup round-trip test passed");
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
