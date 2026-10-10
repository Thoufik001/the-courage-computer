import { chromium } from "@playwright/test";
const browser = await chromium.launch({
  headless: true,
  args: ["--use-angle=swiftshader", "--enable-webgl"],
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:3000");
await page.waitForLoadState("networkidle");
await page.screenshot({
  path: `../../work/${process.env.PHASE || "phase-1"}.png`,
});
console.log(
  JSON.stringify({
    errors,
    buttons: await page.getByRole("button").allTextContents(),
  }),
);
await browser.close();
