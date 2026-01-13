# PROJECT KNOWLEDGE BASE

**Generated:** 2026-01-14T00:44:56+02:00
**Commit:** 6600a88
**Branch:** main

## OVERVIEW
Bun + TypeScript monorepo for the `beskyd` core library; research and spec materials live under `docs/` with `SPEC.md` as the engineering source of truth.

## STRUCTURE
```
./
├── packages/
│   └── beskyd/          # Core library package
├── docs/                # Dissertation + article materials
├── SPEC.md              # Project spec and phase plan
├── package.json         # Workspace scripts
├── biome.json           # Lint/format rules
├── tsconfig.json        # Root TypeScript config
└── vitest.config.ts     # Test configuration
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Project requirements | `SPEC.md` | Single source of truth for phases and API design |
| Core library API | `packages/beskyd/src/index.ts` | Public exports live here |
| Tooling rules | `biome.json` | Formatter/linter configuration |
| TypeScript settings | `tsconfig.json` | Strict mode, noEmit |
| Package overrides | `packages/beskyd/tsconfig.json` | Extends root config |
| Test config | `vitest.config.ts` | Test include patterns |
| Research docs | `docs/phd/phd.md` | Dissertation (Ukrainian) |
| Article | `docs/article_4/article_4.md` | Related publication |
| Example dataset | `docs/expert_evaluation.xlsx` | Used for fixture shape |

## CONVENTIONS
- Tooling uses **Biome** (not ESLint/Prettier) with 2-space indent, 100 line width, double quotes.
- TypeScript is strict and `noEmit` is enabled.
- Tests (when added) should follow `packages/**/src/**/*.{test,spec}.ts(x)` per `vitest.config.ts`.
- Root documentation is in `SPEC.md` (no README present).

## ANTI-PATTERNS (THIS PROJECT)
- Barrel export files are not allowed.

## UNIQUE STYLES
- Bun workspaces with package-level `tsconfig.json` and `biome.json` extending root.

## COMMANDS
```bash
bun install
bun run lint
bun run lint:fix
bun run format
bun run test
bun run test:run
bun run typecheck
```

## NOTES
- `packages/beskyd/src/index.ts` currently exports nothing; treat it as the library entry point.
