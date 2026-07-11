import type { DisplayedField } from "../types";

export function createFieldWidget(
	field: DisplayedField,
	rawValue: unknown,
	onCommit: (newValue: unknown) => void
): HTMLElement {
	switch (field.type) {
		case "number":
			return createNumberInput(rawValue, onCommit);
		case "date":
			return createDateInput(rawValue, onCommit);
		case "select":
			return createSelectInput(field, rawValue, onCommit);
		case "list":
			return createListInput(rawValue, onCommit);
		case "checkbox":
			return createCheckboxInput(rawValue, onCommit);
		case "text":
		default:
			return createTextInput(rawValue, onCommit);
	}
}

function createTextInput(rawValue: unknown, onCommit: (v: unknown) => void): HTMLElement {
	const input = createEl("input", { type: "text", cls: "gallery-field-input" });
	input.value = rawValue === undefined || rawValue === null ? "" : String(rawValue);
	const commit = () => onCommit(input.value);
	input.addEventListener("blur", commit);
	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") input.blur();
	});
	return input;
}

function createNumberInput(rawValue: unknown, onCommit: (v: unknown) => void): HTMLElement {
	const input = createEl("input", { type: "number", cls: "gallery-field-input" });
	input.value = rawValue === undefined || rawValue === null ? "" : String(rawValue);
	const commit = () => {
		const num = input.value === "" ? null : Number(input.value);
		onCommit(num);
	};
	input.addEventListener("blur", commit);
	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") input.blur();
	});
	return input;
}

function createDateInput(rawValue: unknown, onCommit: (v: unknown) => void): HTMLElement {
	const input = createEl("input", { type: "date", cls: "gallery-field-input" });
	input.value = rawValue === undefined || rawValue === null ? "" : String(rawValue);
	input.addEventListener("change", () => onCommit(input.value));
	return input;
}

function createSelectInput(
	field: DisplayedField,
	rawValue: unknown,
	onCommit: (v: unknown) => void
): HTMLElement {
	const select = createEl("select", { cls: "gallery-field-input" });
	const options = field.selectOptions ?? [];
	select.createEl("option", { value: "", text: "—" });
	options.forEach((opt) => {
		select.createEl("option", { value: opt, text: opt });
	});
	select.value = rawValue === undefined || rawValue === null ? "" : String(rawValue);
	select.addEventListener("change", () => onCommit(select.value || null));
	return select;
}

function createListInput(rawValue: unknown, onCommit: (v: unknown) => void): HTMLElement {
	const input = createEl("input", { type: "text", cls: "gallery-field-input" });
	input.value = Array.isArray(rawValue) ? rawValue.join(", ") : "";
	const commit = () => {
		const list = input.value
			.split(",")
			.map((v) => v.trim())
			.filter(Boolean);
		onCommit(list);
	};
	input.addEventListener("blur", commit);
	input.addEventListener("keydown", (e) => {
		if (e.key === "Enter") input.blur();
	});
	return input;
}

function createCheckboxInput(rawValue: unknown, onCommit: (v: unknown) => void): HTMLElement {
	const input = createEl("input", { type: "checkbox", cls: "gallery-field-checkbox" });
	input.checked = Boolean(rawValue);
	input.addEventListener("change", () => onCommit(input.checked));
	return input;
}
