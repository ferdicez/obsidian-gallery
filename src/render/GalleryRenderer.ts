import type { App, TFile } from "obsidian";
import { resolveFilesForView } from "../query/queryEngine";
import { readFrontmatter, writeFrontmatterField } from "../frontmatter/frontmatterIO";
import { renderCard } from "./CardComponent";
import { DEFAULT_APPEARANCE, type SavedGalleryView } from "../types";

export class GalleryRenderer {
	private gridEl: HTMLElement | null = null;
	private lastCommitted = new Map<string, unknown>();

	constructor(private app: App, private view: SavedGalleryView, private hostEl: HTMLElement) {}

	render(): void {
		this.hostEl.empty();

		if (this.view.displayedFields.length === 0 && !this.view.folder && !this.view.propertyFilter?.key) {
			this.hostEl.createEl("p", {
				cls: "gallery-empty-state",
				text: "Esta visualização ainda não tem filtro nem campos configurados.",
			});
		}

		this.gridEl = this.hostEl.createDiv({ cls: "gallery-grid" });
		const cardMinWidth = this.view.appearance?.cardMinWidth ?? DEFAULT_APPEARANCE.cardMinWidth;
		this.gridEl.style.gridTemplateColumns = `repeat(auto-fill, minmax(${cardMinWidth}px, 1fr))`;

		const files = resolveFilesForView(this.app, this.view);

		if (files.length === 0) {
			this.gridEl.createEl("p", {
				cls: "gallery-empty-state",
				text: "Nenhuma nota encontrada para este filtro.",
			});
			return;
		}

		files.forEach((file) => {
			this.renderOneCard(file);
		});
	}

	/** Re-renderiza só se o arquivo ainda faz parte do filtro atual; usado em reação a eventos externos. */
	updateFile(file: TFile): void {
		if (!this.gridEl) return;

		const stillMatches = resolveFilesForView(this.app, this.view).some((f) => f.path === file.path);
		if (!stillMatches) {
			this.render();
			return;
		}

		const key = file.path;
		const frontmatter = readFrontmatter(this.app, file);
		const relevantKeys = this.view.displayedFields.map((f) => f.key);
		const changed = relevantKeys.some((k) => {
			const trackedKey = `${key}::${k}`;
			return this.lastCommitted.get(trackedKey) !== frontmatter?.[k];
		});
		if (!changed) return;

		this.render();
	}

	private renderOneCard(file: TFile): void {
		const frontmatter = readFrontmatter(this.app, file);
		const card = renderCard(file, this.view, frontmatter, {
			onFieldCommit: async (targetFile, fieldKey, newValue) => {
				this.lastCommitted.set(`${targetFile.path}::${fieldKey}`, newValue);
				await writeFrontmatterField(this.app, targetFile, fieldKey, newValue);
			},
			onOpenNote: (targetFile) => {
				this.app.workspace.getLeaf(false).openFile(targetFile);
			},
		});
		this.gridEl!.appendChild(card);
	}

	destroy(): void {
		this.hostEl.empty();
		this.gridEl = null;
		this.lastCommitted.clear();
	}
}
