import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { type NextApiRequest, type NextApiResponse } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "yaml";
import { z } from "zod";

dayjs.extend(utc);

// Zod schema for MOTD entry
export const MotdEntrySchema = z.object({
  begin: z.string().optional(),
  end: z.string().optional(),
  title: z.string().min(1, "MOTD entry must have a title"),
  message: z.string().min(1, "MOTD entry must have a message"),
  url: z.string().url().optional(),
});

export const MotdFileSchema = z.object({ motd: z.array(MotdEntrySchema).optional() });

const MOTD_PATH = path.join(process.cwd(), "motd.yaml");

const isValidDate = (value?: string): boolean => {
  if (!value) {
    return false;
  }
  const parsed = dayjs.utc(value);
  return parsed.isValid();
};

const isActive = (entry: z.infer<typeof MotdEntrySchema>, now: dayjs.Dayjs): boolean => {
  const { begin, end } = entry;
  if (begin && (!isValidDate(begin) || now.isBefore(dayjs.utc(begin)))) {
    return false;
  }
  if (end && (!isValidDate(end) || !now.isBefore(dayjs.utc(end)))) {
    return false;
  }
  return true;
};

function parseYamlSafe(contents: string): unknown {
  try {
    return yaml.parse(contents);
  } catch {
    return null;
  }
}

function validateMotdFile(parsed: unknown): z.infer<typeof MotdFileSchema> | null {
  const motdFileResult = MotdFileSchema.safeParse(parsed);
  if (!motdFileResult.success) {
    return null;
  }
  return motdFileResult.data;
}

const readActiveMotd = async (): Promise<z.infer<typeof MotdEntrySchema>[]> => {
  const fileContents = await fs.readFile(MOTD_PATH, "utf8").catch(() => null);
  if (!fileContents) {
    return [];
  }

  const parsed = parseYamlSafe(fileContents);
  if (!parsed) {
    return [];
  }

  const motdFile = validateMotdFile(parsed);
  if (!motdFile?.motd || !Array.isArray(motdFile.motd)) {
    return [];
  }

  const now = dayjs.utc();
  const result = motdFile.motd.filter((entry) => isActive(entry, now));
  return result;
};

export default async function handler(_req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    const motd = await readActiveMotd();

    res.setHeader("Cache-Control", "no-store");
    // Return all fields for the active entry
    res.status(200).json(motd);
  } catch {
    res.status(500).json({ error: "Failed to load MOTD" });
  }
}
