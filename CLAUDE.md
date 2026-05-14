# Mind Court — Monorepo

## Structure

```
mind-court/
├── apps/mobile/          # Expo Router app (React Native, React 19)
│   ├── app/              # File-based routes
│   │   ├── _layout.tsx   # Root layout (auth guard)
│   │   ├── index.tsx     # Entry / splash
│   │   ├── sign-in.tsx
│   │   └── coach/        # Coach-side screens (index, players, messages, profile, session/[id], thread/[id])
│   ├── components/       # BottomSheet, CreateLessonSheet, CreatePlayerSheet
│   ├── lib/auth.tsx      # Supabase auth helpers
│   └── types/
├── packages/ui/          # Shared RN component library (@mind-court/ui)
│   ├── index.ts          # Exports
│   └── tokens.ts         # Design tokens (maps to design-system CSS vars)
└── supabase/migrations/  # SQL migrations
```

## Tech

- **Mobile:** Expo SDK 54, Expo Router 6, React 19, React Native 0.81
- **Auth/DB:** Supabase (`@supabase/supabase-js`)
- **Package manager:** pnpm 11 (workspace)
- **Types:** TypeScript 5.9

## Key commands

```bash
pnpm mobile          # Start Expo dev server
pnpm mobile:ios      # iOS simulator
pnpm mobile:android  # Android emulator
```

## Design system

Design tokens live in `packages/ui/tokens.ts`. Source of truth is `~/repos/mind-court-design-system/colors_and_type.css`.

Brand: forest green primary, sand neutral, chartreuse (tennis ball) accent.
Kid Mode: bumped radii, swapped primary color, larger type. Scoped via `data-mode="kid"`.

## Conventions

- Use semantic tokens from `packages/ui/tokens.ts`, not raw values.
- File-based routing — new screens go under `apps/mobile/app/`.
- No build step for the design system (CDN-loaded React/Babel).
- Auth state managed in `lib/auth.tsx`; layout guards in `app/_layout.tsx`.
