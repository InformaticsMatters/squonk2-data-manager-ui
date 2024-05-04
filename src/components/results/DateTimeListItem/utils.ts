import { formatRelativeTime } from "../../../utils/app/datetime";

export const durationText = (duration: number) => `Duration: ${formatRelativeTime(duration)}`;
