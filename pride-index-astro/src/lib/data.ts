// Single source of truth: re-export the original app's data layer. The
// underlying module imports pride-index/src/data/index-data.json — the one
// JSON regenerated and validated from the workbook by the ingest pipeline at
// build time (see this app's prebuild script). No copied snapshot lives here.
export * from '../../../pride-index/src/lib/data';
