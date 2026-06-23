import "server-only";
import { Resend } from "resend";

let resend: Resend | null = null;
function getResend(): Resend {
  if (!resend) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error("RESEND_API_KEY is not set. Add it to .env.local");
    resend = new Resend(key);
  }
  return resend;
}

const FROM = process.env.EMAIL_FROM ?? "Elite Zone J <onboarding@resend.dev>";

export async function sendOtpEmail(to: string, code: string): Promise<void> {
  await getResend().emails.send({
    from: FROM,
    to,
    subject: `${code} is your Elite Zone J verification code`,
    html: `
      <div style="font-family:-apple-system,sans-serif;max-width:480px;margin:0 auto;padding:40px 24px">
        <h2 style="margin:0 0 8px;font-size:20px;font-weight:600">Your verification code</h2>
        <p style="margin:0 0 24px;color:#666;font-size:15px">Enter this code to sign in to your Elite Zone J account:</p>
        <div style="background:#f5f5f5;border-radius:8px;padding:20px;text-align:center;margin:0 0 24px">
          <span style="font-size:32px;font-weight:700;letter-spacing:6px;font-family:monospace">${code}</span>
        </div>
        <p style="margin:0;color:#999;font-size:13px">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
