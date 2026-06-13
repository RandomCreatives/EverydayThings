export interface Photograph {
  id: string;
  imageCode: string; // e.g., "AA-MONO-042"
  imageUrl: string; // WebP, optimized 72 DPI, 2000px long edge max
  aspectRatio: number; // width / height for masonry calculations
  title: string;
  description?: string;
  location: string;
  category: string;
  isPrintAvailable: boolean;
  priceTierId?: string;
  projectId?: string; // Optional link to curated series
  createdAt: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  coverImageUrl: string;
  createdAt: string;
}

export interface PrintSize {
  id: string;
  label: string;
  dimensions: string;
  priceCents: number;
}
