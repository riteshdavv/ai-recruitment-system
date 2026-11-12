import nodemailer from "nodemailer";

/**
 * Creates and returns a configured Nodemailer transporter.
 * Falls back to an Ethereal test account if SMTP credentials are not configured in .env.
 */
export async function getEmailTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If real SMTP credentials exist in environment variables
  if (host && user && pass) {
    return {
      transporter: nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for 465, false for 587
        auth: { user, pass },
      }),
      isTest: false,
      fromEmail: process.env.SMTP_FROM || `RecruitAI <${user}>`,
    };
  }

  // Graceful fallback: create an ephemeral Ethereal test account for dev/preview
  try {
    const testAccount = await nodemailer.createTestAccount();
    const transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });

    return {
      transporter,
      isTest: true,
      fromEmail: `"RecruitAI Interviews (Demo)" <${testAccount.user}>`,
    };
  } catch (err) {
    console.warn("Could not create test email account, using mock transporter:", err.message);
    return {
      transporter: null,
      isTest: true,
      fromEmail: "RecruitAI <noreply@recruitai.com>",
    };
  }
}

/**
 * Generates an executive, responsive HTML template for Candidate AI Interview Invites.
 */
export function generateInterviewEmailHtml({
  candidateName,
  jobPosition,
  jobDescription,
  duration,
  interviewUrl,
  customMessage,
  companyName = "RecruitAI Partner Team",
}) {
  const greeting = candidateName ? `Hi ${candidateName},` : "Hello,";
  const descPreview = jobDescription
    ? jobDescription.length > 220
      ? `${jobDescription.slice(0, 220)}...`
      : jobDescription
    : null;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Interview Invitation: ${jobPosition}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f6f8f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e2621;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 580px;
      margin: 36px auto;
      background: #ffffff;
      border: 1px solid #e1e7e2;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(18, 38, 24, 0.04);
    }
    .header {
      background: linear-gradient(135deg, #1c3829 0%, #29513b 100%);
      padding: 32px 36px;
      color: #ffffff;
    }
    .header-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.16);
      color: #e4efe7;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 12px;
    }
    .header-title {
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      line-height: 1.3;
      color: #ffffff;
    }
    .content {
      padding: 32px 36px;
    }
    .greeting {
      font-size: 16px;
      font-weight: 600;
      color: #1e2621;
      margin-bottom: 14px;
    }
    .lead-text {
      font-size: 14px;
      line-height: 1.6;
      color: #435349;
      margin-bottom: 24px;
    }
    .custom-box {
      background: #fbfcfb;
      border-left: 3px solid #29513b;
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      font-style: italic;
      color: #29382e;
      margin-bottom: 24px;
    }
    .meta-box-table {
      width: 100%;
      background-color: #f6f8f6;
      border: 1px solid #e6ece7;
      border-radius: 8px;
      margin-bottom: 28px;
      border-collapse: separate;
    }
    .meta-item-row {
      border-bottom: 1px dashed #d8e2da;
    }
    .meta-cell-label {
      padding: 11px 0;
      font-size: 13px;
      color: #63776b;
      font-weight: 500;
      text-align: left;
      white-space: nowrap;
    }
    .meta-cell-value {
      padding: 11px 0 11px 24px;
      font-size: 13px;
      color: #1e2621;
      font-weight: 700;
      text-align: right;
    }
    .cta-container {
      text-align: center;
      margin: 32px 0 24px;
    }
    .cta-button {
      display: inline-block;
      background-color: #244935;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 14px 32px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(36, 73, 53, 0.25);
    }
    .checklist {
      background: #ffffff;
      border: 1px solid #e6ece7;
      border-radius: 8px;
      padding: 16px 20px;
      margin-top: 24px;
      font-size: 12px;
      color: #435349;
      line-height: 1.6;
    }
    .checklist-title {
      font-weight: 700;
      color: #1e2621;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .checklist-item {
      margin-bottom: 4px;
      padding-left: 14px;
      position: relative;
    }
    .checklist-item::before {
      content: "•";
      position: absolute;
      left: 0;
      color: #29513b;
      font-weight: bold;
    }
    .link-fallback {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid #eef2ef;
      font-size: 11px;
      color: #7b8e82;
      word-break: break-all;
    }
    .footer {
      background-color: #f1f4f1;
      padding: 20px 36px;
      text-align: center;
      font-size: 11px;
      color: #7b8e82;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="header-badge">AI Voice Interview Invitation</div>
      <h1 class="header-title">${jobPosition}</h1>
    </div>

    <!-- Main Content -->
    <div class="content">
      <div class="greeting">${greeting}</div>
      <p class="lead-text">
        You have been invited by <strong>${companyName}</strong> to participate in an interactive, voice-enabled AI technical interview for the <strong>${jobPosition}</strong> role.
      </p>

      ${customMessage ? `<div class="custom-box">"${customMessage}"</div>` : ""}

      <!-- Interview Details Box -->
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="meta-box-table" style="background-color: #f6f8f6; border: 1px solid #e6ece7; border-radius: 8px; margin-bottom: 28px; border-collapse: separate;">
        <tr>
          <td style="padding: 16px 20px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
              <tr class="meta-item-row" style="border-bottom: 1px dashed #d8e2da;">
                <td class="meta-cell-label" style="padding: 11px 0; font-size: 13px; color: #63776b; font-weight: 500; text-align: left; vertical-align: middle; white-space: nowrap;">
                  Position
                </td>
                <td class="meta-cell-value" style="padding: 11px 0 11px 24px; font-size: 13px; color: #1e2621; font-weight: 700; text-align: right; vertical-align: middle;">
                  ${jobPosition}
                </td>
              </tr>
              <tr class="meta-item-row" style="border-bottom: 1px dashed #d8e2da;">
                <td class="meta-cell-label" style="padding: 11px 0; font-size: 13px; color: #63776b; font-weight: 500; text-align: left; vertical-align: middle; white-space: nowrap;">
                  Estimated Duration
                </td>
                <td class="meta-cell-value" style="padding: 11px 0 11px 24px; font-size: 13px; color: #1e2621; font-weight: 700; text-align: right; vertical-align: middle;">
                  ${duration || "15 Minutes"}
                </td>
              </tr>
              <tr class="meta-item-row" ${descPreview ? 'style="border-bottom: 1px dashed #d8e2da;"' : ''}>
                <td class="meta-cell-label" style="padding: 11px 0; font-size: 13px; color: #63776b; font-weight: 500; text-align: left; vertical-align: middle; white-space: nowrap;">
                  Format
                </td>
                <td class="meta-cell-value" style="padding: 11px 0 11px 24px; font-size: 13px; color: #1e2621; font-weight: 700; text-align: right; vertical-align: middle;">
                  Live Voice AI Screening (WebRTC)
                </td>
              </tr>
              ${descPreview ? `
              <tr>
                <td colspan="2" style="padding: 14px 0 4px 0; font-size: 12px; color: #576d60; line-height: 1.5; text-align: left;">
                  <strong style="color: #29382e;">Role Overview:</strong> ${descPreview}
                </td>
              </tr>` : ""}
            </table>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <div class="cta-container">
        <a href="${interviewUrl}" class="cta-button" target="_blank" rel="noopener noreferrer">
          Start AI Voice Interview &rarr;
        </a>
      </div>

      <!-- Preparation Checklist -->
      <div class="checklist">
        <div class="checklist-title">Quick Candidate Checklist:</div>
        <div class="checklist-item">Use a computer or laptop in a quiet, well-lit room.</div>
        <div class="checklist-item">Ensure your microphone and speakers/headphones are plugged in and tested.</div>
        <div class="checklist-item">Use a modern browser (Google Chrome, Microsoft Edge, or Safari).</div>
        <div class="checklist-item">You can answer questions naturally in conversational speech; our AI interviewer adapts in real time.</div>
      </div>

      <!-- Raw link fallback -->
      <div class="link-fallback">
        Button not working? Copy and paste this direct session link into your browser:<br>
        <a href="${interviewUrl}" style="color: #29513b;">${interviewUrl}</a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      This invitation was generated automatically by RecruitAI on behalf of ${companyName}.<br>
      Please do not forward this private interview link to others.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatches an automated email to a candidate.
 */
export async function sendInterviewInviteEmail({
  candidateEmail,
  candidateName,
  jobPosition,
  jobDescription,
  duration,
  interviewUrl,
  customMessage,
  companyName,
}) {
  const { transporter, isTest, fromEmail } = await getEmailTransporter();

  const html = generateInterviewEmailHtml({
    candidateName,
    jobPosition,
    jobDescription,
    duration,
    interviewUrl,
    customMessage,
    companyName,
  });

  const subject = `Invitation: AI Voice Interview for ${jobPosition}`;

  // If no transporter could be created, return simulated success in dev
  if (!transporter) {
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      previewUrl: null,
      isTest: true,
    };
  }

  const info = await transporter.sendMail({
    from: fromEmail,
    to: candidateEmail,
    subject,
    text: `Hello ${candidateName || "Candidate"},\n\nYou have been invited to participate in an AI Voice Interview for the ${jobPosition} position.\n\nAccess your interview here:\n${interviewUrl}\n\nDuration: ${duration || "15 Minutes"}\n\nBest regards,\nRecruitAI`,
    html,
  });

  const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;
  if (previewUrl) {
    console.log(`[Email Preview] Sent test email to ${candidateEmail}: ${previewUrl}`);
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
    isTest,
  };
}

/**
 * Formats multi-line plain text with bullet points into email-safe HTML paragraphs and lists.
 */
function formatMessageToHtml(rawText) {
  if (!rawText) return "";
  const escape = (str) =>
    str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const lines = rawText.split("\n");
  let html = "";
  let inList = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      continue;
    }

    if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
      if (!inList) {
        html += '<ul style="margin: 12px 0 16px 0; padding-left: 20px; color: #29382e;">';
        inList = true;
      }
      const itemText = escape(trimmed.replace(/^[•\-\*]\s*/, ""));
      html += `<li style="margin-bottom: 6px; font-size: 13.5px; line-height: 1.55;">${itemText}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<p style="margin: 0 0 14px 0; font-size: 14px; line-height: 1.65; color: #35443a;">${escape(trimmed)}</p>`;
    }
  }

  if (inList) {
    html += "</ul>";
  }

  return html;
}

/**
 * Generates an executive, responsive HTML template for Candidate Decision / Status Emails.
 */
export function generateCandidateDecisionEmailHtml({
  candidateName,
  jobPosition = "the position",
  decisionType = "selected", // 'selected' | 'reevaluate' | 'rejected'
  message = "",
  companyName = "RecruitAI Partner Team",
}) {
  let headerBg = "linear-gradient(135deg, #1c3829 0%, #29513b 100%)";
  let badgeText = "NEXT STAGE INVITATION";
  let headerTitle = `Application Update: ${jobPosition}`;
  let statusLabel = "Advanced to Next Evaluation Stage";
  let statusColor = "#1c3829";
  let statusBg = "#eaf3ed";

  if (decisionType === "reevaluate") {
    headerBg = "linear-gradient(135deg, #1f2d3d 0%, #2c4257 100%)";
    badgeText = "APPLICATION FOLLOW-UP";
    headerTitle = `Interview Follow-Up: ${jobPosition}`;
    statusLabel = "Follow-Up Discussion Requested";
    statusColor = "#1f2d3d";
    statusBg = "#edf2f7";
  } else if (decisionType === "rejected") {
    headerBg = "linear-gradient(135deg, #2b333a 0%, #3d4852 100%)";
    badgeText = "APPLICATION UPDATE";
    headerTitle = `Application Status: ${jobPosition}`;
    statusLabel = "Application Concluded";
    statusColor = "#475569";
    statusBg = "#f1f5f9";
  }

  const messageHtml = formatMessageToHtml(message);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f6f8f6;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #1e2621;
      -webkit-font-smoothing: antialiased;
    }
    .container {
      max-width: 580px;
      margin: 36px auto;
      background: #ffffff;
      border: 1px solid #e1e7e2;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(18, 38, 24, 0.04);
    }
    .header {
      background: ${headerBg};
      padding: 30px 36px;
      color: #ffffff;
    }
    .header-badge {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      background: rgba(255, 255, 255, 0.16);
      color: #ffffff;
      padding: 4px 10px;
      border-radius: 9999px;
      margin-bottom: 10px;
    }
    .header-title {
      font-size: 21px;
      font-weight: 700;
      margin: 0;
      line-height: 1.3;
      color: #ffffff;
    }
    .content {
      padding: 32px 36px;
    }
    .footer {
      padding: 24px 36px;
      background-color: #f6f8f6;
      border-top: 1px solid #e6ece7;
      font-size: 11px;
      color: #6d8073;
      line-height: 1.6;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <span class="header-badge">${badgeText}</span>
      <h1 class="header-title">${headerTitle}</h1>
    </div>

    <!-- Main Content Area -->
    <div class="content">
      <!-- Status pill table -->
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 24px; background-color: ${statusBg}; border-radius: 8px; border-left: 3px solid ${statusColor};">
        <tr>
          <td style="padding: 12px 16px; font-size: 13px; font-weight: 600; color: ${statusColor};">
            Position: ${jobPosition}
          </td>
          <td style="padding: 12px 16px; font-size: 12px; font-weight: 700; color: ${statusColor}; text-align: right;">
            ${statusLabel}
          </td>
        </tr>
      </table>

      <!-- Candidate personalized message -->
      <div style="margin-top: 8px;">
        ${messageHtml}
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      This notification was sent on behalf of <strong>${companyName}</strong> using RecruitAI.<br>
      Please contact your recruiting coordinator if you have any questions.
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Dispatches a candidate decision / status update email via SMTP.
 */
export async function sendCandidateDecisionEmail({
  candidateEmail,
  candidateName,
  jobPosition = "Role",
  decisionType = "selected",
  subject,
  message,
  companyName = "RecruitAI Partner Team",
}) {
  const { transporter, isTest, fromEmail } = await getEmailTransporter();

  const finalSubject =
    subject ||
    (decisionType === "selected"
      ? `Invitation to Next Interview Stage: ${jobPosition}`
      : decisionType === "reevaluate"
      ? `Follow-up on Your Interview Assessment for ${jobPosition}`
      : `Update Regarding Your Application for ${jobPosition}`);

  const html = generateCandidateDecisionEmailHtml({
    candidateName,
    jobPosition,
    decisionType,
    message,
    companyName,
  });

  // If no transporter could be created, return simulated success in dev
  if (!transporter) {
    return {
      success: true,
      messageId: `mock_${Date.now()}`,
      previewUrl: null,
      isTest: true,
    };
  }

  const info = await transporter.sendMail({
    from: fromEmail,
    to: candidateEmail,
    subject: finalSubject,
    text: message,
    html,
  });

  const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) : null;
  if (previewUrl) {
    console.log(`[Decision Email Preview] Sent test email to ${candidateEmail}: ${previewUrl}`);
  }

  return {
    success: true,
    messageId: info.messageId,
    previewUrl,
    isTest,
  };
}

