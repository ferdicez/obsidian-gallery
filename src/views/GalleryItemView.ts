import { ItemView, WorkspaceLeaf } from "obsidian";
import { GalleryRenderer } from "../render/GalleryRenderer";
import type GalleryPlugin from "../main";
import type { SavedGalleryView } from "../types";

export const GALLERY_VIEW_TYPE = "gallery-view";

type GalleryViewState = Record<string, unknown> & { viewId?: string };

export class GalleryItemView extends ItemView {
	private renderer: GalleryRenderer | null = null;
	private savedView: SavedGalleryView | null = null;

	constructor(leaf: WorkspaceLeaf, private plugin: GalleryPlugin) {
		super(leaf);
	}

	getViewType(): string {
		return GALLERY_VIEW_TYPE;
	}

	getDisplayText(): string {
		return this.savedView ? this.savedView.name : "Gallery";
	}

	getIcon(): string {
		return "layout-grid";
	}

	async setState(state: GalleryViewState, result: unknown): Promise<void> {
		const found = this.plugin.settings.views.find((v) => v.id === state?.viewId);
		this.savedView = found ?? null;
		this.draw();
		await super.setState(state, result as any);
	}

	getState(): GalleryViewState {
		return { viewId: this.savedView?.id };
	}

	async onOpen(): Promise<void> {
		this.draw();
	}

	async onClose(): Promise<void> {
		this.renderer?.destroy();
		this.renderer = null;
	}

	private draw(): void {
		this.renderer?.destroy();
		const container = this.contentEl;
		container.empty();
		container.addClass("gallery-item-view");

		if (!this.savedView) {
			container.createEl("p", {
				cls: "gallery-empty-state",
				text: "Nenhuma visualização selecionada.",
			});
			return;
		}

		this.renderer = new GalleryRenderer(this.app, this.savedView, container);
		this.renderer.render();
	}
}
