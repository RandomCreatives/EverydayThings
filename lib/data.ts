export { photographs, printSizes, projects } from '@/data/sampleData';
import { photographs, projects } from '@/data/sampleData';

export function getProjectById(id: string) {
  return projects.find((project) => project.id === id);
}

export function getPhotographsByProject(projectId: string) {
  return photographs.filter((photo) => photo.projectId === projectId).slice(0, 12);
}

export function getPhotographByCode(imageCode: string) {
  return photographs.find((photo) => photo.imageCode === imageCode);
}
