'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12">
          <h1 className="text-5xl font-bold mb-4">Fusion - Next.js Edition</h1>
          <p className="text-xl text-slate-300">
            Successfully migrated from Vite + React Router to Next.js
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">✅ Completed</h2>
            <ul className="space-y-2 text-slate-300">
              <li>✓ Next.js App Router setup</li>
              <li>✓ 17 API routes created</li>
              <li>✓ Environment variables configured</li>
              <li>✓ TailwindCSS & styling</li>
              <li>✓ Privy authentication provider</li>
              <li>✓ React Query integration</li>
            </ul>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-2xl font-bold mb-4">🔄 In Progress</h2>
            <ul className="space-y-2 text-slate-300">
              <li>→ Page migrations (11 pages)</li>
              <li>→ Image processing routes (full implementation)</li>
              <li>→ Component refactoring</li>
              <li>→ Testing suite</li>
            </ul>
          </div>
        </div>

        <div className="bg-blue-900 border border-blue-700 p-6 rounded-lg mb-8">
          <h2 className="text-2xl font-bold mb-4">🚀 Getting Started</h2>
          <p className="text-slate-300 mb-4">
            To complete the migration:
          </p>
          <ol className="list-decimal list-inside space-y-2 text-slate-300">
            <li>Read <code className="bg-slate-800 px-2 py-1 rounded">MIGRATION_GUIDE.md</code> for detailed instructions</li>
            <li>Migrate pages from <code className="bg-slate-800 px-2 py-1 rounded">app/pages-old/</code> to <code className="bg-slate-800 px-2 py-1 rounded">app/</code></li>
            <li>Implement stub API routes (see AGENTS.md for which ones)</li>
            <li>Run <code className="bg-slate-800 px-2 py-1 rounded">pnpm dev</code> to start development</li>
          </ol>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">📚 Documentation</h2>
          <div className="space-y-2">
            <p>
              <a href="/AGENTS.md" className="text-blue-400 hover:text-blue-300">
                → AGENTS.md - Tech stack & project structure
              </a>
            </p>
            <p>
              <a href="/MIGRATION_GUIDE.md" className="text-blue-400 hover:text-blue-300">
                → MIGRATION_GUIDE.md - Step-by-step migration instructions
              </a>
            </p>
            <p>
              <a href="/DEPLOYMENT_GUIDE.md" className="text-blue-400 hover:text-blue-300">
                → DEPLOYMENT_GUIDE.md - Deployment options
              </a>
            </p>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-700 text-center text-slate-400">
          <p>API Status: <span className="text-green-400">13/17 routes fully implemented</span></p>
          <p>Pages Status: <span className="text-yellow-400">1/11 routes ready</span></p>
        </div>
      </div>
    </div>
  );
}
