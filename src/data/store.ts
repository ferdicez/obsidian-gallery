import type { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, type GallerySettings, type SavedGalleryView } from "../types";

export async function loadSettings(plugin: Plugin): Promise<GallerySettings> {
	const data = await plugin.loadData();
	return Object.assign({}, DEFAULT_SETTINGS, data);
}

export async function saveSettings(plugin: Plugin, settings: GallerySettings): Promise<void> {
	await plugin.saveData(settings);
}

export function generateViewId(name: string, existing: SavedGalleryView[]): string {
	const slugBase = name
		.toLowerCase()
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "") || "view";

	let slug = slugBase;
	let suffix = 1;
	while (existing.some((v) => v.id === slug)) {
		suffix += 1;
		slug = `${slugBase}-${suffix}`;
	}
	return slug;
}

export function upsertView(settings: GallerySettings, view: SavedGalleryView): void {
	const index = settings.views.findIndex((v) => v.id === view.id);
	if (index >= 0) {
		settings.views[index] = view;
	} else {
		settings.views.push(view);
	}
}

export function deleteView(settings: GallerySettings, id: string): void {
	settings.views = settings.views.filter((v) => v.id !== id);
}
