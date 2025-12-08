export function formatVariantMeta(
  variantLabel?: string,
  variantAttributes?: Record<string, string>
): string | null {
  const segments: string[] = [];
  if (variantLabel) {
    segments.push(variantLabel);
  }
  if (variantAttributes) {
    const attributeValues = Object.values(variantAttributes);
    if (attributeValues.length > 0) {
      segments.push(...attributeValues);
    }
  }
  if (segments.length === 0) {
    return null;
  }
  return segments.join(" · ");
}
