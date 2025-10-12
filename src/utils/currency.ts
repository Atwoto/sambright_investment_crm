/**
 * Format a number as Kenyan Shillings (KSh)
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, decimals: number = 2): string {
  return `KSh ${amount
    .toFixed(decimals)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}

/**
 * Format a number as Kenyan Shillings without decimals
 * @param amount - The amount to format
 * @returns Formatted currency string
 */
export function formatCurrencyWhole(amount: number): string {
  return `KSh ${Math.round(amount).toLocaleString("en-KE")}`;
}
