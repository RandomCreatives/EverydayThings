import { ContactForm } from '@/components/ContactForm';

export const metadata = {
  title: 'About & Contact | Minimal Photo Archive'
};

export default function AboutPage() {
  return (
    <main className="mx-auto grid max-w-5xl gap-12 px-3 py-4 md:grid-cols-[220px_1fr] md:px-5">
      <aside className="font-mono text-[10px] uppercase tracking-[0.12em] text-gray-500">ABOUT & CONTACT</aside>
      <section className="grid gap-10">
        <div className="max-w-2xl">
          <h1 className="mb-4 font-mono text-[13px] uppercase tracking-[0.16em] text-black">ARTIST STATEMENT</h1>
          <p className="mb-4 text-sm leading-relaxed text-gray-800">
            This archive collects monochrome field photographs of markets, roadside architecture, and ordinary urban structures. The work favors direct observation, dense browsing, and quiet sequences over decorative interface gestures.
          </p>
          <p className="text-sm leading-relaxed text-gray-800">
            Prints are produced in small batches from image-code SKUs. For commissions, editorial licensing, exhibitions, or archival research requests, use the contact form below.
          </p>
        </div>

        <div className="font-mono text-[11px] uppercase tracking-[0.08em]">
          <h2 className="mb-3">EXTERNAL</h2>
          <ul className="grid gap-2 text-gray-600">
            <li><a className="hover:text-black" href="https://instagram.com" rel="noreferrer" target="_blank">INSTAGRAM</a></li>
            <li><a className="hover:text-black" href="https://behance.net" rel="noreferrer" target="_blank">BEHANCE</a></li>
            <li><a className="hover:text-black" href="https://are.na" rel="noreferrer" target="_blank">ARE.NA</a></li>
          </ul>
        </div>

        <ContactForm />
      </section>
    </main>
  );
}
