import type { Photograph, PrintSize, Project } from '@/lib/types';

export const printSizes: PrintSize[] = [
  { id: 'small', label: 'Small', dimensions: '12 × 16 in', priceCents: 18000 },
  { id: 'medium', label: 'Medium', dimensions: '18 × 24 in', priceCents: 32000 },
  { id: 'large', label: 'Large', dimensions: '24 × 36 in', priceCents: 54000 }
];

export const projects: Project[] = [
  {
    id: 'quiet-markets',
    title: 'QUIET MARKETS',
    description:
      'A tight sequence of morning markets, tarpaulin shade, quick exchanges, sacks, stalls, and handwritten price systems. The work studies daily ritual through small structures and repeated gestures.',
    coverImageUrl: '/images/projects/quiet-markets.jpg',
    createdAt: '2026-01-08'
  },
  {
    id: 'roadside-forms',
    title: 'ROADSIDE FORMS',
    description:
      'A linear field note on roadsides: kiosks, walls, tree shade, waiting zones, walking figures, and the graphic interruptions that collect around movement.',
    coverImageUrl: '/images/projects/roadside-forms.jpg',
    createdAt: '2026-02-14'
  },
  {
    id: 'city-rituals',
    title: 'CITY RITUALS',
    description:
      'Short observations of repeated urban routines: opening shutters, sweeping thresholds, phone charging, morning crossings, and the choreography of ordinary public space.',
    coverImageUrl: '/images/projects/city-rituals.jpg',
    createdAt: '2026-03-04'
  }
];

export const photographs: Photograph[] = [
  {
    id: 'p-001',
    imageCode: 'AA-MONO-001',
    imageUrl: '/images/archive/aa-mono-001.jpg',
    aspectRatio: 0.72,
    title: 'Awning Study',
    location: 'Mesa Market, Addis Ababa',
    category: 'market',
    isPrintAvailable: true,
    priceTierId: 'standard',
    projectId: 'quiet-markets',
    createdAt: '2026-01-09'
  },
  {
    id: 'p-002',
    imageCode: 'AA-MONO-002',
    imageUrl: '/images/archive/aa-mono-002.jpg',
    aspectRatio: 1.42,
    title: 'Wall Shade',
    location: 'Bole Road Shadows',
    category: 'street',
    isPrintAvailable: true,
    priceTierId: 'standard',
    projectId: 'roadside-forms',
    createdAt: '2026-01-11'
  },
  {
    id: 'p-003',
    imageCode: 'AA-MONO-003',
    imageUrl: '/images/archive/aa-mono-003.jpg',
    aspectRatio: 0.64,
    title: 'Crate Stack',
    location: 'Arat Kilo Morning',
    category: 'market',
    isPrintAvailable: true,
    priceTierId: 'standard',
    projectId: 'quiet-markets',
    createdAt: '2026-01-13'
  },
  {
    id: 'p-004',
    imageCode: 'AA-MONO-004',
    imageUrl: '/images/archive/aa-mono-004.jpg',
    aspectRatio: 1.18,
    title: 'Checkpoint Shade',
    location: 'Piassa Bus Stop',
    category: 'roadside',
    isPrintAvailable: true,
    priceTierId: 'standard',
    projectId: 'roadside-forms',
    createdAt: '2026-01-15'
  },
  {
    id: 'p-005',
    imageCode: 'AA-MONO-005',
    imageUrl: '/images/archive/aa-mono-005.jpg',
    aspectRatio: 0.82,
    title: 'Laundry Line',
    location: 'Kazanchis Midday',
    category: 'street',
    isPrintAvailable: false,
    projectId: 'city-rituals',
    createdAt: '2026-01-20'
  },
  {
    id: 'p-006',
    imageCode: 'AA-MONO-006',
    imageUrl: '/images/archive/aa-mono-006.jpg',
    aspectRatio: 1.62,
    title: 'Taxi Rank',
    location: 'Mexico Square Crossing',
    category: 'roadside',
    isPrintAvailable: true,
    priceTierId: 'standard',
    projectId: 'roadside-forms',
    createdAt: '2026-01-24'
  },
  {
    id: 'p-007',
    imageCode: 'AA-MONO-007',
    imageUrl: '/images/archive/aa-mono-007.jpg',
    aspectRatio: 0.68,
    title: 'Table Edge',
    location: 'Shiro Meda Weavers',
    category: 'market',
    isPrintAvailable: true,
    priceTierId: 'standard',
    projectId: 'quiet-markets',
    createdAt: '2026-02-02'
  },
  {
    id: 'p-008',
    imageCode: 'AA-MONO-008',
    imageUrl: '/images/archive/aa-mono-008.jpg',
    aspectRatio: 1.31,
    title: 'Painted Gate',
    location: 'Lideta Afternoon',
    category: 'street',
    isPrintAvailable: true,
    priceTierId: 'standard',
    projectId: 'city-rituals',
    createdAt: '2026-02-06'
  },
  {
    id: 'p-009',
    imageCode: 'AA-MONO-009',
    imageUrl: '/images/archive/aa-mono-009.jpg',
    aspectRatio: 0.95,
    title: 'Shelter Frame',
    location: 'Merkato Phone Stalls',
    category: 'roadside',
    isPrintAvailable: true,
    priceTierId: 'standard',
    projectId: 'city-rituals',
    createdAt: '2026-02-10'
  },
  {
    id: 'p-010',
    imageCode: 'AA-MONO-010',
    imageUrl: '/images/archive/aa-mono-010.jpg',
    aspectRatio: 0.59,
    title: 'Morning Inventory',
    location: 'Saris Early Trade',
    category: 'market',
    isPrintAvailable: true,
    priceTierId: 'standard',
    projectId: 'quiet-markets',
    createdAt: '2026-02-19'
  }
];
