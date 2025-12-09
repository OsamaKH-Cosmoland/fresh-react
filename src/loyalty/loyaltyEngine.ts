export function calculatePointsForOrder(orderSubtotal: number) {
  if (!Number.isFinite(orderSubtotal) || orderSubtotal <= 0) {
    return 0;
  }
  return Math.floor(orderSubtotal / 10);
}
