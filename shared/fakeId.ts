// Deterministic, prefixable ID generator for tests and in-memory stores.
export function createFakeIdGenerator(prefix = "ID", startAt = 1) {
  let current = startAt;
  return () => `${prefix}-${current++}`;
}
