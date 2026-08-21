import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// The teach workspace lives at ./course/ (project root). At build time the
// current working directory is the project root, so resolve from there.
const courseRoot = join(process.cwd(), 'course');

export function readCourseFile(rel: string): string {
	const path = join(courseRoot, rel);
	if (!existsSync(path)) return '';
	return readFileSync(path, 'utf-8');
}
