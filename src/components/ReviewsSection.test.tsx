/// <reference types="@testing-library/jest-dom" />
import { render, screen, waitFor } from "@testing-library/react";
import ReviewsSection from "./ReviewsSection";
import { LocaleProvider } from "@/localization/locale";

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

  it("renders seeded reviews when the API has no reviews yet", async () => {
    render(
      <LocaleProvider>
        <ReviewsSection />
      </LocaleProvider>
    );
    await waitFor(() => {
      expect(screen.getByText(/30/)).toBeInTheDocument();
      expect(screen.getByText("هاجر")).toBeInTheDocument();
    });
  });
});
