import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { type NextApiRequest, type NextApiResponse } from "next";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "yaml";

dayjs.extend(utc);

type MotdEntry = { message?: string; begin?: string; end?: string };

type MotdFile = { motd?: MotdEntry[] };

const MOTD_PATH = path.join(process.cwd(), "motd.yaml");

const isValidDate = (value?: string): boolean => {
  if (!value) {
    return false;
  }
  const parsed = dayjs.utc(value);
  return parsed.isValid();
};

const isActive = (entry: MotdEntry, now: dayjs.Dayjs): boolean => {
  const { begin, end } = entry;
  if (begin && (!isValidDate(begin) || now.isBefore(dayjs.utc(begin)))) {
    return false;
  }
  if (end && (!isValidDate(end) || !now.isBefore(dayjs.utc(end)))) {
    return false;
  }
  return true;
};

const readActiveMessage = async (): Promise<string | null> => {
  let fileContents: string;
  try {
    fileContents = await fs.readFile(MOTD_PATH, "utf8");
  } catch {
    return null;
  }

  let parsed: MotdFile | null;
  try {
    parsed = yaml.parse(fileContents) as MotdFile | null;
  } catch {
    return null;
  }

  if (!parsed?.motd || !Array.isArray(parsed.motd)) {
    return null;
  }

  const now = dayjs.utc();
  for (const entry of parsed.motd) {
    if (!entry.message) {
      continue;
    }
    if (isActive(entry, now)) {
      return entry.message;
    }
  }

  return null;
};

export default async function handler(_req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const message = await readActiveMessage();

  if (!message) {
    res.status(204).end();
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ message });
}
