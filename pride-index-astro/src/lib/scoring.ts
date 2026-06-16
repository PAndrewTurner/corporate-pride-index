// Single source of truth: re-export the original app's scoring module so the
// published methodology, the build-time validation, and both frontends all
// use the exact same arithmetic (pride-index/src/lib/scoring.ts).
export * from '../../../pride-index/src/lib/scoring';
