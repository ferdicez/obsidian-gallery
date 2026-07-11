import { App, PluginSettingTab, Setting } from "obsidian";
import type GalleryPlugin from "../main";
import { deleteView, generateViewId, saveSettings, upsertView } from "../data/store";
import type { SavedGalleryView } from "../types";
import { ViewConfigModal } from "./ViewConfigModal";

export class GallerySettingsTab extends PluginSettingTab {
	constructor(app: App, private plugin: GalleryPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl("h2", { text: "Gallery" });

		new Setting(containerEl).addButton((btn) =>
			btn
				.setButtonText("+ Nova visualização")
				.setCta()
				.onClick(() => {
					new ViewConfigModal(this.app, null, async (view) => {
						view.id = generateViewId(view.name, this.plugin.settings.views);
						upsertView(this.plugin.settings, view);
						await saveSettings(this.plugin, this.plugin.settings);
						this.display();
					}).open();
				})
		);

		if (this.plugin.settings.views.length === 0) {
			containerEl.createEl("p", {
				text: "Nenhuma visualização criada ainda.",
				cls: "setting-item-description",
			});
			return;
		}

		this.plugin.settings.views.forEach((view) => {
			this.renderViewRow(containerEl, view);
		});
	}

	private renderViewRow(containerEl: HTMLElement, view: SavedGalleryView) {
		new Setting(containerEl)
			.setName(view.name)
			.setDesc(`id: ${view.id}${view.folder ? ` · pasta: ${view.folder}` : ""}`)
			.addExtraButton((btn) =>
				btn
					.setIcon("pencil")
					.setTooltip("Editar")
					.onClick(() => {
						new ViewConfigModal(this.app, view, async (updated) => {
							upsertView(this.plugin.settings, updated);
							await saveSettings(this.plugin, this.plugin.settings);
							this.display();
						}).open();
					})
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("copy")
					.setTooltip("Duplicar")
					.onClick(async () => {
						const copy: SavedGalleryView = JSON.parse(JSON.stringify(view));
						copy.name = `${view.name} (cópia)`;
						copy.id = generateViewId(copy.name, this.plugin.settings.views);
						copy.createdAt = new Date().toISOString();
						copy.updatedAt = copy.createdAt;
						upsertView(this.plugin.settings, copy);
						await saveSettings(this.plugin, this.plugin.settings);
						this.display();
					})
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("trash")
					.setTooltip("Excluir")
					.onClick(async () => {
						deleteView(this.plugin.settings, view.id);
						await saveSettings(this.plugin, this.plugin.settings);
						this.display();
					})
			);
	}
}
