export const base = import.meta.env.BASE_URL;

// Site-internal URL helper — prefixes the GitHub Pages base path.
export function url(path: string): string {
	return `${base}${path.replace(/^\//, '')}`;
}
