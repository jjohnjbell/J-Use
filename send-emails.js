// Backend/send-emails.js
// Uses Resend for email delivery
// Applicant confirmation + Grants team notification

import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendApplicantEmail(data, pdfUrl) {
  try {
    await resend.emails.send({
      from: 'J-USE <applications@efj.org.jm>',
      to: [data.email || data.contact_email],
      subject: `J-USE REOI 2026 — Application Received: ${data.ref_number}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1B6B3A;">Thank you for your submission!</h2>
          <p>Dear ${data.contactName || data.contact_name || 'Applicant'},</p>
          <p>Your Expression of Interest has been successfully received.</p>
          <p><strong>Reference Number:</strong> ${data.ref_number}</p>
          <p><strong>Submitted:</strong> ${data.submission_date}</p>
          <p><a href="${pdfUrl}" style="color:#1B6B3A;">Download your Full Application PDF</a></p>
          <p>We will review your application and contact you within 10 business days.</p>
          <p>Best regards,<br><strong>J-USE Team</strong><br>Environmental Foundation of Jamaica</p>
        </div>
      `,
    });

    console.log(`[JUSE] Applicant email sent to ${data.email || data.contact_email}`);
  } catch (err) {
    console.error('[JUSE] Applicant email failed:', err);
    throw err;
  }
}

export async function sendGrantsEmail(data, pdfUrl) {
  try {
    await resend.emails.send({
      from: 'J-USE System <applications@efj.org.jm>',
      to: ['grants@efj.org.jm'],
      bcc: [
        'jjackson@efj.org.jm',
        'rmcknight@efj.org.jm',
        'arichards@efj.org.jm',
        'info@edgecatalystfinance.com'
      ],
      subject: `New J-USE Submission — ${data.ref_number}`,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>New J-USE Application Received</h2>
          <p><strong>Reference:</strong> ${data.ref_number}</p>
          <p><strong>Organisation:</strong> ${data.org_name || 'N/A'}</p>
          <p><strong>Project:</strong> ${data.project_title || 'N/A'}</p>
          <p><strong>Applicant:</strong> ${data.contactName || data.contact_name || 'N/A'} (${data.email || data.contact_email})</p>
          <p><a href="${pdfUrl}">View Full Application PDF</a></p>
          <p>Please review at your earliest convenience.</p>
          <p>Best regards,<br>J-USE System</p>
        </div>
      `,
    });

    console.log(`[JUSE] Grants team email sent for ${data.ref_number}`);
  } catch (err) {
    console.error('[JUSE] Grants email failed:', err);
    throw err;
  }
}
