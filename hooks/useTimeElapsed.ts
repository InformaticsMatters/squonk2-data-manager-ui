import { useEffect, useLayoutEffect, useRef, useState } from "react";

const useIsomorphicEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export interface Props {
  /** Animation duration in seconds */
  duration?: number;
  /** Start the animation at provided time in seconds. Default: 0 */
  startAt?: number;
  /** Update interval in seconds. Determines how often the elapsed time value will change. When set to 0 the value will update on each key frame. Default: 0 */
  updateInterval?: number;
}

export const useElapsedTime = ({ duration, startAt = 0, updateInterval = 0 }: Props) => {
  const [displayTime, setDisplayTime] = useState(startAt);
  const elapsedTimeRef = useRef(0);
  const startAtRef = useRef(startAt);
  const requestRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const repeatTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const loop = (time: number) => {
    const timeSec = time / 1000;
    if (previousTimeRef.current === null) {
      previousTimeRef.current = timeSec;
      requestRef.current = requestAnimationFrame(loop);
      return;
    }

    // get current elapsed time
    const deltaTime = timeSec - previousTimeRef.current;
    const currentElapsedTime = elapsedTimeRef.current + deltaTime;

    // update refs with the current elapsed time
    previousTimeRef.current = timeSec;
    elapsedTimeRef.current = currentElapsedTime;

    // set current display time by adding the elapsed time on top of the startAt time
    const currentDisplayTime =
      startAtRef.current +
      (updateInterval === 0
        ? currentElapsedTime
        : Math.trunc(currentElapsedTime / updateInterval) * updateInterval);

    const totalTime = startAtRef.current + currentElapsedTime;
    const isCompleted = typeof duration === "number" && totalTime >= duration;
    setDisplayTime(isCompleted ? duration : currentDisplayTime);

    // repeat animation if not completed
    if (!isCompleted) {
      requestRef.current = requestAnimationFrame(loop);
    }
  };

  useIsomorphicEffect(() => {
    requestRef.current = requestAnimationFrame(loop);

    return () => {
      requestRef.current && cancelAnimationFrame(requestRef.current);
      repeatTimeoutRef.current && clearTimeout(repeatTimeoutRef.current);
      previousTimeRef.current = null;
    };
    // start animation over when duration or updateInterval change
  }, [duration, updateInterval]);

  return displayTime;
};
