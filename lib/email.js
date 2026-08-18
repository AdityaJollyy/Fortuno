import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Deliberately not a server action. Every export of a "use server" file is a
// public endpoint, so putting this in actions/ would publish an open mail relay.
export async function sendEmail({ to, subject, react }) {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? "Fortuno <onboarding@resend.dev>",
      to,
      subject,
      react,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Failed to send email:", error);
    return { success: false };
  }
}
