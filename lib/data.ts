/**
 * Data access layer.
 *
 * Tries Supabase first. If not configured (env vars missing / local dev),
 * falls back to the local sampleData arrays so the app always renders.
 */

import type { Photograph, Project } from './types';
import {
  photographs as samplePhotographs,
  projects as sampleProjects,
} from '@/data/sampleData';
import { printSizes as unifiedPrintSizes } from './printSizes';
import { getSupabasePublic } from './supabase';

// ─── Row shapes from Supabase (snake_case) ───────────────────────────────────

type DbProject = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cover_image_url: string;
  created_at: string;
};

type DbPhotograph = {
  id: string;
  image_code: string;
  image_url: string;
  aspect_ratio: number;
  title: string;
  description: string | null;
  location: string;
  category: string;
  is_print_available: boolean;
  price_tier_id: string | null;
  project_id: string | null;
  created_at: string;
};

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapProject(row: DbProject): Project {
  return {
    id: row.slug ?? row.id, // use slug as the URL-safe id
    title: row.title,
    description: row.description,
    coverImageUrl: row.cover_image_url,
    createdAt: row.created_at,
  };
}

function mapPhotograph(row: DbPhotograph): Photograph {
  return {
    id: row.id,
    imageCode: row.image_code,
    imageUrl: row.image_url,
    aspectRatio: Number(row.aspect_ratio),
    title: row.title,
    description: row.description ?? undefined,
    location: row.location,
    category: row.category,
    isPrintAvailable: row.is_print_available,
    priceTierId: row.price_tier_id ?? undefined,
    projectId: row.project_id ?? undefined,
    createdAt: row.created_at,
  };
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getProjects(): Promise<Project[]> {
  const sb = getSupabasePublic();
  if (!sb) return sampleProjects;

  const { data, error } = await sb.from('projects').select().order('created_at', { ascending: true });
  if (error || !data) return sampleProjects;
  return (data as unknown as DbProject[]).map(mapProject);
}

export async function getPhotographs(): Promise<Photograph[]> {
  const sb = getSupabasePublic();
  if (!sb) return samplePhotographs;

  const { data, error } = await sb.from('photographs').select().order('created_at', { ascending: false });
  if (error || !data) return samplePhotographs;
  return (data as unknown as DbPhotograph[]).map(mapPhotograph);
}

export async function getProjectById(id: string): Promise<Project | undefined> {
  const projects = await getProjects();
  return projects.find((p) => p.id === id);
}

export async function getPhotographsByProject(projectId: string): Promise<Photograph[]> {
  const sb = getSupabasePublic();
  if (!sb) {
    return samplePhotographs.filter((p) => p.projectId === projectId).slice(0, 12);
  }

  // Resolve slug → uuid if needed
  const projects = await getProjects();
  const project = projects.find((p) => p.id === projectId);
  if (!project) return [];

  const { data, error } = await sb
    .from('photographs')
    .select()
    .eq('project_id', project.id)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return (data as unknown as DbPhotograph[]).map(mapPhotograph).slice(0, 12);
}

export async function getPhotographByCode(imageCode: string): Promise<Photograph | undefined> {
  const sb = getSupabasePublic();
  if (!sb) return samplePhotographs.find((p) => p.imageCode === imageCode);

  const { data, error } = await sb.from('photographs').select().eq('image_code', imageCode);
  if (error || !data || !(data as unknown[]).length) return undefined;
  return mapPhotograph((data as unknown as DbPhotograph[])[0]);
}

// Print sizes remain local — simple reference data, no need for DB round-trip
export const printSizes = unifiedPrintSizes;

// Re-export sample arrays for static param generation (generateStaticParams).
// All runtime data fetching uses the async functions above.
export { samplePhotographs as photographs, sampleProjects as projects };
