import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-[60dvh] max-w-3xl place-items-center px-3 py-10 md:px-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.12em]">
        <h1 className="mb-4">404 / NOT FOUND</h1>
        <Link href="/archive" className="text-gray-600 hover:text-black">
          [ RETURN TO ARCHIVE ]
        </Link>
      </div>
    </main>
  );
}
