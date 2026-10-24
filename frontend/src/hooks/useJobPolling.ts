import { useEffect, useState } from "react";
import type { Job } from "../types";
import { ApiError, getJob } from "../lib/api";

export interface UseJobPollingResult {
  job: Job | null;
  error: ApiError | Error | null;
  isPolling: boolean;
  refetch: () => Promise<void>;
  reset: () => void;
}

/**
 * Custom hook to poll job status every 1500ms.
 * Cleans up interval on unmount and stops when the job completes or fails.
 */
export function useJobPolling(jobId: string | null): UseJobPollingResult {
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<ApiError | Error | null>(null);
  const [stopped, setStopped] = useState<boolean>(false);

  useEffect(() => {
    if (!jobId) {
      return;
    }

    let isMounted = true;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stopInterval = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      if (isMounted) {
        setStopped(true);
      }
    };

    const poll = async () => {
      try {
        const fetchedJob = await getJob(jobId);
        if (!isMounted) return;

        setJob(fetchedJob);
        setError(null);

        // Stop polling on completed or failed
        if (fetchedJob.status === "completed" || fetchedJob.status === "failed") {
          stopInterval();
        }
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        stopInterval();
      }
    };

    void poll();

    intervalId = setInterval(() => {
      void poll();
    }, 1500);

    return () => {
      isMounted = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [jobId]);

  const refetch = async () => {
    if (!jobId) return;
    try {
      const fetchedJob = await getJob(jobId);
      setJob(fetchedJob);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
    }
  };

  const reset = () => {
    setJob(null);
    setError(null);
    setStopped(false);
  };

  const isPolling = Boolean(
    jobId &&
      !stopped &&
      (!job || (job.status !== "completed" && job.status !== "failed")) &&
      !error
  );

  return {
    job: jobId ? job : null,
    error: jobId ? error : null,
    isPolling,
    refetch,
    reset,
  };
}
