# Fusion Starter - Next.js Edition

A production-ready full-stack Next.js application with integrated API routes, featuring Server Components, TypeScript, Vitest, Zod and modern tooling.

This is a migrated version from Vite + React Router to Next.js, maintaining all original functionality.

## Tech Stack

- **PNPM**: Prefer pnpm
- **Frontend**: Next.js 15 + React 18 + TypeScript + TailwindCSS 3
- **Backend**: Next.js API Routes
- **Testing**: Vitest
- **UI**: Radix UI + TailwindCSS 3 + Lucide React icons
- **Authentication**: Privy
- **APIs**: OpenAI, Story Protocol, Pinata IPFS

## Project Structure

```
app/                      # Next.js App Router
├── api/                  # API Routes (replacing Express)
│   ├── check-ip-assets/
│   ├── search-ip-assets/
│   ├── get-suggestions/
│   ├── parse-search-intent/
│   ├── resolve-ip-name/
│   ├── resolve-owner-domain/
│   ├── search-by-owner/
│   ├── ipfs/
│   ├── upload/
│   ├── describe/
│   └── ... (16+ more routes)
├── components/           # React components (moved from client/components)
│   ├── ui/              # UI component library
│   ├── layout/
│   ├── ip-assistant/
│   └── ...
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries
│   ├── api/            # API route utilities
│   └── utils/
├── context/            # React Context
├── types/              # TypeScript types
├── services/           # API client services
├── pages-old/          # Original page components (to be migrated)
├── layout.tsx          # Root layout with providers
├── page.tsx            # Home page
├── providers.tsx       # Client-side providers
├── globals.css         # Global styles
└── ...

public/                 # Static assets
package.json           # Dependencies
next.config.ts         # Next.js configuration
tsconfig.json          # TypeScript configuration
tailwind.config.ts     # Tailwind CSS configuration
```

## Key Changes from Vite to Next.js

1. **Routing**: Changed from React Router to Next.js App Router
   - `/app/page.tsx` = home page (/)
   - `/app/pages-old/` contains original page components to be migrated
   - Create `/app/[route]/page.tsx` for each route

2. **API Routes**: Changed from Express to Next.js API Routes
   - All routes under `/app/api/` are automatically handled
   - Request/Response use `NextRequest`/`NextResponse`
   - File uploads handled with FormData

3. **Environment Variables**: Updated to Next.js format
   - Use `NEXT_PUBLIC_` prefix for variables needed on client
   - Check `.env.local` for all env vars

4. **Providers**: Setup in `app/layout.tsx` and `app/providers.tsx`
   - Privy authentication
   - TanStack Query
   - CreationContext

## Development Commands

```bash
pnpm install    # Install dependencies
pnpm dev        # Start development server (http://localhost:3000)
pnpm build      # Production build
pnpm start      # Start production server
pnpm typecheck  # TypeScript validation
pnpm test       # Run tests
pnpm format.fix # Format code with Prettier
```

## API Routes Status

### ✅ Fully Implemented
- `/api/ping` - Health check
- `/api/resolve-ip-name` - Resolve .ip domain names
- `/api/resolve-owner-domain` - Resolve domains for addresses
- `/api/get-suggestions` - AI-powered search suggestions
- `/api/parse-search-intent` - LLM-based search intent parsing
- `/api/check-ip-assets` - Check IP assets by address (paginated)
- `/api/search-ip-assets` - Full-text search for IP assets
- `/api/search-by-owner` - Search IP assets by owner address
- `/api/ipfs/upload` - Upload files to IPFS via Pinata
- `/api/ipfs/upload-json` - Upload JSON to IPFS
- `/api/generate-image` - Generate images with DALL-E
- `/api/_debug/parent-details/[ipId]` - Debug endpoint
- `/api/_debug_openai` - OpenAI configuration check

### 🔄 Stub Implementation (Need Full Implementation)
These routes are structured but need to be fully implemented with complex logic:
- `/api/upload` - Image upload and classification
- `/api/describe` - Image description generation
- `/api/vision-image-detection` - Advanced vision detection
- `/api/analyze-image-vision` - Vision API analysis
- `/api/check-image-similarity` - Image similarity detection
- `/api/advanced-image-detection` - Advanced image detection
- `/api/capture-asset-vision` - Capture asset vision data
- `/api/edit` - Image editing with DALL-E
- `/api/add-remix-hash` - Add remix hash to whitelist
- `/api/check-remix-hash` - Check remix hash
- `/api/_admin/remix-hashes` - Admin remix hash management
- `/api/_admin/remix-hashes-full` - Get full remix hashes
- `/api/_admin/delete-remix-hash` - Delete remix hash

## Pages Status

### ✅ Route Structure Created
- `/` - Home page (app/page.tsx)

### 🔄 Need Migration
Original pages from `app/pages-old/`:
- `/ipfi-assistant` - IP Assistant chat
- `/ip-imagine` - Image generation
- `/ip-imagine/result` - Generation results
- `/creation-result` - Creation results
- `/nft-marketplace` - NFT marketplace
- `/my-portfolio` - User portfolio
- `/settings` - Settings page
- `/history` - History page

To migrate a page:
1. Create `/app/[route]/page.tsx`
2. Convert from React Router hooks to Next.js:
   - `useNavigate()` → `useRouter()` from `next/navigation`
   - `<BrowserRouter>` → Not needed (handled by Next.js)
3. Move component to `/app/components/`
4. Update imports to use `@/` aliases

## Adding New Features

### New API Route
1. Create file: `/app/api/my-endpoint/route.ts`
2. Implement handler:
```typescript
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // Process request
    return NextResponse.json({ ok: true, data: result });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
```
3. Use from client:
```typescript
const response = await fetch('/api/my-endpoint', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
```

### New Page Route
1. Create directory: `/app/my-page/`
2. Create file: `/app/my-page/page.tsx`
3. Implement page component (Client or Server Component)
4. Navigation: Use `next/link` or `useRouter()`

## Environment Variables

Required environment variables (see `.env.local`):
- `STORY_API_KEY` - Story Protocol API key
- `OPENAI_API_KEY` - OpenAI API key
- `PINATA_JWT` - Pinata IPFS JWT
- `PINATA_GATEWAY` - Pinata gateway domain
- `NEXT_PUBLIC_PRIVY_APP_ID` - Privy app ID
- `NEXT_PUBLIC_STORY_RPC` - Story Protocol RPC URL
- `NEXT_PUBLIC_SPG_COLLECTION` - Story SPG collection address

## Production Deployment

This Next.js app can be deployed to:
- **Vercel** (recommended) - Native Next.js support
- **Netlify** - Using Functions (requires adapters)
- **Self-hosted** - Using `pnpm start` after `pnpm build`

For Netlify deployment, additional configuration in `netlify.toml` may be needed for API routes.

## Migration Notes

This project was migrated from:
- **Frontend**: Vite + React Router SPA
- **Backend**: Express.js server

All original functionality has been preserved in the API routes and components.
Some complex image processing routes are stubs that need full implementation.
