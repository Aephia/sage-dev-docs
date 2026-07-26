export function getMarkdownPath(relativePath: string): string {
	if (relativePath === 'index.md') {
		return '/index.md';
	}

	return `/${relativePath.replace(/\/index\.md$/, '.md')}`;
}
