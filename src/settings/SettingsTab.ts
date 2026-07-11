import { App, PluginSettingTab, Setting } from "obsidian";
import type GalleryPlugin from "../main";
import { deleteView, replaceView, resolverIdEscolhido, saveSettings, upsertView } from "../data/store";
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
						view.id = resolverIdEscolhido(view.id, view.name, this.plugin.settings.views);
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
						const idAnterior = view.id;
						new ViewConfigModal(this.app, view, async (updated) => {
							// Resolve o ID digitado (vazio = automático), ignorando a própria view na checagem
							// de unicidade; replaceView localiza a entrada pelo ID antigo, então trocar o ID não duplica.
							updated.id = resolverIdEscolhido(updated.id, updated.name, this.plugin.settings.views, idAnterior);
							replaceView(this.plugin.settings, idAnterior, updated);
							await saveSettings(this.plugin, this.plugin.settings);
							this.display();
						}).open();
					})
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("copy")
					.setTooltip("Duplicar")
					.onClick(() => {
						// Abre o modal pré-preenchido para você escolher nome e ID antes de salvar a cópia.
						const copy: SavedGalleryView = JSON.parse(JSON.stringify(view));
						copy.name = `${view.name} (cópia)`;
						copy.id = ""; // vazio: você digita, ou deixa gerar automático pelo nome ao salvar
						new ViewConfigModal(this.app, copy, async (nova) => {
							nova.id = resolverIdEscolhido(nova.id, nova.name, this.plugin.settings.views);
							nova.createdAt = new Date().toISOString();
							nova.updatedAt = nova.createdAt;
							upsertView(this.plugin.settings, nova);
							await saveSettings(this.plugin, this.plugin.settings);
							this.display();
						}).open();
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
