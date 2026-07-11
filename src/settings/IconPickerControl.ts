import { getIconIds, setIcon } from "obsidian";

let cachedIconIds: string[] | null = null;

function getAllIconIds(): string[] {
	if (!cachedIconIds) {
		cachedIconIds = getIconIds().map((id) => (id.startsWith("lucide-") ? id.slice("lucide-".length) : id));
	}
	return cachedIconIds;
}

const MAX_RESULTS = 60;

/**
 * Campo de busca + grid de ícones (todos os ícones que o Obsidian suporta, via getIconIds()).
 * Digitar filtra por substring no nome do ícone; clicar num resultado seleciona e fecha a busca.
 */
export class IconPickerControl {
	private wrapperEl: HTMLElement;
	private searchInput: HTMLInputElement;
	private resultsEl: HTMLElement;
	private currentValue: string | undefined;

	constructor(
		containerEl: HTMLElement,
		initialValue: string | undefined,
		private onChange: (icon: string | undefined) => void
	) {
		this.currentValue = initialValue;
		this.wrapperEl = containerEl.createDiv({ cls: "gallery-icon-picker" });

		const previewRow = this.wrapperEl.createDiv({ cls: "gallery-icon-picker-preview" });
		const previewIcon = previewRow.createSpan({ cls: "gallery-icon-picker-preview-icon" });
		this.renderPreview(previewIcon);

		this.searchInput = previewRow.createEl("input", {
			type: "text",
			placeholder: "Buscar ícone (ex.: user, calendar, tag)...",
			cls: "gallery-icon-picker-search",
		});

		const clearBtn = previewRow.createEl("button", { text: "Sem ícone", cls: "gallery-icon-picker-clear" });
		clearBtn.addEventListener("click", () => {
			this.currentValue = undefined;
			this.searchInput.value = "";
			this.renderPreview(previewIcon);
			this.resultsEl.empty();
			this.onChange(undefined);
		});

		this.resultsEl = this.wrapperEl.createDiv({ cls: "gallery-icon-picker-results" });

		this.searchInput.addEventListener("input", () => {
			this.renderResults(this.searchInput.value.trim().toLowerCase(), previewIcon);
		});
	}

	private renderPreview(previewIcon: HTMLElement) {
		previewIcon.empty();
		if (this.currentValue) {
			setIcon(previewIcon, this.currentValue);
		}
	}

	private renderResults(query: string, previewIcon: HTMLElement) {
		this.resultsEl.empty();
		if (!query) return;

		const matches = getAllIconIds()
			.filter((id) => id.includes(query))
			.slice(0, MAX_RESULTS);

		if (matches.length === 0) {
			this.resultsEl.createEl("p", { cls: "gallery-empty-state", text: "Nenhum ícone encontrado." });
			return;
		}

		matches.forEach((iconId) => {
			const cell = this.resultsEl.createDiv({ cls: "gallery-icon-picker-cell", attr: { title: iconId } });
			setIcon(cell, iconId);
			cell.addEventListener("click", () => {
				this.currentValue = iconId;
				this.searchInput.value = iconId;
				this.renderPreview(previewIcon);
				this.resultsEl.empty();
				this.onChange(iconId);
			});
		});
	}
}
