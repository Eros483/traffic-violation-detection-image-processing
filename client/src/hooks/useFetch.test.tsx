import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { useFetch } from "./useFetch";

describe("useFetch", () => {
  it("resolves to data and clears loading", async () => {
    const { result } = renderHook(() => useFetch(async () => "ok", []));
    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe("ok");
    expect(result.current.error).toBeNull();
  });

  it("captures a thrown error", async () => {
    const { result } = renderHook(() =>
      useFetch(async () => {
        throw new Error("boom");
      }, []),
    );
    await waitFor(() => expect(result.current.error).toBe("boom"));
    expect(result.current.data).toBeNull();
  });

  it("re-runs the loader on reload()", async () => {
    const loader = vi.fn().mockResolvedValue("v");
    const { result } = renderHook(() => useFetch(loader, []));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(loader).toHaveBeenCalledTimes(1);
    act(() => result.current.reload());
    await waitFor(() => expect(loader).toHaveBeenCalledTimes(2));
  });

  it("aborts the in-flight request on unmount", async () => {
    let receivedSignal: AbortSignal | undefined;
    const { unmount } = renderHook(() =>
      useFetch((signal) => {
        receivedSignal = signal;
        return new Promise<string>(() => {}); // never resolves
      }, []),
    );
    expect(receivedSignal?.aborted).toBe(false);
    unmount();
    expect(receivedSignal?.aborted).toBe(true);
  });
});
