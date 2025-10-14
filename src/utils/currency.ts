/**
 * Format a number as Kenyan Shillings (KSh)
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(
  amount: number | null | undefined,
  decimals: number = 2
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `KSh 0${decimals > 0 ? "." + "0".repeat(decimals) : ""}`;
  }
  return `KSh ${amount
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/**
 * Format a number as Kenyan Shillings without decimals
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrencyWhole(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return `KSh 0`;
  }
  return `KSh ${Math.round(amount).toLocaleString("en-KE")}`;
}
