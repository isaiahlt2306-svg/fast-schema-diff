export type DiffType = 'added' | 'removed' | 'changed';

export interface SchemaDiff {
  path: string;
  type: DiffType;
  oldValue?: unknown;
  newValue?: unknown;
  breaking: boolean;
}

const isObject = (val: unknown): val is Record<string, unknown> =>
  typeof val === 'object' && val !== null && !Array.isArray(val);

/**
 * Recursively compares two JSON Schema objects and flags breaking changes.
 */
export function diffSchemas(
  base: Record<string, unknown>,
  target: Record<string, unknown>,
  parentPath = ''
): SchemaDiff[] {
  const diffs: SchemaDiff[] = [];
  const allKeys = new Set([...Object.keys(base), ...Object.keys(target)]);

  for (const key of allKeys) {
    const path = parentPath ? `${parentPath}.${key}` : key;
    const inBase = key in base;
    const inTarget = key in target;

    if (inBase && !inTarget) {
      diffs.push({
        path,
        type: 'removed',
        oldValue: base[key],
        breaking: true,
      });
    } else if (!inBase && inTarget) {
      diffs.push({
        path,
        type: 'added',
        newValue: target[key],
        breaking: key === 'required',
      });
    } else if (isObject(base[key]) && isObject(target[key])) {
      diffs.push(...diffSchemas(base[key], target[key], path));
    } else if (JSON.stringify(base[key]) !== JSON.stringify(target[key])) {
      diffs.push({
        path,
        type: 'changed',
        oldValue: base[key],
        newValue: target[key],
        breaking: key === 'type' || key === 'required',
      });
    }
  }

  return diffs;
}
