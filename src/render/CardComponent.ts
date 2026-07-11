import { setIcon, type TFile } from "obsidian";
import type { FieldRowLayout, HorizontalAlign, SavedGalleryView } from "../types";
import { DEFAULT_APPEARANCE, TOP_BAR_OVERLAY_THRESHOLD } from "../types";
import { renderInlineEditableField } from "./InlineEditableField";
import { stripWikilink } from "./wikilink";

export interface CardCallbacks {
	onFieldCommit: (file: TFile, key: string, newValue: unknown) => void;
	onOpenNote: (file: TFile) => void;
}

export function renderCard(
	file: TFile,
	view: SavedGalleryView,
	frontmatter: Record<string, unknown> | undefined,
	callbacks: CardCallbacks
): HTMLElement {
	const appearance = { ...DEFAULT_APPEARANCE, ...view.appearance };
	const isSideBar = appearance.topBarColor && appearance.topBarPosition !== "top";
	const card = createDiv({ cls: "gallery-card" });
	if (isSideBar) {
		card.addClass(`gallery-card--bar-${appearance.topBarPosition}`);
	}

	if (appearance.cardBackgroundColor) {
		card.style.backgroundColor = appearance.cardBackgroundColor;
	}
	if (appearance.cardBorderColor) {
		card.style.borderColor = appearance.cardBorderColor;
	}

	if (isSideBar) {
		const sideBar = createDiv({ cls: "gallery-card-sidebar" });
		sideBar.style.backgroundColor = appearance.topBarColor!;
		sideBar.style.width = `${appearance.topBarThickness}px`;
		card.appendChild(sideBar);
	}

	const contentWrapper = card.createDiv({ cls: "gallery-card-content" });

	const titleOverlaysBar =
		!!appearance.topBarColor &&
		appearance.topBarPosition === "top" &&
		appearance.topBarThickness >= TOP_BAR_OVERLAY_THRESHOLD;

	if (appearance.topBarColor && appearance.topBarPosition === "top") {
		const topBar = contentWrapper.createDiv({ cls: "gallery-card-topbar" });
		topBar.style.backgroundColor = appearance.topBarColor;
		topBar.style.height = `${appearance.topBarThickness}px`;
		if (titleOverlaysBar) {
			topBar.addClass("gallery-card-topbar--overlay");
		}
	}

	const title = resolveCardTitle(file, view, frontmatter);
	const titleEl = contentWrapper.createEl("div", { cls: "gallery-card-title", text: title });
	if (titleOverlaysBar) {
		titleEl.addClass("gallery-card-title--overlay");
		titleEl.style.height = `${appearance.topBarThickness}px`;
		titleEl.style.justifyContent = horizontalAlignToJustifyContent(appearance.titleAlign);
	}
	titleEl.style.textAlign = appearance.titleAlign;
	if (appearance.titleColor) {
		titleEl.style.color = appearance.titleColor;
	}
	titleEl.addEventListener("click", () => callbacks.onOpenNote(file));

	const fieldsEl = contentWrapper.createDiv({ cls: "gallery-card-fields" });
	if (titleOverlaysBar) {
		fieldsEl.style.marginTop = `${Math.max(appearance.topBarThickness - 12, 16)}px`;
	}
	view.displayedFields.forEach((field) => {
		if (!field.key) return;
		const row = fieldsEl.createDiv({ cls: "gallery-card-field" });
		const grouped = appearance.fieldRowLayout !== "justify-between";
		row.style.justifyContent = rowJustifyContent(appearance.fieldRowLayout);
		row.style.gap = grouped ? "6px" : "8px";
		row.style.color = appearance.fieldTextColor || "var(--text-normal)";

		if (!field.hideLabel) {
			const labelEl = row.createDiv({ cls: "gallery-card-field-label" });
			if (grouped) {
				labelEl.addClass("gallery-card-field-label--grouped");
			}
			if (field.icon) {
				const iconEl = labelEl.createSpan({ cls: "gallery-card-field-icon" });
				setIcon(iconEl, field.icon);
				labelEl.createSpan({ text: ":" });
			} else {
				labelEl.setText(`${field.label || field.key}:`);
			}
		}

		const rawValue = stripWikilink(frontmatter?.[field.key]);
		const widget = renderInlineEditableField(
			field,
			rawValue,
			(newValue) => {
				callbacks.onFieldCommit(file, field.key, newValue);
			},
			appearance.fieldTextColor
		);
		row.appendChild(widget);
	});

	return card;
}

/** Extrai o primeiro alias não-vazio de `aliases`, que no Obsidian pode ser uma lista ou uma string única. */
function firstAlias(frontmatter: Record<string, unknown> | undefined): string | null {
	const aliases = frontmatter?.["aliases"];
	const lista = Array.isArray(aliases) ? aliases : aliases != null ? [aliases] : [];
	for (const item of lista) {
		const texto = String(stripWikilink(item) ?? "").trim();
		if (texto) return texto;
	}
	return null;
}

/** Título do card: alias (se ligado e existir) > titleField (se definido) > nome do arquivo. */
function resolveCardTitle(
	file: TFile,
	view: SavedGalleryView,
	frontmatter: Record<string, unknown> | undefined
): string {
	if (view.useAliasAsTitle) {
		const alias = firstAlias(frontmatter);
		if (alias) return alias;
		// Sem alias: cai no nome do arquivo (não usa titleField pra não confundir com o comportamento esperado do toggle).
		return file.basename;
	}
	const rawTitle = view.titleField ? frontmatter?.[view.titleField] : file.basename;
	const title = String(stripWikilink(rawTitle) ?? file.basename).trim();
	return title || file.basename;
}

function horizontalAlignToJustifyContent(align: HorizontalAlign): string {
	switch (align) {
		case "center":
			return "center";
		case "right":
			return "flex-end";
		case "left":
		default:
			return "flex-start";
	}
}

function rowJustifyContent(layout: FieldRowLayout): string {
	switch (layout) {
		case "grouped-left":
			return "flex-start";
		case "grouped-center":
			return "center";
		case "grouped-right":
			return "flex-end";
		case "justify-between":
		default:
			return "space-between";
	}
}
