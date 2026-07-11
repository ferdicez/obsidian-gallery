const WIKILINK_REGEX = /^\[\[([^\]|]+)(\|([^\]]+))?\]\]$/;

/** Extrai o texto visível de um valor de frontmatter que é um wikilink (ex.: "[[cliente|Alias]]" -> "Alias"). */
export function stripWikilink(value: unknown): unknown {
	if (typeof value !== "string") return value;
	const match = value.match(WIKILINK_REGEX);
	if (!match) return value;
	return match[3] ?? match[1];
}
