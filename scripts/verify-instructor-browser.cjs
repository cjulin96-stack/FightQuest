const { chromium } = require("playwright");

const SITE = "https://cjulin96-stack.github.io/FightQuest/";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForViewer(page, expectedText, label) {
  await page.waitForFunction(
    ({ expectedText }) => {
      const host = document.querySelector(".demo-video-modal .fq-3d-viewer");
      const status = host?.querySelector(".fq-3d-status")?.textContent || "";
      return !!host &&
        host.classList.contains("is-ready") &&
        status.includes(expectedText) &&
        !!host.querySelector(".fq-3d-viewport canvas");
    },
    { expectedText },
    { timeout: 90000 }
  );
  console.log(label + ": visualizador pronto.");
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"]
  });
  let lastError = null;

  try {
    for (let attempt = 1; attempt <= 30; attempt++) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        serviceWorkers: "block"
      });
      const page = await context.newPage();
      const glbResponses = [];
      page.on("response", response => {
        if (response.url().includes("/assets/instructor.glb")) {
          glbResponses.push({ status: response.status(), url: response.url() });
        }
      });

      try {
        const response = await page.goto(SITE, { waitUntil: "domcontentloaded", timeout: 30000 });
        if (!response || !response.ok()) throw new Error("FightQuest Pages respondeu sem sucesso.");
        await page.locator("#app").waitFor({ timeout: 15000 });
        await page.locator('.nav-item[data-page="strength"]').click();
        await page.locator('[data-demo="A-0"]').waitFor({ timeout: 15000 });
        await page.locator('[data-demo="A-0"]').click();
        await waitForViewer(page, "agachamento com joelhos", "Agachamento com rig");
        await page.locator("#closeDemo").click();

        await page.locator('[data-demo="A-1"]').click();
        await waitForViewer(page, "Instrutor 3D carregado", "Modelo GLB");
        const successfulGlb = glbResponses.find(item => item.status === 200);
        if (!successfulGlb) throw new Error("O navegador não confirmou resposta HTTP 200 para assets/instructor.glb.");
        console.log("GLB carregado por " + successfulGlb.url);
        await context.close();
        await browser.close();
        return;
      } catch (error) {
        lastError = error;
        console.log("Tentativa " + attempt + "/30 ainda não concluiu: " + (error?.message || error));
        await context.close();
        if (attempt < 30) await delay(10000);
      }
    }
    throw lastError || new Error("Não foi possível validar os visualizadores na página publicada.");
  } finally {
    await browser.close().catch(() => {});
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
