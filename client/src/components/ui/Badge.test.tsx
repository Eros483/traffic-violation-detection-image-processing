import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, ConfidenceBadge, SeverityBadge } from "./Badge";

describe("Badge", () => {
  it("renders its children", () => {
    render(<Badge>Hello</Badge>);
    expect(screen.getByText("Hello")).toBeInTheDocument();
  });

  it("labels high vs standard severity", () => {
    const { rerender } = render(<SeverityBadge severity="high" />);
    expect(screen.getByText("High")).toBeInTheDocument();
    rerender(<SeverityBadge severity="standard" />);
    expect(screen.getByText("Standard")).toBeInTheDocument();
  });

  it("bands confidence and shows the percentage", () => {
    render(<ConfidenceBadge value={0.92} />);
    expect(screen.getByText("High")).toBeInTheDocument();
    expect(screen.getByText(/92%/)).toBeInTheDocument();
  });

  it("renders a dash for a null confidence", () => {
    render(<ConfidenceBadge value={null} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
