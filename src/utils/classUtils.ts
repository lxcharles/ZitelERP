import { ClassRoom } from '../types';

/**
 * Utility functions for school class naming rules:
 * - Default to the level name without alphabet attached (e.g. "Basic 1", "Basic 2", "JSS 1", "SS 1").
 * - A or B or specific section alphabet is only attached if there are MULTIPLE classes in the same level
 *   in that branch (or if an explicit track stream like "Science" or "Arts & Commercial" is specified).
 */

/**
 * Strips default single-arm alphabets (e.g. "Basic 1A" -> "Basic 1", "Primary 3A" -> "Primary 3", "JSS 2A" -> "JSS 2")
 * unless it's a specialized multi-word stream (like "SS 1 Science" or "Basic 1B").
 */
export function cleanClassName(rawName: string): string {
  if (!rawName) return '';
  const trimmed = rawName.trim();

  // If it's a default "A" suffix or "A (Optional)" or "A (Ijegun)" etc. on standard levels:
  // e.g. "Basic 1A" -> "Basic 1", "Primary 3A" -> "Primary 3", "JSS 1A" -> "JSS 1", "SSS 1A" -> "SS 1"
  const defaultSingleArmPattern = /^(Basic\s+\d+|Primary\s+\d+|JSS\s+\d+|SSS\s+\d+|SS\s+\d+|Grade\s+\d+|Year\s+\d+)A(\s*\(.*\))?$/i;
  const match = trimmed.match(defaultSingleArmPattern);
  if (match) {
    let base = match[1];
    if (base.toUpperCase().startsWith('SSS ')) {
      base = base.replace(/SSS/i, 'SS');
    }
    return base;
  }

  return trimmed;
}

/**
 * Computes the correct class name based on the level, section, and whether multiple classes exist in that level.
 * @param levelName - e.g. "Basic 1", "JSS 2", "SS 1"
 * @param section - e.g. "A", "B", "Science", "Single Arm", ""
 * @param siblingCountInLevel - number of classes in the same level and branch (defaults to 1)
 */
export function computeClassName(
  levelName: string,
  section?: string,
  siblingCountInLevel: number = 1
): string {
  const cleanLevel = cleanClassName(levelName);
  const sec = section ? section.trim() : '';

  // If no section or default/empty section
  if (!sec || sec === 'A' || sec === 'A (Optional)' || sec.toLowerCase() === 'single arm' || sec.toLowerCase() === 'none') {
    // If only 1 class in this level, no alphabet attached!
    if (siblingCountInLevel <= 1) {
      return cleanLevel;
    }
    // Multiple classes in level -> attach 'A'
    return `${cleanLevel}A`;
  }

  // If section is a single letter like 'B', 'C', 'D'
  if (/^[A-Za-z]$/.test(sec)) {
    if (sec.toUpperCase() === 'A' && siblingCountInLevel <= 1) {
      return cleanLevel;
    }
    return `${cleanLevel}${sec.toUpperCase()}`;
  }

  // If section is a named track/stream (e.g. "Science", "Arts & Commercial", "Commercial")
  if (cleanLevel.toLowerCase().includes(sec.toLowerCase())) {
    return cleanLevel;
  }
  return `${cleanLevel} ${sec}`;
}

/**
 * Checks if a specific level has multiple class sections in a branch.
 */
export function hasMultipleArmsInLevel(
  levelOrGrade: string | number,
  branchId: string | undefined,
  allClasses: ClassRoom[]
): boolean {
  const matches = allClasses.filter(c => {
    if (branchId && c.branchId && c.branchId !== branchId) return false;
    if (typeof levelOrGrade === 'number') {
      return c.gradeLevel === levelOrGrade;
    }
    const cleanLvl = cleanClassName(levelOrGrade).toLowerCase();
    const cLvl = cleanClassName(c.levelName || c.name).toLowerCase();
    return cLvl === cleanLvl || c.name.toLowerCase().startsWith(cleanLvl);
  });
  return matches.length > 1;
}

/**
 * Normalizes all classes in an array so single-class levels do not have 'A' suffixes.
 */
export function normalizeClassList(classes: ClassRoom[]): ClassRoom[] {
  // Group by branchId and gradeLevel / levelName
  const counts = new Map<string, number>();
  for (const c of classes) {
    const key = `${c.branchId || 'default'}_${c.gradeLevel || cleanClassName(c.levelName || c.name)}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  }

  return classes.map(c => {
    const key = `${c.branchId || 'default'}_${c.gradeLevel || cleanClassName(c.levelName || c.name)}`;
    const count = counts.get(key) || 1;
    const baseLevel = c.levelName || cleanClassName(c.name);
    const resolvedName = computeClassName(baseLevel, c.section, count);
    
    return {
      ...c,
      name: resolvedName,
      levelName: cleanClassName(c.levelName || baseLevel),
    };
  });
}
