/**
 * One-off: load app in headless Chromium and print console errors / #root content.
 * Run with dev server up: npm run dev
 */
import { chromium } from "playwright";

const url = process.argv[2] || "http://127.0.0.1:8080";

const logs = [];
const errors = [];

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();

page.on("console", (msg) => {
  const line = `[${msg.type()}] ${msg.text()}`;
  logs.push(line);
  if (msg.type() === "error") errors.push(line);
});

page.on("pageerror", (err) => {
  const line = `[pageerror] ${err.message}\n${err.stack || ""}`;
  errors.push(line);
});

try {
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
} catch (e) {
  errors.push(`[navigation] ${e.message}`);
}

const rootHtml = await page.$eval("#root", (el) => el.innerHTML).catch(() => "(no #root or empty)");
const bodyText = await page.evaluate(() => document.body?.innerText?.slice(0, 200) ?? "");

await browser.close();

console.log("=== URL ===");
console.log(url);
console.log("\n=== #root innerHTML (first 800 chars) ===");
console.log(rootHtml.length > 800 ? rootHtml.slice(0, 800) + "..." : rootHtml);
console.log("\n=== body innerText (first 200 chars) ===");
console.log(bodyText);
console.log("\n=== Console (all) ===");
logs.forEach((l) => console.log(l));
console.log("\n=== Errors only ===");
if (errors.length === 0) console.log("(none)");
else errors.forEach((e) => console.log(e));

process.exit(errors.length > 0 ? 1 : 0);
