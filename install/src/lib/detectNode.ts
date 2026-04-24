export function detectNode(): { version: string; ok: boolean } {
  const version = process.versions.node;
  const major = parseInt(version.split('.')[0], 10);
  return { version, ok: major >= 18 };
}
