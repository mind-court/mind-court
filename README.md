![Mind Court](./.github/banner.svg)

Tennis coaching and the mental game — for the coaches who run practices and the players who play matches.

Mind Court is in active development. This repository is public for transparency; the code is not open-source (see [LICENSE](./LICENSE)).

## What it is

A mobile app with two sides:

- **Coach** — schedule lessons, track players, send messages, run sessions
- **Player** — review notes from lessons, work on mental-game routines, prepare for matches

The product is built around the idea that the *coaching relationship* — not just the drills — is what helps players improve. The app is the connective tissue between sessions.

## Repository layout

This is a pnpm-managed monorepo.

```
apps/
  mobile/          Expo / React Native app (iOS + Android)
packages/
  ui/              Shared design-system components (@mind-court/ui)
supabase/
  migrations/      Database schema, in order
```

Related repos in the [Mind Court org](https://github.com/mind-court):
- [`mind-court-design-system`](https://github.com/mind-court/mind-court-design-system) — design tokens, component previews

## Stack

- **Mobile:** Expo (SDK 54) + React Native 0.81 + Expo Router
- **Language:** TypeScript
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Tooling:** pnpm workspaces

## Status

Pre-launch. The coach side is the current focus; the player side follows.

—

Questions, licensing, partnership: [bensmith0124@gmail.com](mailto:bensmith0124@gmail.com)
