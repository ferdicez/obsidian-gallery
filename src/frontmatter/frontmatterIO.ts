import type { App, TFile } from "obsidian";

export function readFrontmatter(app: App, file: TFile): Record<string, unknown> | undefined {
	return app.metadataCache.getFileCache(file)?.frontmatter as Record<string, unknown> | undefined;
}

export async function writeFrontmatterField(
	app: App,
	file: TFile,
	key: string,
	value: unknown
): Promise<void> {
	await app.fileManager.processFrontMatter(file, (frontmatter) => {
		frontmatter[key] = value;
	});
}
