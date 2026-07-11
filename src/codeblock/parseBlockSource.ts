export function parseBlockSource(source: string): { viewId?: string } {
	const match = source.match(/^\s*view:\s*(.+?)\s*$/m);
	return { viewId: match?.[1] };
}
