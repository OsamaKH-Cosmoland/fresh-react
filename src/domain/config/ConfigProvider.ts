export interface ConfigProvider {
  get(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  getObject<T = unknown>(key: string): T | undefined;
}
