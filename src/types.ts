export type FieldType = "text" | "number" | "date" | "select" | "list" | "checkbox";

/** Como o valor de um campo é desenhado: texto puro, ou destacado com fundo colorido. */
export type ValueBadgeShape = "none" | "pill" | "rectangle";

export interface DisplayedField {
	key: string;
	label?: string;
	type: FieldType;
	selectOptions?: string[];
	icon?: string;
	hideLabel?: boolean;
	/** Formato do destaque de cor do valor. "none" = sem cor (texto puro). */
	badgeShape?: ValueBadgeShape;
	/** Cor única aplicada a todo o campo (usada quando type !== "list"). */
	badgeColor?: string;
	/** Cor por valor individual (usada quando type === "list"), chave = valor exato da tag. */
	valueColors?: Record<string, string>;
}

/** Cor de fundo neutra para valores de lista sem cor definida em valueColors. */
export const DEFAULT_BADGE_COLOR = "#888888";

export type HorizontalAlign = "left" | "center" | "right";

/**
 * Como o par label+valor se distribui na linha do campo:
 * - justify-between: label e valor nas extremidades opostas (espaço máximo entre eles)
 * - grouped-left/center/right: label e valor colados (espaçamento pequeno), o bloco alinhado como unidade
 */
export type FieldRowLayout = "justify-between" | "grouped-left" | "grouped-center" | "grouped-right";

export type TopBarPosition = "top" | "left" | "right";

/** Acima deste valor (px), a barra do tipo "top" fica alta o bastante para o título ser desenhado por cima dela. */
export const TOP_BAR_OVERLAY_THRESHOLD = 32;

export interface ViewAppearance {
	cardMinWidth: number;
	titleAlign: HorizontalAlign;
	fieldRowLayout: FieldRowLayout;
	cardBackgroundColor?: string;
	cardBorderColor?: string;
	titleColor?: string;
	/** Cor do texto (rótulo e valor) das propriedades exibidas no card. */
	fieldTextColor?: string;
	topBarColor?: string;
	topBarPosition: TopBarPosition;
	topBarThickness: number;
}

export const DEFAULT_APPEARANCE: ViewAppearance = {
	cardMinWidth: 220,
	titleAlign: "left",
	fieldRowLayout: "justify-between",
	topBarPosition: "top",
	topBarThickness: 4,
};

export interface SavedGalleryView {
	id: string;
	name: string;
	folder?: string;
	propertyFilter?: { key: string; value: string };
	titleField?: string;
	/** Usa o primeiro alias (propriedade `aliases`) da nota como título do card, em vez do nome do arquivo.
	 * Se a nota não tiver alias, cai no nome do arquivo. Tem prioridade sobre titleField quando ligado. */
	useAliasAsTitle?: boolean;
	displayedFields: DisplayedField[];
	appearance?: ViewAppearance;
	createdAt: string;
	updatedAt: string;
}

export interface GallerySettings {
	views: SavedGalleryView[];
}

export const DEFAULT_SETTINGS: GallerySettings = {
	views: [],
};
