import { render } from "@react-email/render";

// Deliberately not a server action. Every export of a "use server" file is a
// public endpoint, so putting this in actions/ would publish an open mail relay.
export async function sendEmail({ to, subject, react }) {
  const html = await render(react);

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      accept: "application/json",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        name: process.env.BREVO_FROM_NAME ?? "Fortuno",
        email: process.env.BREVO_FROM_EMAIL,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  });

  if (!res.ok) {
    // Thrown, not swallowed: the Inngest step must fail so it retries and so
    // lastAlertSent is not stamped for an email that never arrived.
    throw new Error(`Brevo send failed (${res.status}): ${await res.text()}`);
  }

  const data = await res.json();
  return { success: true, id: data?.messageId };
}
