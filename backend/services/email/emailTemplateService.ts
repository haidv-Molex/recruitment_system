import fs from "fs/promises";
import path from "path";

export type EmailTemplate = {
  id: string;
  name: string;
  subject: string;
  html: string;
};

const templateDefinitions = [
  {
    id: "offer-letter-vietnam",
    name: "Vietnam Offer Letter",
    subject: "Offer Letter - {{position}} - {{candidate_name}}",
    fileName: "offer-letter-vietnam.html",
    directory: path.join(process.cwd(), "utilities", "email"),
  },
];

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  return Promise.all(templateDefinitions.map(async (template) => {
    const html = await fs.readFile(path.join(template.directory, template.fileName), "utf8");
    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      html,
    };
  }));
}
