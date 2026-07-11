/**
 * Normaliza um valor de campo "list" para array de strings. A propriedade nativa
 * "tags" do Obsidian pode vir como array ou como string única (com vírgulas ou não),
 * dependendo de como foi digitada — este helper trata os dois formatos igual.
 */
export function toListValues(value: unknown): string[] {
	if (Array.isArray(value)) {
		return value.map((v) => String(v).trim()).filter(Boolean);
	}
	if (typeof value === "string" && value.trim()) {
		return value
			.split(",")
			.map((v) => v.trim())
			.filter(Boolean);
	}
	return [];
}

export function formatDisplayValue(value: unknown): string {
	if (value === undefined || value === null || value === "") {
		return "—";
	}
	if (Array.isArray(value)) {
		return value.length ? value.join(", ") : "—";
	}
	if (typeof value === "boolean") {
		return value ? "Sim" : "Não";
	}
	return String(value);
}
