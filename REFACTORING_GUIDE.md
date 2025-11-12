# Folder-Per-Feature Refactoring Guide

## Overview

The codebase has been refactored to follow a **folder-per-feature** architecture, where each major feature has its own organized folder with all related components, hooks, utilities, and types.

## New Structure

```
client/
├── features/                    # All feature modules
│   ├── ip-assistant/           # IP Assistant feature
│   │   ├── components/          # Feature-specific components
│   │   │   ├── ChatHeaderActions.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   ├── WelcomeScreen.tsx
│   │   ���   └── ...
│   │   ├── lib/                # Feature-specific utilities & types
│   │   │   ├── types.ts        # Feature types
│   │   │   ├── constants.ts    # Feature constants
│   │   │   ├── utils.ts        # Feature utilities
│   │   │   └── answer-details.ts
│   │   ├── hooks/              # Feature-specific hooks (for future use)
│   │   └── index.ts            # Feature barrel exports
│   │
│   ├── ip-imagine/             # IP Imagine feature
│   │   ├── components/
│   │   ├── index.ts
│   │   └── ...
│   │
│   ├── creation/               # Creation feature
│   │   ├── components/
│   │   ├── index.ts
│   │   └── ...
│   │
│   ├── remix-mode/             # Remix Mode feature
│   │   ├── components/
│   │   ├── index.ts
│   │   └── ...
│   │
│   ├── nft-marketplace/        # NFT Marketplace feature
│   │   ├── components/
│   │   ├── index.ts
│   │   └── ...
│   │
│   ├── portfolio/              # Portfolio feature
│   │   ├── components/
│   │   ├── index.ts
│   │   └── ...
│   │
│   ���── history/                # History feature
│   │   ├── components/
│   │   ├── index.ts
│   │   └── ...
│   │
│   ├── settings/               # Settings feature
│   │   ├── components/
│   │   ├── index.ts
│   │   └── ...
│   │
│   └── index.ts                # Main features entry point
│
├── shared/                     # Shared utilities
│   ├── components/            # Shared UI components (DashboardLayout, ComingSoon)
│   │   └── index.ts
│   ├── hooks/                 # Shared hooks
│   │   └── index.ts
│   ├── lib/                   # Shared utilities & lib functions
│   │   └── index.ts
│   └── ...
│
├── pages/                      # Route pages (kept for compatibility)
├── components/                 # Old structure (being phased out)
├── hooks/                      # Old structure (being phased out)
├── lib/                        # Old structure (being phased out)
└── App.tsx
```

## Importing from Features

### Using Feature Exports (Recommended)

```typescript
// ✅ Import from feature index
import {
  IpAssistant,
  ChatInput,
  getMessagePreview,
  type ChatSession,
} from "@/features/ip-assistant";

// ✅ Import from features barrel
import {
  IpImagine,
  PopularIPGrid,
  NftMarketplace,
} from "@/features";
```

### Using Shared Exports

```typescript
// ✅ Import from shared
import { DashboardLayout, Button } from "@/shared/components";
import { useGeminiGenerator, useMobile } from "@/shared/hooks";
```

### Old Import Paths (Still Work)

```typescript
// ⚠️ Still works but deprecated - prefer feature imports
import ChatInput from "@/components/ip-assistant/ChatInput";
import { ANSWER_DETAILS } from "@/lib/ip-assistant/answer-details";
```

## Migration Path

### Phase 1 (Current) ✅
- Created feature folder structure with index.ts files
- Feature index files re-export from old locations
- App.tsx updated to use feature imports
- Old code structure remains unchanged
- **Status**: No breaking changes, fully backward compatible

### Phase 2 (Planned)
- Move component files to feature folders
- Update imports in component files
- Create feature-specific hooks folders
- Move feature utilities to feature lib folders

### Phase 3 (Planned)
- Delete old `components/`, `lib/`, `hooks/` directories
- Complete migration to folder-per-feature structure
- Deprecate old import paths

## Benefits

1. **Better Organization**: Each feature is self-contained with its own components, utilities, and types
2. **Easier Navigation**: Find all related code in one folder
3. **Reduced Coupling**: Features can be more independent
4. **Scalability**: Easy to add new features following the same pattern
5. **Team Collaboration**: Clear ownership and responsibility per feature

## Adding a New Feature

To add a new feature following this pattern:

```
client/features/new-feature/
├── components/
│   ├── FeatureComponent.tsx
│   └── ...
├── lib/
│   ├── types.ts
│   ├── utils.ts
│   ├── constants.ts
│   └── ...
├── hooks/
│   ├── useFeatureHook.ts
│   └── ...
├── pages/
│   └── FeaturePage.tsx
└── index.ts
```

Then create `index.ts` with barrel exports:

```typescript
export { default as FeaturePage } from "@/pages/FeaturePage";
export { FeatureComponent } from "./components/FeatureComponent";
export { useFeatureHook } from "./hooks/useFeatureHook";
export { type FeatureType } from "./lib/types";
```

Update `client/features/index.ts` to include the new feature:

```typescript
export * from "@/features/new-feature";
```

## File Organization Guidelines

- **components/**: React components specific to the feature
- **lib/**: Constants, utilities, types, and helpers
- **hooks/**: Custom React hooks for the feature
- **pages/**: Full page components that are routes
- **index.ts**: Barrel export file - re-exports all public APIs

## Gradual Migration Notes

The refactoring was done gradually to maintain stability:
- Old file structure still exists and works
- New feature index files re-export from old locations
- No import paths were broken
- Application continues to work without any changes

As files are gradually moved to their feature folders, update imports incrementally to avoid large merge conflicts.

## Related Files

- `client/App.tsx` - Updated to import from features
- `client/features/index.ts` - Main entry point for all features
- `client/shared/` - Shared utilities and components

## Questions?

Refer to existing feature folders as examples:
- `client/features/ip-assistant/` - Most complete example
- `client/features/ip-imagine/` - Another example
