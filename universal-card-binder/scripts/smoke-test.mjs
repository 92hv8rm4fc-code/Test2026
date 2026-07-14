import { chromium } from "playwright-core";

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || "/usr/local/bin/google-chrome",
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

try {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto("http://127.0.0.1:5174", { waitUntil: "networkidle" });
  await page.waitForSelector("body.has-no-lists");

  await page.locator("[data-open-import]").first().click();
  await page.fill("#importListName", "Smoke Test");
  await page.fill(
    "#importPaste",
    "Name\tSet\tNumber\nBeta\tTwo\t20\nAlpha\tOne\t10\nGamma\tOne\t30",
  );
  await page.check("#importHasHeaders");
  await page.click("#parseImport");
  await page.waitForSelector('.wizard-step[data-step="2"].active');

  await page.selectOption("#orderMode", "custom");
  await page.selectOption("#numberingMode", "existing");
  await page.selectOption("#numberColumn", { label: "Number" });
  await page.locator(".sort-rule select").nth(0).selectOption({ label: "Set" });
  await page.click("#buildPreview");
  await page.waitForSelector('.wizard-step[data-step="3"].active');
  await page.click("#finishImport");

  await page.waitForSelector(".card-tile");
  const count = await page.locator(".card-tile").count();
  if (count !== 3) {
    throw new Error(`Expected 3 cards, received ${count}`);
  }

  await page.locator(".card-tile").first().click();
  await page.click("#toggleCollected");
  await page.locator("#cardDialog .icon-button").click();
  await page.waitForFunction(() => document.querySelector("#headerProgress")?.textContent === "1 / 3");

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => document.querySelector("#headerProgress")?.textContent === "1 / 3");

  await page.locator("[data-open-import]:visible").first().click();
  await page.fill("#importListName", "Custom Separator");
  await page.fill("#importPaste", "First card|Second card|Third card");
  await page.selectOption("#pasteSeparatorMode", "custom");
  await page.fill("#customSeparator", "|");
  await page.click("#parseImport");
  await page.waitForSelector('.wizard-step[data-step="2"].active');
  await page.click("#buildPreview");
  await page.waitForSelector('.wizard-step[data-step="3"].active');
  await page.click("#finishImport");
  await page.waitForFunction(
    () => document.querySelector("#collectionTitle")?.textContent === "Custom Separator",
  );
  const customCount = await page.locator(".card-tile").count();
  if (customCount !== 3) {
    throw new Error(`Expected 3 custom-separated cards, received ${customCount}`);
  }

  console.log("FolioGrid smoke test passed");
} finally {
  await browser.close();
}
