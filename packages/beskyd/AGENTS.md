# AGENTS: beskyd (Core Library)

## OVERVIEW
Core TypeScript library implementing the primary logic and data structures for the Beskyd research project.

## WHERE TO LOOK
- **`src/index.ts`**: Main entry point. Public APIs, types, and classes must be exported here.
- **`package.json`**: Package scripts and metadata. `bun run test` and `bun run typecheck` live here.
- **`tsconfig.json`**: Package compiler options (rootDir `src`, outDir `dist`, strict types).
- **`biome.json`**: Extends root Biome config for lint/format.
- **`src/`**: All implementation code.

## CONVENTIONS
- **Strict typing**: avoid `any` unless justified and documented.
- **Explicit exports**: only export intended public API from `src/index.ts`.
- **Tests**: use `*.test.ts` or `*.spec.ts` under `src/`.
- **Pure library**: avoid IO and environment-specific APIs unless required.

## ANTI-PATTERNS
- Circular dependencies between `src` modules.
- Implementation files outside `src/`.
- Committing build artifacts in `dist/`.

## NOTES
- Phase 1 core library lives here; refer to root `SPEC.md` for full roadmap.
