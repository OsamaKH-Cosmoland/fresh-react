/// <reference types="@testing-library/jest-dom" />
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ReviewsSection from "./ReviewsSection";

const mockFetch = (data: unknown, ok = true) =>
  vi.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => data,
  });

describe("ReviewsSection", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch([]));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders empty state when no reviews", async () => {
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText(/No stories yet/i)).toBeInTheDocument();
    });
  });
});
