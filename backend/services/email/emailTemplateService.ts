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
    id: "offer-letter-standard",
    name: "Standard Offer Letter",
    subject: "Offer Letter - {{position}}",
    fileName: "offer-letter-standard.html",
  },
  {
    id: "offer-letter-internship",
    name: "Internship Offer Letter",
    subject: "Internship Offer Letter - {{position}}",
    fileName: "offer-letter-internship.html",
  },
];

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  const templateDir = path.join(process.cwd(), "templates", "email");

  return Promise.all(templateDefinitions.map(async (template) => {
    const html = await fs.readFile(path.join(templateDir, template.fileName), "utf8");
    return {
      id: template.id,
      name: template.name,
      subject: template.subject,
      html,
    } satisfies EmailTemplate;
  }));
}