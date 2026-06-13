import { cookies } from 'next/headers';
import { AdminUploadGate } from '@/components/admin/AdminUploadGate';
import { AdminUploadPanel } from '@/components/admin/AdminUploadPanel';
import { ADMIN_UPLOAD_COOKIE, isAdminUploadConfigured, verifyAdminUploadToken } from '@/lib/adminAuth';
import { getProjects } from '@/lib/data';

export const metadata = {
  title: 'Upload | Everyday Things',
  robots: { index: false, follow: false }
};

export const dynamic = 'force-dynamic';

export default async function AdminUploadPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_UPLOAD_COOKIE)?.value;
  const isConfigured = isAdminUploadConfigured();
  const isAuthenticated = verifyAdminUploadToken(token);

  if (!isConfigured || !isAuthenticated) {
    return <AdminUploadGate isDisabled={!isConfigured} />;
  }

  // Fetch real projects from Supabase (falls back to sampleData if not configured)
  const projects = await getProjects();

  return <AdminUploadPanel projects={projects} />;
}
