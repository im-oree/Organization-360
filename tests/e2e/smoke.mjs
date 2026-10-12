/**
 * Browser smoke test: what a person actually sees. Run with the dev servers up:
 *   pnpm test:e2e
 * Uses the installed Google Chrome (override with CHROME_PATH).
 */
import { chromium } from "playwright-core";

const base = process.env.BASE_URL ?? "http://localhost:5173";
const email = process.env.OWNER_EMAIL ?? "owner@example.com";
const password = process.env.OWNER_PASSWORD ?? "ChangeMe123";
const chrome = process.env.CHROME_PATH ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const browser = await chromium.launch({ executablePath: chrome });
const failures = [];
const shows = (loc) => loc.first().waitFor({ state: "visible", timeout: 5000 }).then(() => true, () => false);
const check = (ok, what) => (ok ? console.log(`  ✓ ${what}`) : (failures.push(what), console.log(`  ✗ ${what}`)));

async function page() {
  const p = await browser.newPage();
  p.on("pageerror", (e) => failures.push(`page error: ${e.message}`));
  await p.goto(base);
  await p.waitForSelector("input[name=email]");
  return p;
}
async function signIn(p, pw) {
  await p.fill("input[name=email]", email);
  await p.fill("input[name=password]", pw);
  await p.click("button[type=submit]");
}

console.log("Sign-in page");
let p = await page();
check((await p.$eval("main img, main [aria-label]", (el) => el.tagName !== "IMG" || el.naturalWidth > 0)), "logo shows (or falls back)");
await p.getByRole("button", { name: "Show password" }).click();
check((await p.getAttribute("input[name=password]", "type")) === "text", "password can be revealed");
await signIn(p, "definitely-wrong");
check(await shows(p.getByRole("alert").filter({ hasText: "don't match" })), "wrong password shows a plain-English error");

console.log("Signed in");
await signIn(p, password);
check(await shows(p.getByText(/Good (morning|afternoon|evening)/)), "correct password opens Home");
await p.getByRole("link", { name: "StaffDesk" }).first().click();
check(await shows(p.getByRole("heading", { name: "StaffDesk" })), "StaffDesk opens");

await browser.close();
if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nAll good.");
