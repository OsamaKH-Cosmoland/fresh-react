export interface FeatureFlagProvider {
  isEnabled(flagName: string, context?: Record<string, unknown>): Promise<boolean>;
}
