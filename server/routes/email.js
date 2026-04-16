import express from "express";
import nodemailer from "nodemailer";

const router = express.Router();

// ── Transporter ────────────────────────────────────────────────────────────────
function createTransporter() {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });
}

// ── Shared email header/footer HTML ───────────────────────────────────────────
function emailHeader() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
</head>
<body style="margin:0;padding:0;background:#f4f4f7;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;padding:40px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0"
      style="max-width:600px;width:100%;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
      <tr>
        <td style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%);padding:36px 48px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto;">
            <tr>
              <td style="background:rgba(255,255,255,0.15);border-radius:12px;padding:10px 20px;">
                <span style="color:#fff;font-size:22px;font-weight:800;letter-spacing:-0.5px;">🎵 FlickWave</span>
              </td>
            </tr>
          </table>
          <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:12px 0 0;">Your music, your world</p>
        </td>
      </tr>`;
}

function emailFooter() {
  return `      <tr><td style="padding:0 48px;"><hr style="border:none;border-top:1px solid #f3f4f6;margin:0;"/></td></tr>
      <tr>
        <td style="padding:24px 48px 40px;text-align:center;">
          <p style="margin:0 0 4px;font-size:13px;color:#9ca3af;">
            This email was sent from FlickWave Support.
          </p>
          <p style="margin:0;font-size:12px;color:#d1d5db;">
            © ${new Date().getFullYear()} FlickWave. All rights reserved.
          </p>
        </td>
      </tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── OTP email ──────────────────────────────────────────────────────────────────
function buildOtpEmail(userName, otp, purpose = "verification") {
  const isReset = purpose === "reset";
  const heading = isReset ? "Reset your password" : "Verify your email";
  const subtext = isReset
    ? "You requested a password reset. Use the code below to set a new password."
    : "Thank you for signing up! Use the code below to complete your account verification.";

  return `${emailHeader()}
      <tr>
        <td style="padding:48px 48px 32px;">
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:700;color:#111827;">${heading}</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.7;">
            Hi <strong style="color:#111827;">${userName}</strong>,<br/>${subtext}
          </p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td align="center" style="padding:0 0 32px;">
                <div style="display:inline-block;background:linear-gradient(135deg,#f5f3ff,#fdf4ff);border:2px solid #e9d5ff;border-radius:16px;padding:28px 52px;text-align:center;">
                  <p style="margin:0 0 8px;font-size:11px;font-weight:700;color:#7c3aed;letter-spacing:2px;text-transform:uppercase;">
                    ${isReset ? "Password Reset Code" : "Verification Code"}
                  </p>
                  <p style="margin:0;font-size:48px;font-weight:800;letter-spacing:12px;color:#6d28d9;font-family:'Courier New',monospace;">
                    ${otp}
                  </p>
                  <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">Expires in 10 minutes</p>
                </div>
              </td>
            </tr>
          </table>
          <table cellpadding="0" cellspacing="0" width="100%" style="background:#fef9c3;border-radius:10px;margin-bottom:28px;">
            <tr>
              <td style="padding:14px 18px;">
                <p style="margin:0;font-size:13px;color:#92400e;line-height:1.5;">
                  <strong>⚠️ Security notice:</strong> Never share this code with anyone.
                  FlickWave staff will never ask for your OTP. If you did not request this, you can safely ignore this email.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
  ${emailFooter()}`;
}

// ── Support reply email ────────────────────────────────────────────────────────
function buildReplyEmail(userName, originalMessage, replyText, adminName) {
  // Convert newlines in reply to <br> for HTML
  const replyHtml = replyText.replace(/\n/g, "<br/>");

  return `${emailHeader()}
      <tr>
        <td style="padding:48px 48px 36px;">
          <h1 style="margin:0 0 6px;font-size:24px;font-weight:700;color:#111827;">We've replied to your message</h1>
          <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6;">
            Hi <strong style="color:#111827;">${userName}</strong>, our support team has responded to your enquiry.
          </p>

          <!-- Reply box -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:24px;">
            <tr>
              <td style="background:linear-gradient(135deg,#f5f3ff,#fdf4ff);border-left:4px solid #7c3aed;border-radius:0 12px 12px 0;padding:20px 24px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#7c3aed;letter-spacing:1.5px;text-transform:uppercase;">
                  Reply from ${adminName} · FlickWave Support
                </p>
                <p style="margin:0;font-size:15px;color:#1f2937;line-height:1.7;">${replyHtml}</p>
              </td>
            </tr>
          </table>

          <!-- Original message (quoted) -->
          <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:8px;">
            <tr>
              <td style="background:#f9fafb;border-radius:10px;padding:16px 20px;">
                <p style="margin:0 0 6px;font-size:11px;font-weight:600;color:#9ca3af;letter-spacing:1px;text-transform:uppercase;">
                  Your original message
                </p>
                <p style="margin:0;font-size:13px;color:#6b7280;line-height:1.6;font-style:italic;">
                  "${originalMessage.replace(/\n/g, "<br/>")}"
                </p>
              </td>
            </tr>
          </table>

          <p style="margin:20px 0 0;font-size:14px;color:#6b7280;line-height:1.6;">
            If you have further questions, feel free to visit our 
            <a href="#" style="color:#7c3aed;text-decoration:none;font-weight:600;">Support Centre</a>.
          </p>
        </td>
      </tr>
  ${emailFooter()}`;
}

// ── POST /api/email/send-otp ───────────────────────────────────────────────────
router.post("/send-otp", async (req, res) => {
  const { toEmail, userName, otp, purpose } = req.body;
  if (!toEmail || !userName || !otp) {
    return res.status(400).json({ error: "toEmail, userName and otp are required" });
  }
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    return res.status(500).json({ error: "Gmail credentials not configured in .env" });
  }
  try {
    const subject = purpose === "reset"
      ? `${otp} — Your FlickWave password reset code`
      : `${otp} — Verify your FlickWave account`;

    await createTransporter().sendMail({
      from:    `"FlickWave" <${process.env.GMAIL_USER}>`,
      to:      toEmail,
      subject,
      html:    buildOtpEmail(userName, otp, purpose || "verification"),
      text:    `Hi ${userName},\n\nYour FlickWave code is: ${otp}\n\nExpires in 10 minutes.\n\n— FlickWave Team`,
    });

    console.log(`✅ OTP email (${purpose || "verification"}) → ${toEmail}`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ OTP email failed:", err.message);
    res.status(500).json({ error: "Failed to send email. Check Gmail credentials." });
  }
});

// ── POST /api/email/reply ──────────────────────────────────────────────────────
router.post("/reply", async (req, res) => {
  const { toEmail, userName, originalMessage, replyText, adminName } = req.body;

  if (!toEmail || !userName || !replyText || !originalMessage) {
    return res.status(400).json({ error: "toEmail, userName, originalMessage and replyText are required" });
  }
  if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
    return res.status(500).json({ error: "Gmail credentials not configured in .env" });
  }

  try {
    await createTransporter().sendMail({
      from:    `"FlickWave Support" <${process.env.GMAIL_USER}>`,
      to:      toEmail,
      subject: `Re: Your FlickWave support message`,
      html:    buildReplyEmail(userName, originalMessage, replyText, adminName || "FlickWave Support"),
      text:    `Hi ${userName},\n\nThank you for contacting us. Here is our reply:\n\n${replyText}\n\nYour original message:\n"${originalMessage}"\n\n— ${adminName || "FlickWave Support"}`,
    });

    console.log(`✅ Support reply → ${toEmail}`);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Reply email failed:", err.message);
    res.status(500).json({ error: "Failed to send reply. Check Gmail credentials." });
  }
});

export default router;