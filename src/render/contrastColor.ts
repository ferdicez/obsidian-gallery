/** Retorna preto ou branco, o que garante mais legibilidade sobre a cor de fundo informada (hex). */
export function readableTextColor(hexColor: string): string {
	const hex = hexColor.replace("#", "");
	const full = hex.length === 3 ? hex.split("").map((c) => c + c).join("") : hex;
	if (full.length !== 6) return "#000000";

	const r = parseInt(full.slice(0, 2), 16);
	const g = parseInt(full.slice(2, 4), 16);
	const b = parseInt(full.slice(4, 6), 16);
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

	return luminance > 0.6 ? "#000000" : "#ffffff";
}
