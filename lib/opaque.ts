const SIZE = 200;
const maps = new Map<string, ImageData | null | "loading">();

const load = (src: string) => {
	maps.set(src, "loading");
	const img = new Image();
	img.onload = () => {
		const scale = SIZE / Math.max(img.naturalWidth, img.naturalHeight);
		const canvas = document.createElement("canvas");
		canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
		canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
		const ctx = canvas.getContext("2d", { willReadFrequently: true });
		if (!ctx) return maps.set(src, null);
		ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
		maps.set(src, ctx.getImageData(0, 0, canvas.width, canvas.height));
	};
	img.onerror = () => maps.set(src, null);
	img.src = src;
};

export const opaqueAt = (img: HTMLImageElement, x: number, y: number) => {
	const src = img.currentSrc || img.src;
	const map = maps.get(src);
	if (map === undefined) load(src);
	if (!map || map === "loading") return true;
	const box = img.getBoundingClientRect();
	const px = Math.floor(((x - box.left) / box.width) * map.width);
	const py = Math.floor(((y - box.top) / box.height) * map.height);
	if (px < 0 || py < 0 || px >= map.width || py >= map.height) return false;
	for (let dy = -1; dy <= 1; dy++)
		for (let dx = -1; dx <= 1; dx++) {
			const nx = px + dx;
			const ny = py + dy;
			if (nx < 0 || ny < 0 || nx >= map.width || ny >= map.height) continue;
			if (map.data[(ny * map.width + nx) * 4 + 3] > 12) return true;
		}
	return false;
};
