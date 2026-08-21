import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// The teach workspace lives at ./course/ (project root). At build time the
// current working directory is the project root, so resolve from there.
const courseRoot = join(process.cwd(), 'course');

export interface Lesson {
	slug: string;
	html: string;
}

export function getLesson(slug: string): Lesson | null {
	const path = join(courseRoot, 'lessons', `${slug}.html`);
	if (!existsSync(path)) {
		// Fall back to a stub so a page still renders while content is authored.
		return {
			slug,
			html: `<h1>${slug}</h1><p class="muted">This lesson is being written.</p>`,
		};
	}
	const html = readFileSync(path, 'utf-8');
	// Strip a full <html><head> wrapper if present; we only want the body.
	// Also drop any <link> to course.css — the site supplies its own styling.
	const body = (html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1] ?? html).replace(
		/<link[^>]*course\.css[^>]*>/gi,
		'',
	);
	return { slug, html: body };
}
