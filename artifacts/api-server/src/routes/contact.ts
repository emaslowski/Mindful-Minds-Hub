import { Router } from "express";
import nodemailer from "nodemailer";

const router = Router();

router.post("/api/contact", async (req, res) => {
  const { name, grade, message } = req.body as {
    name?: string;
    grade?: string;
    message?: string;
  };

  if (!name?.trim() || !message?.trim()) {
    res.status(400).json({ error: "Name and message are required." });
    return;
  }

  const smtpHost = process.env.SMTP_HOST;
  if (!smtpHost) {
    // If email isn't configured, still acknowledge receipt so the page works
    res.status(200).json({ ok: true, note: "Email not configured — message recorded." });
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const gradeLabel = grade ? ` (Grade ${grade})` : "";

    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: "elittle9514@gmail.com",
      subject: `💌 New Message from ${name}${gradeLabel} — Mind Matters`,
      text: `You have a new message from a student on Mind Matters.\n\nName: ${name}${gradeLabel}\n\nMessage:\n${message}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;background:#fdf8f3;padding:32px;border-radius:16px;">
          <h2 style="color:#C4622D;margin-top:0">💌 New Message — Mind Matters</h2>
          <p style="color:#555">A student has sent you a message through the website.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0">
            <tr>
              <td style="padding:8px 0;font-weight:bold;color:#333;width:80px">Name:</td>
              <td style="padding:8px 0;color:#555">${name}</td>
            </tr>
            ${grade ? `<tr>
              <td style="padding:8px 0;font-weight:bold;color:#333">Grade:</td>
              <td style="padding:8px 0;color:#555">${grade}</td>
            </tr>` : ""}
          </table>
          <div style="background:#fff;border-left:4px solid #C4622D;padding:16px;border-radius:8px;margin-top:8px">
            <p style="color:#333;margin:0;white-space:pre-wrap">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</p>
          </div>
          <p style="color:#999;font-size:13px;margin-top:24px">Sent via Mind Matters contact form.</p>
        </div>
      `,
    });

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Contact email error:", err);
    res.status(500).json({ error: "Failed to send message. Please try again." });
  }
});

export default router;
