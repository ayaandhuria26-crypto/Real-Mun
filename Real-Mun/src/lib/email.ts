const RESEND_FROM = process.env.RESEND_FROM || "Real-MUN <onboarding@resend.dev>";

export type SendResult =
  | { ok: true; sent: true }
  | { ok: false; reason: string; devCode?: string };

export async function sendVerificationEmail(
  to: string,
  code: string
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "No RESEND_API_KEY set", devCode: code };
  }

  const html = `
    <div style="background:#f8f7f4;padding:40px;font-family:sans-serif;">
      <h2 style="font-family:Georgia,serif;color:#0a0e1a;margin-bottom:8px;">Real-MUN</h2>
      <p style="color:#0a0e1a;margin-bottom:24px;">Your verification code:</p>
      <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;padding:24px;text-align:center;margin-bottom:24px;">
        <span style="font-family:monospace;font-size:36px;font-weight:bold;letter-spacing:0.3em;color:#0a0e1a;">${code}</span>
      </div>
      <p style="color:#6b7280;font-size:14px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to,
      subject: `Your Real-MUN verification code: ${code}`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, reason: `Resend error ${res.status}: ${body}` };
  }

  return { ok: true, sent: true };
}

export interface BookingEmailOpts {
  to: string;
  name: string;
  topic: string;
  coach: string;
  date: string;
  time: string;
  notes?: string;
}

export async function sendBookingConfirmationEmail(
  opts: BookingEmailOpts
): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, reason: "No RESEND_API_KEY set" };
  }

  const notesRow = opts.notes
    ? `<tr><td style="padding:8px 12px;color:#6b7280;">Notes</td><td style="padding:8px 12px;">${opts.notes}</td></tr>`
    : "";

  const html = `
    <div style="background:#f8f7f4;padding:40px;font-family:sans-serif;">
      <h2 style="font-family:Georgia,serif;color:#0a0e1a;margin-bottom:4px;">Real-MUN</h2>
      <p style="color:#0a0e1a;margin-bottom:24px;">Hi ${opts.name}, your session is confirmed!</p>
      <table style="width:100%;background:#ffffff;border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;">
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px 12px;color:#6b7280;">Topic</td>
          <td style="padding:8px 12px;font-weight:600;">${opts.topic}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px 12px;color:#6b7280;">Coach</td>
          <td style="padding:8px 12px;">${opts.coach}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px 12px;color:#6b7280;">Date</td>
          <td style="padding:8px 12px;">${opts.date}</td>
        </tr>
        <tr style="border-bottom:1px solid #e5e7eb;">
          <td style="padding:8px 12px;color:#6b7280;">Time</td>
          <td style="padding:8px 12px;">${opts.time}</td>
        </tr>
        ${notesRow}
      </table>
      <p style="color:#6b7280;font-size:14px;margin-top:24px;">Your coach will reach out with a meeting link closer to the session. Questions? Email ayaandhuria26@gmail.com.</p>
    </div>
  `;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: opts.to,
      subject: `Confirmed: your Real-MUN session on ${opts.date} at ${opts.time}`,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    return { ok: false, reason: `Resend error ${res.status}: ${body}` };
  }

  return { ok: true, sent: true };
}
