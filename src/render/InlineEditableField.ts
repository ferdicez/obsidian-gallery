import { DEFAULT_BADGE_COLOR, type DisplayedField } from "../types";
import { readableTextColor } from "./contrastColor";
import { createFieldWidget } from "./fieldWidgets";
import { formatDisplayValue, toListValues } from "./formatDisplayValue";

/**
 * Renderiza um valor como texto puro (clicável); ao clicar, troca pelo widget
 * de edição do fieldWidgets.ts. Ao perder o foco (blur/Enter/change), volta a
 * mostrar o texto com o novo valor. Checkbox foge à regra: é sempre interativo,
 * já que alternar um booleano não precisa de um passo intermediário de "editar".
 */
export function renderInlineEditableField(
	field: DisplayedField,
	rawValue: unknown,
	onCommit: (newValue: unknown) => void,
	fieldTextColor?: string
): HTMLElement {
	const wrapper = createDiv({ cls: "gallery-field-value-wrapper" });

	if (field.type === "checkbox") {
		wrapper.appendChild(createFieldWidget(field, rawValue, onCommit));
		return wrapper;
	}

	let currentValue = rawValue;

	const showText = () => {
		wrapper.empty();
		const shape = field.badgeShape ?? "none";

		const listValues = field.type === "list" ? toListValues(currentValue) : [];
		if (shape !== "none" && field.type === "list" && listValues.length) {
			const badgeRow = wrapper.createDiv({ cls: "gallery-field-badge-row" });
			listValues.forEach((text) => {
				const badge = badgeRow.createEl("span", {
					cls: `gallery-field-badge gallery-field-badge--${shape}`,
					text,
				});
				const color = field.valueColors?.[text] ?? DEFAULT_BADGE_COLOR;
				badge.style.backgroundColor = color;
				badge.style.color = fieldTextColor || readableTextColor(color);
				badge.addEventListener("click", showEditor);
			});
			return;
		}

		const span = wrapper.createEl("span", {
			cls: "gallery-field-value-text",
			text: formatDisplayValue(currentValue),
		});
		if (shape !== "none" && field.type !== "list" && currentValue !== undefined && currentValue !== null && currentValue !== "") {
			span.addClass(`gallery-field-badge`, `gallery-field-badge--${shape}`);
			const color = field.badgeColor ?? DEFAULT_BADGE_COLOR;
			span.style.backgroundColor = color;
			span.style.color = fieldTextColor || readableTextColor(color);
		}
		span.addEventListener("click", showEditor);
	};

	const showEditor = () => {
		wrapper.empty();
		const widget = createFieldWidget(field, currentValue, (newValue) => {
			currentValue = newValue;
			onCommit(newValue);
			showText();
		});
		wrapper.appendChild(widget);
		if (widget instanceof HTMLInputElement || widget instanceof HTMLSelectElement) {
			widget.focus();
		}
	};

	showText();
	return wrapper;
}
