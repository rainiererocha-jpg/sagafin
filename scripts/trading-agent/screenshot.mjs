// OPCIONAL (PLAYWRIGHT=on): captura do gráfico na plataforma web da tastytrade.
// Exige conta dedicada + TOTP (TASTY_USERNAME, TASTY_PASSWORD, TASTY_TOTP_SECRET) ou
// TASTY_STORAGE_STATE (JSON base64 de storageState já autenticado). Qualquer falha é não bloqueante.
// Aviso: automação da interface web pode violar o EULA da corretora; use por sua conta e risco.
import { sbUpload } from "../lib/supabase.mjs";

export async function capturarGraficos(symbols, { hoje, slot }) {
  const urls = {};
  let chromium, authenticator;
  try {
    ({ chromium } = await import("playwright"));
    ({ authenticator } = await import("otplib"));
  } catch (e) {
    console.warn(`⚠ Playwright/otplib não instalados; screenshots pulados (${e.message}).`);
    return urls;
  }
  const browser = await chromium.launch({ headless: true });
  try {
    const stateB64 = process.env.TASTY_STORAGE_STATE;
    const ctx = await browser.newContext(stateB64 ? { storageState: JSON.parse(Buffer.from(stateB64, "base64").toString("utf8")) } : { viewport: { width: 1600, height: 1000 } });
    const page = await ctx.newPage();
    await page.goto("https://my.tastytrade.com/app.html#/trading/order/chart", { waitUntil: "domcontentloaded", timeout: 60000 });
    if (await page.locator('input[type="password"]').count()) {
      await page.fill('input[name="login"], input[type="email"], input[autocomplete="username"]', process.env.TASTY_USERNAME || "");
      await page.fill('input[type="password"]', process.env.TASTY_PASSWORD || "");
      await page.keyboard.press("Enter");
      await page.waitForTimeout(4000);
      const otp = page.locator('input[autocomplete="one-time-code"], input[name*="code" i]');
      if (await otp.count()) {
        await otp.first().fill(authenticator.generate(process.env.TASTY_TOTP_SECRET || ""));
        await page.keyboard.press("Enter");
        await page.waitForTimeout(5000);
      }
    }
    for (const sym of symbols) {
      try {
        const busca = page.locator('input[placeholder*="symbol" i]').first();
        await busca.click();
        await busca.fill(sym);
        await page.keyboard.press("Enter");
        await page.waitForTimeout(6000);
        const png = await page.screenshot({ fullPage: false });
        urls[sym] = await sbUpload("trading-charts", `${hoje}/${slot}/${sym.replace(/[^A-Za-z0-9]/g, "_")}.png`, png);
        console.log(`✓ screenshot ${sym}`);
      } catch (e) {
        console.warn(`⚠ screenshot ${sym}: ${e.message}`);
      }
    }
  } catch (e) {
    console.warn(`⚠ Playwright: ${e.message}`);
  } finally {
    await browser.close();
  }
  return urls;
}
