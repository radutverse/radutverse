# Next.js Migration Guide

This guide explains how to complete the page migrations and implement the remaining stub API routes.

## Page Migration Example

### Original React Router Page (client/pages/IpfiAssistant.tsx)

```typescript
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";

const IpfiAssistant = () => {
  const navigate = useNavigate();
  
  return (
    <DashboardLayout>
      {/* Content */}
    </DashboardLayout>
  );
};

export default IpfiAssistant;
```

### Converted to Next.js (app/ipfi-assistant/page.tsx)

```typescript
'use client';

import { useRouter } from 'next/navigation';
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function IpfiAssistant() {
  const router = useRouter();
  
  return (
    <DashboardLayout>
      {/* Content */}
    </DashboardLayout>
  );
}
```

### Key Changes:

1. **'use client'**: Add at the top since this uses hooks
2. **useRouter import**: Change from `'react-router-dom'` to `'next/navigation'`
3. **useRouter()**: No parameters needed - just call `const router = useRouter()`
4. **router.push(path)**: Works the same as before
5. **export default function**: Use `export default function` instead of `const ... export default`
6. **Component name**: Must match file location (IpfiAssistant in ipfi-assistant/page.tsx)

## Pages to Migrate

Create the following files from the components in `app/pages-old/`:

```
app/
├── ipfi-assistant/page.tsx        (from client/pages/IpfiAssistant.tsx)
├── ip-imagine/page.tsx             (from client/pages/IpImagine.tsx)
├── ip-imagine/result/page.tsx       (from client/pages/IpImagineCreationResult.tsx)
├── creation-result/page.tsx         (from client/pages/CreationResult.tsx)
├── nft-marketplace/page.tsx         (from client/pages/NftMarketplace.tsx)
├── my-portfolio/page.tsx            (from client/pages/MyPortfolio.tsx)
├── settings/page.tsx                (from client/pages/Settings.tsx)
├── history/page.tsx                 (from client/pages/History.tsx)
├── ip-assistant/page.tsx            (from client/pages/IpAssistant.tsx)
```

## Import Changes

All imports work the same, but make sure to update if moving components:

```typescript
// React Router hook
import { useNavigate } from "react-router-dom";
// ↓ becomes ↓
import { useRouter } from "next/navigation";

// Component imports stay the same
import DashboardLayout from "@/components/layout/DashboardLayout";
```

## API Route Implementation

### Example: Implementing `/api/describe`

The stub currently returns placeholder data. To implement it fully:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { OpenAI } from "openai";
import { getFileBuffer, parseFormData } from "@/lib/api/file-upload";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { files } = await parseFormData(request);
    const file = files.image;

    if (!file) {
      return NextResponse.json(
        { ok: false, error: "no_file" },
        { status: 400 }
      );
    }

    const buffer = await getFileBuffer(file);
    
    // Send to OpenAI Vision API for analysis
    const response = await openai.vision.analyze({
      image: buffer,
      // ... rest of implementation
    });

    return NextResponse.json({
      ok: true,
      title: response.title,
      description: response.description,
      category: response.category,
    });
  } catch (error: any) {
    console.error("[Describe] Error:", error);
    return NextResponse.json(
      { ok: false, error: "description_failed" },
      { status: 500 }
    );
  }
}
```

### File Upload Utilities

Use the `parseFormData` and `getFileBuffer` utilities from `@/lib/api/file-upload`:

```typescript
import { parseFormData, getFileBuffer } from "@/lib/api/file-upload";

// In your route handler:
const { files, fields } = await parseFormData(request);
const file = files.myfile; // Get a specific file
const buffer = await getFileBuffer(file); // Convert to Buffer
```

## API Routes to Implement

### High Priority (Complex Logic)

1. **`/api/describe`** - Image description generation
   - Uses OpenAI Vision API
   - Needs idempotency key caching
   - File size limits: 8MB

2. **`/api/upload`** - Image upload and classification
   - Complex multi-step analysis
   - Uses OpenAI models
   - Determines content category

3. **`/api/vision-image-detection`** - Vision API detection
   - Advanced image feature detection
   - Returns detected objects/categories
   - Handles edge cases

4. **`/api/generate-image`** - DALL-E image generation
   - Text to image
   - Already has basic implementation
   - May need model update

### Medium Priority

5. **`/api/check-image-similarity`** - Compare images
6. **`/api/analyze-image-vision`** - Vision API analysis
7. **`/api/advanced-image-detection`** - Complex detection
8. **`/api/capture-asset-vision`** - Asset tracking

### Admin Routes

9. **`/api/_admin/remix-hashes`** - Whitelist management
10. **`/api/_admin/delete-remix-hash`** - Delete from whitelist

## Testing API Routes

### Using cURL

```bash
# Test ping endpoint
curl http://localhost:3000/api/ping

# Test with POST and JSON
curl -X POST http://localhost:3000/api/get-suggestions \
  -H "Content-Type: application/json" \
  -d '{"input":"search dragon"}'

# Test with file upload
curl -X POST http://localhost:3000/api/upload \
  -F "image=@test.jpg"
```

### Using fetch in Browser Console

```javascript
// Test resolve-ip-name
fetch('/api/resolve-ip-name', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ipName: 'example.ip' })
})
.then(r => r.json())
.then(console.log);
```

## Development Server

Start the development server:

```bash
pnpm dev
```

Then access:
- App: http://localhost:3000
- API: http://localhost:3000/api/ping

## Build and Production

```bash
# Build for production
pnpm build

# Start production server
pnpm start
```

## Troubleshooting

### Import errors
- Make sure `@/` alias paths are correct
- Check that `app/` directory contains the files

### API route not found
- File must be at `app/api/route-name/route.ts`
- Export named functions: `export async function GET()` or `export async function POST()`

### Environment variables not working
- Check `.env.local` exists in root
- Use `NEXT_PUBLIC_` prefix for client-side vars
- Restart dev server after changing env vars

### Build fails
- Check `pnpm typecheck` for TypeScript errors
- Review error messages in build output
- Make sure all imports resolve correctly
