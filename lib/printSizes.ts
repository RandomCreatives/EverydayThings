import type { PrintSize } from './types';

export const printSizes: PrintSize[] = [
  { id: 'small', label: 'Small', dimensions: '12 × 16 in', priceCents: 180000 },
  { id: 'medium', label: 'Medium', dimensions: '18 × 24 in', priceCents: 320000 },
  { id: 'large', label: 'Large', dimensions: '24 × 36 in', priceCents: 540000 }
];

export function getPrintSize(sizeId: string) {
  return printSizes.find((size) => size.id === sizeId);
}

export function getEtbAmountFromSize(sizeId: string) {
  const size = getPrintSize(sizeId);
  if (!size) return null;
  return Math.round(size.priceCents / 100);
}
