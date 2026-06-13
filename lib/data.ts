/**
 * Data access layer.
 */

import type { Photograph, Project } from './types';
import {
  photographs as samplePhotographs,
  projects as sampleProjects,
} from '@/data/sampleData';
import { printSizes as unifiedPrintSizes } from './printSizes';
import { getSupabasePublic } from './supabase';

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

function mapProject(row: DbProject): Project {
  return {
    id: row.slug ?? row.id,
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

export async function getProjects(): Promise<Project[]> {
  const sb = getSupabasePublic();
  if (!sb) return sampleProjects;

  const { data, error } = await sb.from('projects').select().order('created_at', { ascending: true });
  if (error || !Array.isArray(data)) return sampleProjects;
  return (data as DbProject[]).map(mapProject);
}

export async function getPhotographs(): Promise<Photograph[]> {
  const sb = getSupabasePublic();
  if (!sb) return samplePhotographs;

  const { data, error } = await sb.from('photographs').select().order('created_at', { ascending: false });
  if (error || !Array.isArray(data)) return samplePhotographs;
  return (data as DbPhotograph[]).map(mapPhotograph);
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

  const { data: projectData, error: projectError } = await sb
    .from('projects')
    .select('id')
    .eq('slug', projectId)
    .single();

  const realId = !projectError && projectData ? (projectData as any).id : projectId;

  // UUID validation check to avoid Postgres error 22P02
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(realId);
  if (!isUuid) return [];

  const { data, error } = await sb
    .from('photographs')
    .select()
    .eq('project_id', realId)
    .order('created_at', { ascending: true });

  if (error || !Array.isArray(data)) return [];
  return (data as DbPhotograph[]).map(mapPhotograph).slice(0, 12);
}

export async function getPhotographByCode(imageCode: string): Promise<Photograph | undefined> {
  const sb = getSupabasePublic();
  if (!sb) return samplePhotographs.find((p) => p.imageCode === imageCode);

  const { data, error } = await sb.from('photographs').select().eq('image_code', imageCode).single();
  if (error || !data) return undefined;
  return mapPhotograph(data as DbPhotograph);
}

export const printSizes = unifiedPrintSizes;
export { samplePhotographs as photographs, sampleProjects as projects };
