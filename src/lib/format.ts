export function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString()}`;
}

export function formatWallet(address: string): string {
  if (address.length <= 8) return address;
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
