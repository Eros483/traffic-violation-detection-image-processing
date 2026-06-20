import { afterEach, describe, expect, it, vi } from "vitest";
import { createChallan, fetchAllViolations, uploadImage } from "./api";
import { makeRecord } from "../test/fixtures";

function jsonResponse(data: unknown, init: Partial<Response> = {}) {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.statusText ?? "OK",
    json: async () => data,
  } as Response;
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("api client", () => {
  it("pages through all violations until the total is reached", async () => {
    const page1 = { items: [makeRecord(), makeRecord()], total: 3, page: 1 };
    const page2 = { items: [makeRecord()], total: 3, page: 2 };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(page1))
      .mockResolvedValueOnce(jsonResponse(page2));
    vi.stubGlobal("fetch", fetchMock);

    const all = await fetchAllViolations(undefined, 2, 5000);
    expect(all).toHaveLength(3);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("POSTs a challan and returns the created record", async () => {
    const created = { challan_id: "ch-1", fine_total: 1000 };
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(created, { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await createChallan({ violation_id: "vio-1", violations: [{ type: "helmet" }] });
    expect(result.challan_id).toBe("ch-1");
    const [, opts] = fetchMock.mock.calls[0];
    expect(opts.method).toBe("POST");
    expect(JSON.parse(opts.body).violation_id).toBe("vio-1");
  });

  it("surfaces the backend detail message when an upload fails", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(jsonResponse({ detail: "File must be an image." }, { ok: false, status: 400 }));
    vi.stubGlobal("fetch", fetchMock);

    const file = new File(["x"], "not-an-image.txt", { type: "text/plain" });
    await expect(uploadImage(file)).rejects.toThrow("File must be an image.");
  });
});
