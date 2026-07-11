import { MarkdownRenderChild, type App, type TFile } from "obsidian";
import { GalleryRenderer } from "../render/GalleryRenderer";
import type { SavedGalleryView } from "../types";

export class GalleryCodeBlockChild extends MarkdownRenderChild {
	private renderer: GalleryRenderer | null = null;

	constructor(containerEl: HTMLElement, private app: App, private savedView: SavedGalleryView) {
		super(containerEl);
	}

	onload(): void {
		this.renderer = new GalleryRenderer(this.app, this.savedView, this.containerEl);
		this.renderer.render();

		this.registerEvent(
			this.app.metadataCache.on("changed", (file: TFile) => {
				this.renderer?.updateFile(file);
			})
		);
		this.registerEvent(
			this.app.vault.on("rename", () => {
				this.renderer?.render();
			})
		);
	}

	onunload(): void {
		this.renderer?.destroy();
		this.renderer = null;
	}
}
