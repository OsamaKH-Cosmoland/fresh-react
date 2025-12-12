import { SimpleFeatureFlagProvider } from "../SimpleFeatureFlagProvider";
import { StaticConfigProvider } from "../StaticConfigProvider";

describe("SimpleFeatureFlagProvider", () => {
  it("honors overrides, config values, and defaults", async () => {
    const config = new StaticConfigProvider({
      values: {
        FEATURE_TEST_FLAG: "true",
        FEATURE_OTHER_FLAG: "false",
      },
    });
    const provider = new SimpleFeatureFlagProvider(config, {
      overrides: { OTHER_FLAG: true },
      defaults: { TEST_FLAG: false },
    });

    expect(await provider.isEnabled("test_flag")).toBe(true);
    expect(await provider.isEnabled("other_flag")).toBe(true);
    expect(await provider.isEnabled("missing_flag")).toBe(false);
  });

  it("uses context overrides before falling back to config or defaults", async () => {
    const config = new StaticConfigProvider({
      values: {
        FEATURE_CONTEXTED: "false",
      },
    });
    const provider = new SimpleFeatureFlagProvider(config, {
      defaults: { CONTEXTED: true },
    });

    const viaFeatureFlags = await provider.isEnabled("contexted", {
      featureFlags: { FEATURE_CONTEXTED: "yes" },
    });
    expect(viaFeatureFlags).toBe(true);

    const viaFlags = await provider.isEnabled("contexted", {
      flags: { CONTEXTED: "false" },
    });
    expect(viaFlags).toBe(false);

    expect(await provider.isEnabled("contexted")).toBe(false);
  });
});
