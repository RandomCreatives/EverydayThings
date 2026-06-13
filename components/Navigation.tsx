import Link from 'next/link';

const links = [
  { href: '/archive', label: 'ARCHIVE' },
  { href: '/projects', label: 'PROJECTS' },
  { href: '/about', label: 'ABOUT & CONTACT' }
];

export function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b border-black bg-white" style={{ height: '44px' }}>
      <nav className="mx-auto flex max-w-[1800px] h-full items-center justify-between px-3 md:px-5">
        {/* Left — tabs */}
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.12em] text-black">
          {links.map((link, index) => (
            <span key={link.href} className="flex items-center gap-2">
              <Link href={link.href} className="hover:text-gray-500">
                {link.label}
              </Link>
              {index < links.length - 1 ? <span aria-hidden="true">•</span> : null}
            </span>
          ))}
        </div>
        {/* Right — brand */}
        <Link href="/archive" className="font-mono text-[11px] uppercase tracking-[0.16em] text-black hover:text-gray-500">
          EVERYDAY THINGS
        </Link>
      </nav>
    </header>
  );
}
