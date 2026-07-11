import type { App, TFile } from "obsidian";
import type { SavedGalleryView } from "../types";

export function resolveFilesForView(app: App, view: SavedGalleryView): TFile[] {
	const folder = view.folder?.trim();
	const filter = view.propertyFilter;
	const hasPropertyFilter = !!filter?.key?.trim();

	return app.vault.getMarkdownFiles().filter((file) => {
		if (folder && !isInFolder(file.path, folder)) {
			return false;
		}

		if (hasPropertyFilter) {
			const frontmatter = app.metadataCache.getFileCache(file)?.frontmatter;
			const value = frontmatter?.[filter!.key];
			if (String(value ?? "") !== filter!.value) {
				return false;
			}
		}

		return true;
	});
}

function isInFolder(filePath: string, folder: string): boolean {
	const normalized = folder.replace(/\/+$/, "");
	return filePath === normalized || filePath.startsWith(`${normalized}/`);
}
