/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor } from "@testing-library/react";
import ReviewsSection from "./ReviewsSection";

const mockFetch = (data: unknown, ok = true) =>
  jest.fn().mockResolvedValue({
    ok,
    status: ok ? 200 : 500,
    json: async () => data,
  });

describe("ReviewsSection", () => {
  let originalFetch: typeof global.fetch;

  beforeEach(() => {
    originalFetch = global.fetch;
    global.fetch = mockFetch([]) as typeof global.fetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
    jest.restoreAllMocks();
  });

  it("renders empty state when no reviews", async () => {
    render(<ReviewsSection />);
    await waitFor(() => {
      expect(screen.getByText(/No stories yet/i)).toBeInTheDocument();
    });
  });
});
