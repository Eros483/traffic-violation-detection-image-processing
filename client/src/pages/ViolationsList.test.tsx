import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ViolationsList } from "./ViolationsList";
import { makeRecord } from "../test/fixtures";
import type { ViolationRecord } from "../types";

// Control the shared data context so the page can be tested in isolation.
const state: { records: ViolationRecord[]; loading: boolean; error: string | null } = {
  records: [],
  loading: false,
  error: null,
};

vi.mock("../context/DataContext", () => ({
  useConsoleData: () => state,
}));

function setRecords(records: ViolationRecord[]) {
  state.records = records;
  state.loading = false;
  state.error = null;
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ViolationsList />
    </MemoryRouter>,
  );
}

describe("ViolationsList", () => {
  it("renders a row per record", () => {
    setRecords([
      makeRecord({ plate_number: "KA-01-AB-1234" }),
      makeRecord({ plate_number: "KA-99-ZZ-9999" }),
    ]);
    renderPage();
    expect(screen.getByText("KA-01-AB-1234")).toBeInTheDocument();
    expect(screen.getByText("KA-99-ZZ-9999")).toBeInTheDocument();
    expect(screen.getByText("2 of 2 records")).toBeInTheDocument();
  });

  it("filters by plate substring", () => {
    setRecords([
      makeRecord({ plate_number: "KA-01-AB-1234" }),
      makeRecord({ plate_number: "KA-99-ZZ-9999" }),
    ]);
    renderPage();
    fireEvent.change(screen.getByLabelText("Search by plate number"), { target: { value: "AB" } });
    expect(screen.getByText("KA-01-AB-1234")).toBeInTheDocument();
    expect(screen.queryByText("KA-99-ZZ-9999")).not.toBeInTheDocument();
    expect(screen.getByText("1 of 2 records")).toBeInTheDocument();
  });

  it("filters by severity", () => {
    setRecords([
      makeRecord({ plate_number: "KA-01-AB-1234", severity: "high" }),
      makeRecord({ plate_number: "KA-99-ZZ-9999", severity: "standard" }),
    ]);
    renderPage();
    fireEvent.change(screen.getByLabelText("Filter by severity"), { target: { value: "high" } });
    expect(screen.getByText("KA-01-AB-1234")).toBeInTheDocument();
    expect(screen.queryByText("KA-99-ZZ-9999")).not.toBeInTheDocument();
  });

  it("shows an empty state with no records", () => {
    setRecords([]);
    renderPage();
    expect(screen.getByText("No matching violations")).toBeInTheDocument();
  });
});
