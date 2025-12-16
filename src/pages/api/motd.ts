import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { type NextApiRequest, type NextApiResponse } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "yaml";
import { z } from "zod";

dayjs.extend(utc);

// Zod schema for MOTD entry
const MotdEntrySchema = z.object({
  message: z.string().min(1, "MOTD entry must have a message"),
  title: z.string().optional(),
  url: z.string().url().optional(),
  begin: z.string().optional(),
  end: z.string().optional(),
});

const MotdFileSchema = z.object({ motd: z.array(MotdEntrySchema).optional() });

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

const readActiveMotd = async (): Promise<z.infer<typeof MotdEntrySchema> | null> => {
  const fileContents = await fs.readFile(MOTD_PATH, "utf8").catch(() => null);
  if (!fileContents) {
    return null;
  }

  const parsed = parseYamlSafe(fileContents);
  if (!parsed) {
    return null;
  }

  const motdFile = validateMotdFile(parsed);
  if (!motdFile?.motd || !Array.isArray(motdFile.motd)) {
    return null;
  }

  const now = dayjs.utc();
  return motdFile.motd.find((entry) => isActive(entry, now)) ?? null;
};

export default async function handler(_req: NextApiRequest, res: NextApiResponse): Promise<void> {
  try {
    const motd = await readActiveMotd();

    if (!motd) {
      res.status(204).end();
      return;
    }

    res.setHeader("Cache-Control", "no-store");
    // Return all fields for the active entry
    res.status(200).json(motd);
  } catch {
    res.status(500).json({ error: "Failed to load MOTD" });
  }
}
