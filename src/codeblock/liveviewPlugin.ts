import { WidgetType, Decoration, EditorView, type DecorationSet } from "@codemirror/view";
import { StateField, RangeSetBuilder, type EditorState, type Transaction } from "@codemirror/state";
import type { App } from "obsidian";
import { GalleryRenderer } from "../render/GalleryRenderer";
import { parseBlockSource } from "./parseBlockSource";
import type GalleryPlugin from "../main";

const BLOCK_REGEX = /^```gallery\n([\s\S]*?)\n```$/gm;

class GalleryWidget extends WidgetType {
	private renderer: GalleryRenderer | null = null;

	constructor(private app: App, private plugin: GalleryPlugin, private source: string) {
		super();
	}

	eq(other: GalleryWidget): boolean {
		return other.source === this.source;
	}

	toDOM(): HTMLElement {
		const container = document.createElement("div");
		container.addClass("gallery-live-preview-embed");

		const { viewId } = parseBlockSource(this.source);
		const savedView = this.plugin.settings.views.find((v) => v.id === viewId);

		if (!savedView) {
			container.createEl("p", {
				cls: "gallery-empty-state",
				text: viewId ? `Visualização "${viewId}" não encontrada.` : "Informe 'view: <id>' no bloco.",
			});
			return container;
		}

		this.renderer = new GalleryRenderer(this.app, savedView, container);
		this.renderer.render();
		return container;
	}

	destroy(): void {
		this.renderer?.destroy();
		this.renderer = null;
	}
}

function buildDecorations(app: App, plugin: GalleryPlugin, state: EditorState): DecorationSet {
	const builder = new RangeSetBuilder<Decoration>();

	try {
		const cursorPos = state.selection.main.head;
		const fullText = state.doc.toString();
		const regex = new RegExp(BLOCK_REGEX.source, "gm");
		let match: RegExpExecArray | null;

		while ((match = regex.exec(fullText))) {
			const blockStart = match.index;
			const blockEnd = blockStart + match[0].length;

			const cursorInside = cursorPos >= blockStart && cursorPos <= blockEnd;
			if (cursorInside) continue;

			const source = match[1];
			builder.add(
				blockStart,
				blockEnd,
				Decoration.replace({
					widget: new GalleryWidget(app, plugin, source),
					block: true,
				})
			);
		}
	} catch (error) {
		console.error("[gallery] falha ao construir decorações do Live Preview:", error);
	}

	return builder.finish();
}

export function buildGalleryLivePreviewExtension(app: App, plugin: GalleryPlugin) {
	return StateField.define<DecorationSet>({
		create(state: EditorState) {
			return buildDecorations(app, plugin, state);
		},
		update(value: DecorationSet, tr: Transaction) {
			if (!tr.docChanged && !tr.selection) {
				return value;
			}
			return buildDecorations(app, plugin, tr.state);
		},
		provide: (field) => EditorView.decorations.from(field),
	});
}
