// Single source of truth: re-export the original app's types so the two
// frontends can never drift. The data model lives in one place
// (pride-index/src/lib/types.ts).
export * from '../../../pride-index/src/lib/types';
