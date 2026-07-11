import { App, Modal, Setting } from "obsidian";
import { DEFAULT_APPEARANCE, DEFAULT_BADGE_COLOR, type DisplayedField, type FieldRowLayout, type FieldType, type HorizontalAlign, type SavedGalleryView, type TopBarPosition, type ValueBadgeShape } from "../types";
import { IconPickerControl } from "./IconPickerControl";

const FIELD_TYPES: FieldType[] = ["text", "number", "date", "select", "list", "checkbox"];
const BADGE_SHAPE_OPTIONS: Record<ValueBadgeShape, string> = {
	none: "Sem destaque",
	pill: "Pilulazinha",
	rectangle: "Retângulo",
};
const ALIGN_OPTIONS: Record<HorizontalAlign, string> = {
	left: "Esquerda",
	center: "Centro",
	right: "Direita",
};
const FIELD_ROW_LAYOUT_OPTIONS: Record<FieldRowLayout, string> = {
	"justify-between": "Justificado (extremidades opostas)",
	"grouped-left": "Agrupado à esquerda",
	"grouped-center": "Agrupado ao centro",
	"grouped-right": "Agrupado à direita",
};
const TOP_BAR_POSITION_OPTIONS: Record<TopBarPosition, string> = {
	top: "Em cima",
	left: "Do lado esquerdo",
	right: "Do lado direito",
};

export class ViewConfigModal extends Modal {
	private draft: SavedGalleryView;

	constructor(
		app: App,
		existing: SavedGalleryView | null,
		private onSubmit: (view: SavedGalleryView) => void
	) {
		super(app);
		this.draft = existing
			? JSON.parse(JSON.stringify(existing))
			: {
					id: "",
					name: "",
					folder: "",
					propertyFilter: { key: "", value: "" },
					titleField: "",
					displayedFields: [],
					createdAt: new Date().toISOString(),
					updatedAt: new Date().toISOString(),
			  };
		this.draft.appearance = { ...DEFAULT_APPEARANCE, ...this.draft.appearance };
	}

	onOpen() {
		this.render();
	}

	onClose() {
		this.contentEl.empty();
	}

	private render() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl("h2", {
			text: this.draft.id ? "Editar visualização" : "Nova visualização",
		});

		new Setting(contentEl)
			.setName("Nome")
			.setDesc("Ex.: Galeria de Clientes")
			.addText((text) =>
				text.setValue(this.draft.name).onChange((value) => {
					this.draft.name = value;
				})
			);

		new Setting(contentEl)
			.setName("ID")
			.setDesc(
				"Usado no embed (view: <id>). Deixe vazio para gerar automaticamente pelo nome. " +
					"Se mudar o ID de uma visualização já embutida em notas, atualize também os blocos que a usam."
			)
			.addText((text) =>
				text
					.setPlaceholder("automático pelo nome")
					.setValue(this.draft.id)
					.onChange((value) => {
						this.draft.id = value;
					})
			);

		new Setting(contentEl)
			.setName("Pasta")
			.setDesc("Filtra notas dentro desta pasta (e subpastas). Deixe vazio para todo o vault.")
			.addText((text) =>
				text.setValue(this.draft.folder ?? "").onChange((value) => {
					this.draft.folder = value;
				})
			);

		new Setting(contentEl)
			.setName("Filtro de propriedade")
			.setDesc("Chave do frontmatter (ex.: especificacao)")
			.addText((text) =>
				text
					.setPlaceholder("chave")
					.setValue(this.draft.propertyFilter?.key ?? "")
					.onChange((value) => {
						this.draft.propertyFilter = {
							key: value,
							value: this.draft.propertyFilter?.value ?? "",
						};
					})
			)
			.addText((text) =>
				text
					.setPlaceholder("valor")
					.setValue(this.draft.propertyFilter?.value ?? "")
					.onChange((value) => {
						this.draft.propertyFilter = {
							key: this.draft.propertyFilter?.key ?? "",
							value,
						};
					})
			);

		new Setting(contentEl)
			.setName("Usar alias como título do card")
			.setDesc("Usa o primeiro alias da nota. Se a nota não tiver alias, usa o nome do arquivo.")
			.addToggle((toggle) =>
				toggle.setValue(this.draft.useAliasAsTitle ?? false).onChange((value) => {
					this.draft.useAliasAsTitle = value;
				})
			);

		new Setting(contentEl)
			.setName("Campo de título do card")
			.setDesc("Propriedade usada como título. Deixe vazio para usar o nome do arquivo. Ignorado se \"Usar alias\" estiver ligado.")
			.addText((text) =>
				text.setValue(this.draft.titleField ?? "").onChange((value) => {
					this.draft.titleField = value;
				})
			);

		contentEl.createEl("h3", { text: "Campos exibidos no card" });
		const fieldsContainer = contentEl.createDiv();
		this.renderFields(fieldsContainer);

		new Setting(contentEl).addButton((btn) =>
			btn.setButtonText("+ Adicionar campo").onClick(() => {
				this.draft.displayedFields.push({ key: "", type: "text" });
				this.renderFields(fieldsContainer);
			})
		);

		contentEl.createEl("h3", { text: "Aparência" });
		this.renderAppearanceSection(contentEl);

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Salvar")
					.setCta()
					.onClick(() => {
						if (!this.draft.name.trim()) {
							return;
						}
						this.draft.updatedAt = new Date().toISOString();
						this.onSubmit(this.draft);
						this.close();
					})
			)
			.addButton((btn) =>
				btn.setButtonText("Cancelar").onClick(() => {
					this.close();
				})
			);
	}

	private renderAppearanceSection(container: HTMLElement) {
		const appearance = this.draft.appearance!;

		new Setting(container)
			.setName("Largura mínima do card")
			.setDesc("O grid encaixa o máximo de colunas possível respeitando essa largura (em pixels).")
			.addSlider((slider) =>
				slider
					.setLimits(140, 400, 10)
					.setValue(appearance.cardMinWidth)
					.setDynamicTooltip()
					.onChange((value) => {
						appearance.cardMinWidth = value;
					})
			);

		new Setting(container).setName("Alinhamento do título").addDropdown((dropdown) => {
			Object.entries(ALIGN_OPTIONS).forEach(([value, label]) => dropdown.addOption(value, label));
			dropdown.setValue(appearance.titleAlign).onChange((value) => {
				appearance.titleAlign = value as HorizontalAlign;
			});
		});

		new Setting(container)
			.setName("Layout do campo (label + valor)")
			.setDesc("Justificado deixa o máximo de espaço entre os dois. Agrupado mantém os dois colados.")
			.addDropdown((dropdown) => {
				Object.entries(FIELD_ROW_LAYOUT_OPTIONS).forEach(([value, label]) => dropdown.addOption(value, label));
				dropdown.setValue(appearance.fieldRowLayout).onChange((value) => {
					appearance.fieldRowLayout = value as FieldRowLayout;
				});
			});

		new Setting(container)
			.setName("Cor de fundo do card")
			.addColorPicker((picker) =>
				picker.setValue(appearance.cardBackgroundColor ?? "#888888").onChange((value) => {
					appearance.cardBackgroundColor = value;
				})
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("rotate-ccw")
					.setTooltip("Restaurar padrão")
					.onClick(() => {
						appearance.cardBackgroundColor = undefined;
						this.render();
					})
			);

		new Setting(container)
			.setName("Cor da borda do card")
			.addColorPicker((picker) =>
				picker.setValue(appearance.cardBorderColor ?? "#888888").onChange((value) => {
					appearance.cardBorderColor = value;
				})
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("rotate-ccw")
					.setTooltip("Restaurar padrão")
					.onClick(() => {
						appearance.cardBorderColor = undefined;
						this.render();
					})
			);

		new Setting(container)
			.setName("Cor do título")
			.addColorPicker((picker) =>
				picker.setValue(appearance.titleColor ?? "#888888").onChange((value) => {
					appearance.titleColor = value;
				})
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("rotate-ccw")
					.setTooltip("Restaurar padrão")
					.onClick(() => {
						appearance.titleColor = undefined;
						this.render();
					})
			);

		new Setting(container)
			.setName("Cor das propriedades")
			.setDesc("Cor do texto do rótulo e do valor das propriedades exibidas no card.")
			.addColorPicker((picker) =>
				picker.setValue(appearance.fieldTextColor ?? "#888888").onChange((value) => {
					appearance.fieldTextColor = value;
				})
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("rotate-ccw")
					.setTooltip("Restaurar padrão")
					.onClick(() => {
						appearance.fieldTextColor = undefined;
						this.render();
					})
			);

		new Setting(container)
			.setName("Barra colorida de destaque")
			.setDesc("Deixe em branco (restaurar padrão) para não mostrar a barra.")
			.addColorPicker((picker) =>
				picker.setValue(appearance.topBarColor ?? "#888888").onChange((value) => {
					appearance.topBarColor = value;
				})
			)
			.addExtraButton((btn) =>
				btn
					.setIcon("rotate-ccw")
					.setTooltip("Remover barra")
					.onClick(() => {
						appearance.topBarColor = undefined;
						this.render();
					})
			);

		new Setting(container).setName("Posição da barra").addDropdown((dropdown) => {
			Object.entries(TOP_BAR_POSITION_OPTIONS).forEach(([value, label]) => dropdown.addOption(value, label));
			dropdown.setValue(appearance.topBarPosition).onChange((value) => {
				appearance.topBarPosition = value as TopBarPosition;
			});
		});

		new Setting(container)
			.setName("Espessura da barra")
			.setDesc("Bem grossa (barra no topo) faz o nome do cliente aparecer por cima dela.")
			.addSlider((slider) =>
				slider
					.setLimits(2, 60, 2)
					.setValue(appearance.topBarThickness)
					.setDynamicTooltip()
					.onChange((value) => {
						appearance.topBarThickness = value;
					})
			);
	}

	private renderFields(container: HTMLElement) {
		container.empty();
		this.draft.displayedFields.forEach((field, index) => {
			this.renderFieldRow(container, field, index);
		});
	}

	private renderFieldRow(container: HTMLElement, field: DisplayedField, index: number) {
		const fieldBlock = container.createDiv({ cls: "gallery-field-block" });

		const row = new Setting(fieldBlock)
			.addText((text) =>
				text
					.setPlaceholder("propriedade")
					.setValue(field.key)
					.onChange((value) => {
						field.key = value;
					})
			)
			.addText((text) =>
				text
					.setPlaceholder("rótulo (opcional)")
					.setValue(field.label ?? "")
					.onChange((value) => {
						field.label = value;
					})
			)
			.addDropdown((dropdown) => {
				FIELD_TYPES.forEach((type) => dropdown.addOption(type, type));
				dropdown.setValue(field.type).onChange((value) => {
					field.type = value as FieldType;
					this.renderFields(container);
				});
			});

		if (field.type === "select") {
			row.addText((text) =>
				text
					.setPlaceholder("opções separadas por vírgula")
					.setValue((field.selectOptions ?? []).join(", "))
					.onChange((value) => {
						field.selectOptions = value
							.split(",")
							.map((v) => v.trim())
							.filter(Boolean);
					})
			);
		}

		row.addToggle((toggle) =>
			toggle
				.setTooltip("Esconder rótulo (mostrar só o valor)")
				.setValue(field.hideLabel ?? false)
				.onChange((value) => {
					field.hideLabel = value;
				})
		);

		row.addExtraButton((btn) =>
			btn
				.setIcon("trash")
				.setTooltip("Remover campo")
				.onClick(() => {
					this.draft.displayedFields.splice(index, 1);
					this.renderFields(container);
				})
		);

		new IconPickerControl(fieldBlock, field.icon, (icon) => {
			field.icon = icon;
		});

		const badgeContainer = fieldBlock.createDiv();
		this.renderBadgeSection(badgeContainer, field);
	}

	private renderBadgeSection(container: HTMLElement, field: DisplayedField) {
		container.empty();

		new Setting(container).setName("Destaque de cor do valor").addDropdown((dropdown) => {
			Object.entries(BADGE_SHAPE_OPTIONS).forEach(([value, label]) => dropdown.addOption(value, label));
			dropdown.setValue(field.badgeShape ?? "none").onChange((value) => {
				field.badgeShape = value as ValueBadgeShape;
				this.renderBadgeSection(container, field);
			});
		});

		if ((field.badgeShape ?? "none") === "none") {
			return;
		}

		if (field.type === "list") {
			this.renderTagColorEditor(container, field);
		} else {
			new Setting(container).setName("Cor do destaque").addColorPicker((picker) =>
				picker.setValue(field.badgeColor ?? DEFAULT_BADGE_COLOR).onChange((value) => {
					field.badgeColor = value;
				})
			);
		}
	}

	private renderTagColorEditor(container: HTMLElement, field: DisplayedField) {
		const values = this.collectKnownTagValues(field.key);
		if (!values.length) {
			container.createEl("p", {
				cls: "setting-item-description",
				text: "Nenhuma tag encontrada ainda para esta propriedade nas notas filtradas.",
			});
			return;
		}

		field.valueColors = field.valueColors ?? {};
		values.forEach((value) => {
			new Setting(container).setName(value).addColorPicker((picker) =>
				picker.setValue(field.valueColors![value] ?? DEFAULT_BADGE_COLOR).onChange((color) => {
					field.valueColors![value] = color;
				})
			);
		});
	}

	private collectKnownTagValues(key: string): string[] {
		if (!key) return [];
		const values = new Set<string>();
		const files = this.app.vault.getMarkdownFiles();
		for (const file of files) {
			const fm = this.app.metadataCache.getFileCache(file)?.frontmatter;
			const raw = fm?.[key];
			if (Array.isArray(raw)) {
				raw.forEach((v) => values.add(String(v).trim()));
			} else if (typeof raw === "string" && raw.trim()) {
				raw.split(",").forEach((v) => values.add(v.trim()));
			}
		}
		values.delete("");
		return Array.from(values).sort();
	}
}
