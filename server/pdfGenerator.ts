/**
 * Server-side PDF Generator using Puppeteer
 * Generates professional PDF documents with proper Arabic text rendering
 * Uses headless Chrome for pixel-perfect RTL support
 */
import puppeteer, { type Browser } from "puppeteer";

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--font-render-hinting=none",
    ],
  });
  return browserInstance;
}

/**
 * Convert HTML content to PDF buffer using Puppeteer
 * Properly renders Arabic text, RTL layout, and embedded images
 */
export async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    // Set viewport for consistent rendering
    await page.setViewport({ width: 820, height: 1160 });

    // Set content and wait for fonts + images to load
    await page.setContent(htmlContent, {
      waitUntil: ["networkidle0", "domcontentloaded"],
      timeout: 30000,
    });

    // Brief wait for local system fonts to render (no CDN needed)
    await new Promise((r) => setTimeout(r, 800));

    // Generate PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0mm", right: "0mm", bottom: "0mm", left: "0mm" },
      preferCSSPageSize: false,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    await page.close();
  }
}

/**
 * Cleanup browser instance on process exit
 */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// Cleanup on process exit
process.on("exit", () => {
  if (browserInstance) {
    browserInstance.close().catch(() => {});
  }
});
