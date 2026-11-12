const { chromium } = require("playwright");

const SITE = "https://cjulin96-stack.github.io/FightQuest/";
const MAX_ATTEMPTS = 8;
const VIEWER_TIMEOUT = 30000;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForViewer(page, expectedText, label, diagnostics) {
  try {
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
      { timeout: VIEWER_TIMEOUT }
    );
  } catch (error) {
    const state = await page.evaluate(() => {
      const host = document.querySelector(".demo-video-modal .fq-3d-viewer");
      return {
        exists: !!host,
        classes: host?.className || "(sem visualizador)",
        status: host?.querySelector(".fq-3d-status")?.textContent || "(sem status)"
      };
    }).catch(() => ({ exists: false, classes: "(DOM indisponível)", status: "(sem status)" }));
    const details = [
      "estado=" + state.classes,
      "status=" + state.status,
      diagnostics.pageErrors.length ? "pageerror=" + diagnostics.pageErrors.slice(-3).join(" | ") : "",
      diagnostics.relevantConsole.length ? "console=" + diagnostics.relevantConsole.slice(-3).join(" | ") : "",
      diagnostics.assetFailures.length ? "recursos=" + diagnostics.assetFailures.slice(-4).join(" | ") : ""
    ].filter(Boolean).join("; ");
    throw new Error(label + " não carregou em " + (VIEWER_TIMEOUT / 1000) + "s. " + details);
  }
  console.log(label + ": visualizador pronto.");
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-webgl", "--ignore-gpu-blocklist"]
  });
  let lastError = null;

  try {
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        serviceWorkers: "block"
      });
      const page = await context.newPage();
      const glbResponses = [];
      const diagnostics = { pageErrors: [], relevantConsole: [], assetFailures: [] };

      page.on("pageerror", error => diagnostics.pageErrors.push(error.message));
      page.on("console", message => {
        if (message.type() === "error" && /three|module|import|webgl|glb|gltf/i.test(message.text())) {
          diagnostics.relevantConsole.push(message.text());
        }
      });
      page.on("response", response => {
        const url = response.url();
        if (url.includes("/assets/instructor.glb")) {
          glbResponses.push({ status: response.status(), url });
        }
        if (response.status() >= 400 && /jsdelivr|instructor\.glb|Regular_Male_FullBody|\.bin(?:\?|$)|\.png(?:\?|$)/i.test(url)) {
          diagnostics.assetFailures.push(response.status() + " " + url);
        }
      });
      page.on("requestfailed", request => {
        const url = request.url();
        if (/jsdelivr|instructor\.glb|Regular_Male_FullBody|\.bin(?:\?|$)|\.png(?:\?|$)/i.test(url)) {
          diagnostics.assetFailures.push("falha de rede " + url + " (" + (request.failure()?.errorText || "sem detalhe") + ")");
        }
      });

      try {
        const response = await page.goto(SITE, { waitUntil: "domcontentloaded", timeout: 30000 });
        if (!response || !response.ok()) throw new Error("FightQuest Pages respondeu sem sucesso.");
        await page.locator("#app").waitFor({ timeout: 15000 });
        await page.locator('.nav-item[data-page="strength"]').click();
        await page.locator('[data-demo="A-0"]').waitFor({ timeout: 15000 });
        await page.locator('[data-demo="A-0"]').click();
        await waitForViewer(page, "agachamento com joelhos", "Agachamento com rig", diagnostics);
        await page.locator("#closeDemo").click();

        await page.locator('[data-demo="A-1"]').click();
        await waitForViewer(page, "Instrutor 3D carregado", "Modelo GLB", diagnostics);
        const successfulGlb = glbResponses.find(item => item.status === 200);
        if (!successfulGlb) throw new Error("O navegador não confirmou resposta HTTP 200 para assets/instructor.glb.");
        console.log("GLB carregado por " + successfulGlb.url);
        await context.close();
        return;
      } catch (error) {
        lastError = error;
        console.log("Tentativa " + attempt + "/" + MAX_ATTEMPTS + " não concluiu: " + (error?.message || error));
        await context.close().catch(() => {});
        if (attempt < MAX_ATTEMPTS) await delay(10000);
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
