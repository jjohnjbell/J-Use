// Backend/generate-pdf.js
// Shared between both API and .gs methods
// Generates a PDF of the submitted application using Puppeteer + Chromium
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';

export async function generatePDF(applicationData) {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // PDF_RENDERER_URL must be set in Netlify environment variables
    const rendererUrl = process.env.PDF_RENDERER_URL;

    if (!rendererUrl) {
      throw new Error('PDF_RENDERER_URL environment variable is not set. Add it in Netlify Site Settings > Environment Variables.');
    }

    await page.goto(rendererUrl, { waitUntil: 'networkidle0', timeout: 30000 });

    await page.evaluate((data) => {
      if (typeof window.renderFullApplicationPDF === 'function') {
        window.renderFullApplicationPDF(data);
      } else {
        throw new Error('renderFullApplicationPDF function not found on the renderer page');
      }
    }, applicationData);

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '15px', right: '15px', bottom: '15px', left: '15px' }
    });

    console.log(`[JUSE] PDF generated: ${pdfBuffer.length} bytes`);
    return pdfBuffer;

  } catch (error) {
    console.error('[JUSE] PDF generation error:', error);
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}
