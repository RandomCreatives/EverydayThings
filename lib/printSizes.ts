import type { PrintSize } from './types';

export const printSizes: PrintSize[] = [
  { id: 'small',  label: 'Small',  dimensions: '30 × 40 cm', priceCents: 220000 },
  { id: 'medium', label: 'Medium', dimensions: '45 × 60 cm', priceCents: 390000 },
  { id: 'large',  label: 'Large',  dimensions: '60 × 90 cm', priceCents: 660000 }
];

export function getPrintSize(sizeId: string) {
  return printSizes.find((size) => size.id === sizeId);
}

export function getEtbAmountFromSize(sizeId: string) {
  const size = getPrintSize(sizeId);
  if (!size) return null;
  return Math.round(size.priceCents / 100);
}
