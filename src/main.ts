import { FuzzySuggestModal, Notice, Plugin, WorkspaceLeaf } from "obsidian";
import { loadSettings, saveSettings } from "./data/store";
import { GallerySettingsTab } from "./settings/SettingsTab";
import { GALLERY_VIEW_TYPE, GalleryItemView } from "./views/GalleryItemView";
import { GalleryCodeBlockChild } from "./codeblock/GalleryCodeBlockChild";
import { parseBlockSource } from "./codeblock/parseBlockSource";
import { buildGalleryLivePreviewExtension } from "./codeblock/liveviewPlugin";
import type { GallerySettings, SavedGalleryView } from "./types";

export const GALLERY_CODEBLOCK_LANGUAGE = "gallery";

class ViewPickerModal extends FuzzySuggestModal<SavedGalleryView> {
	constructor(private plugin: GalleryPlugin) {
		super(plugin.app);
	}

	getItems(): SavedGalleryView[] {
		return this.plugin.settings.views;
	}

	getItemText(view: SavedGalleryView): string {
		return view.name;
	}

	onChooseItem(view: SavedGalleryView): void {
		this.plugin.activateGalleryView(view.id);
	}
}

export default class GalleryPlugin extends Plugin {
	settings!: GallerySettings;

	async onload() {
		this.settings = await loadSettings(this);
		this.addSettingTab(new GallerySettingsTab(this.app, this));

		this.registerView(GALLERY_VIEW_TYPE, (leaf) => new GalleryItemView(leaf, this));

		this.registerMarkdownCodeBlockProcessor(GALLERY_CODEBLOCK_LANGUAGE, (source, el, ctx) => {
			const { viewId } = parseBlockSource(source);
			const savedView = this.settings.views.find((v) => v.id === viewId);

			if (!savedView) {
				el.createEl("p", {
					cls: "gallery-empty-state",
					text: viewId
						? `Visualização "${viewId}" não encontrada.`
						: "Informe 'view: <id>' no bloco.",
				});
				return;
			}

			const child = new GalleryCodeBlockChild(el, this.app, savedView);
			ctx.addChild(child);
		});

		this.registerEditorExtension(buildGalleryLivePreviewExtension(this.app, this));

		this.addCommand({
			id: "open-gallery",
			name: "Abrir Galeria",
			callback: () => {
				if (this.settings.views.length === 0) {
					new Notice("Crie uma visualização em Configurações → Gallery primeiro.");
					return;
				}
				if (this.settings.views.length === 1) {
					this.activateGalleryView(this.settings.views[0].id);
					return;
				}
				new ViewPickerModal(this).open();
			},
		});

		new Notice("Gallery carregado");
	}

	onunload() {}

	async saveSettings() {
		await saveSettings(this, this.settings);
	}

	async activateGalleryView(viewId: string): Promise<void> {
		const { workspace } = this.app;

		const existing = workspace
			.getLeavesOfType(GALLERY_VIEW_TYPE)
			.find((leaf) => (leaf.view as unknown as GalleryItemView).getState()?.viewId === viewId);

		let leaf: WorkspaceLeaf;
		if (existing) {
			leaf = existing;
		} else {
			leaf = workspace.getLeaf("tab");
			await leaf.setViewState({ type: GALLERY_VIEW_TYPE, active: true });
		}

		await leaf.setViewState({ type: GALLERY_VIEW_TYPE, state: { viewId }, active: true });
		workspace.revealLeaf(leaf);
	}
}
