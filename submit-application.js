// Backend/submit-application.js
// METHOD: .gs — uses Google Apps Script web app (replaces sheets.js)
// Main Netlify Function — orchestrates the entire J-USE submission flow
//
// DEPLOY: Place in netlify/functions/ alongside generate-pdf.js and send-emails.js
// DO NOT include sheets.js — the Google Sheets logic is handled by the .gs web app

import { generatePDF } from './generate-pdf.js';
import { sendApplicantEmail, sendGrantsEmail } from './send-emails.js';
import PocketBase from 'pocketbase';

const pb = new PocketBase(process.env.POCKETBASE_URL);

/**
 * Send submission data to Google Apps Script web app
 * This replaces the Node.js sheets.js approach entirely
 */
async function appendToGoogleSheetsGS(data, pdfUrl) {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!scriptUrl) {
    console.warn('[JUSE] GOOGLE_APPS_SCRIPT_URL not set — skipping Google Sheets logging');
    return false;
  }

  try {
    const payload = {
      ...data,
      full_application_pdf_url: pdfUrl,
    };

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.status === 'success') {
      console.log(`[JUSE] .gs: ${result.columns_written || '?'} columns written to applications_master for ${data.ref_number}`);
      return true;
    } else {
      throw new Error(result.message || 'Unknown .gs error');
    }
  } catch (err) {
    console.error('[JUSE] .gs fetch error:', err);
    throw err;
  }
}


export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    let data = JSON.parse(event.body);

    // Generate canonical ref_number
    const timestamp = Date.now();
    const refNumber = `JUSE-2026-${timestamp.toString().slice(-6)}`;

    data.ref_number = refNumber;
    data.submission_date = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    data.submission_timestamp = new Date().toISOString();

    console.log(`[JUSE] Starting submission flow for ref: ${refNumber}`);

    // 1. Save to PocketBase
    let record = await pb.collection('applications').create(data);

    // 2. Generate PDF
    const pdfBuffer = await generatePDF(data);

    // 3. Upload PDF to PocketBase storage
    const formData = new FormData();
    formData.append('file', new Blob([pdfBuffer], { type: 'application/pdf' }), `${refNumber}.pdf`);
    const fileRecord = await pb.collection('application_pdfs').create(formData);
    const pdfUrl = `${process.env.POCKETBASE_URL}/api/files/application_pdfs/${fileRecord.id}/${refNumber}.pdf`;

    // 4. Update record with PDF URL
    await pb.collection('applications').update(record.id, { full_application_pdf_url: pdfUrl });

    // 5. Append to Google Sheets via Apps Script web app
    await appendToGoogleSheetsGS(data, pdfUrl);

    // 6. Send Emails
    await sendApplicantEmail(data, pdfUrl);
    await sendGrantsEmail(data, pdfUrl);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        ref_number: refNumber,
        record_id: record.id,
        pdf_url: pdfUrl,
        message: 'Application submitted and processed successfully'
      })
    };

  } catch (error) {
    console.error('[JUSE] Critical error in submission flow:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};
