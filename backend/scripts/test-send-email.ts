import "dotenv/config";
import { sendOutlookEmail } from "@services/email/outlookEmailService";

const sender = process.env.OUTLOOK_SMTP_FROM || process.env.OUTLOOK_SMTP_USER || "thinh.vu@molex.com";
const recipient = process.env.TEST_EMAIL_TO || "hai.do@molex.com";

async function main() {
  console.log("Testing Outlook email delivery...");
  console.log(`From: ${sender}`);
  console.log(`To: ${recipient}`);

  const sentAt = new Date().toISOString();
  const info = await sendOutlookEmail({
    to: recipient,
    subject: `[Recruitment System] Test email ${sentAt}`,
    text: `This is a test email from Recruitment System. Sent at ${sentAt}.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #0f172a;">
        <h2 style="margin: 0 0 12px;">Recruitment System Email Test</h2>
        <p>This is a test email from Recruitment System.</p>
        <p><strong>Sent at:</strong> ${sentAt}</p>
      </div>
    `,
  });

  console.log("Email send request completed.");
  console.log(`Message ID: ${info.messageId || "N/A"}`);
  console.log("Please check the recipient inbox and spam/junk folder.");
}

main().catch((error) => {
  console.error("Email test failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});