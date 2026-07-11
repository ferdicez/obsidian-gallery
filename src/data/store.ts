import type { Plugin } from "obsidian";
import { DEFAULT_SETTINGS, type GallerySettings, type SavedGalleryView } from "../types";

export async function loadSettings(plugin: Plugin): Promise<GallerySettings> {
	const data = await plugin.loadData();
	return Object.assign({}, DEFAULT_SETTINGS, data);
}

export async function saveSettings(plugin: Plugin, settings: GallerySettings): Promise<void> {
	await plugin.saveData(settings);
}

/** Converte um texto livre num slug seguro para ID (minúsculas, sem acento, só a-z 0-9 e hífens). */
export function slugifyId(texto: string): string {
	return (
		texto
			.toLowerCase()
			.normalize("NFD")
			.replace(/[̀-ͯ]/g, "")
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)/g, "") || "view"
	);
}

export function generateViewId(name: string, existing: SavedGalleryView[]): string {
	return uniqueId(slugifyId(name), existing);
}

/** Garante que o slug não colida com IDs já usados (ignorando a própria view em edição, via ignoreId). */
export function uniqueId(slugBase: string, existing: SavedGalleryView[], ignoreId?: string): string {
	const emUso = (id: string) => existing.some((v) => v.id === id && v.id !== ignoreId);
	let slug = slugBase;
	let suffix = 1;
	while (emUso(slug)) {
		suffix += 1;
		slug = `${slugBase}-${suffix}`;
	}
	return slug;
}

/**
 * Resolve o ID final de uma view a partir do que a usuária digitou:
 * - vazio  → gera automático a partir do nome;
 * - preenchido → normaliza pra slug e garante unicidade (ignorando a própria view, em edição).
 * `idAnterior` é o ID atual da view sendo editada (para não colidir consigo mesma).
 */
export function resolverIdEscolhido(
	idDigitado: string | undefined,
	name: string,
	existing: SavedGalleryView[],
	idAnterior?: string
): string {
	const limpo = (idDigitado ?? "").trim();
	if (!limpo) return uniqueId(slugifyId(name), existing, idAnterior);
	return uniqueId(slugifyId(limpo), existing, idAnterior);
}

export function upsertView(settings: GallerySettings, view: SavedGalleryView): void {
	const index = settings.views.findIndex((v) => v.id === view.id);
	if (index >= 0) {
		settings.views[index] = view;
	} else {
		settings.views.push(view);
	}
}

/**
 * Salva uma view em edição, respeitando a troca de ID: localiza a entrada antiga pelo `idAnterior`
 * (não pelo novo id, que pode ter mudado) e a substitui no mesmo lugar — evita criar duplicata quando
 * a usuária muda o ID. Se `idAnterior` não existir mais (view nova), simplesmente insere.
 */
export function replaceView(settings: GallerySettings, idAnterior: string, view: SavedGalleryView): void {
	const index = settings.views.findIndex((v) => v.id === idAnterior);
	if (index >= 0) {
		settings.views[index] = view;
	} else {
		upsertView(settings, view);
	}
}

export function deleteView(settings: GallerySettings, id: string): void {
	settings.views = settings.views.filter((v) => v.id !== id);
}
