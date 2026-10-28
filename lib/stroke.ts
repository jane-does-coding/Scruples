export type Point = { x: number; y: number };
export type Pen = { last: Point; mid: Point };

export const pointsOn = (e: React.PointerEvent<HTMLCanvasElement>): Point[] => {
	const canvas = e.currentTarget;
	const rect = canvas.getBoundingClientRect();
	const events = e.nativeEvent.getCoalescedEvents?.() ?? [];
	return (events.length ? events : [e.nativeEvent]).map((p) => ({
		x: ((p.clientX - rect.left) / rect.width) * canvas.width,
		y: ((p.clientY - rect.top) / rect.height) * canvas.height,
	}));
};

const brush = (canvas: HTMLCanvasElement, color: string) => {
	const ctx = canvas.getContext("2d")!;
	ctx.strokeStyle = color;
	ctx.fillStyle = color;
	ctx.lineWidth = 3.5 * devicePixelRatio;
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	return ctx;
};

export const penDown = (
	canvas: HTMLCanvasElement,
	point: Point,
	color: string,
): Pen => {
	const ctx = brush(canvas, color);
	ctx.beginPath();
	ctx.arc(point.x, point.y, ctx.lineWidth / 2, 0, Math.PI * 2);
	ctx.fill();
	return { last: point, mid: point };
};

export const penMove = (
	canvas: HTMLCanvasElement,
	pen: Pen,
	points: Point[],
	color: string,
): Pen => {
	const ctx = brush(canvas, color);
	ctx.beginPath();
	ctx.moveTo(pen.mid.x, pen.mid.y);
	let { last, mid } = pen;
	for (const point of points) {
		mid = { x: (last.x + point.x) / 2, y: (last.y + point.y) / 2 };
		ctx.quadraticCurveTo(last.x, last.y, mid.x, mid.y);
		last = point;
	}
	ctx.stroke();
	return { last, mid };
};

export const penUp = (canvas: HTMLCanvasElement, pen: Pen, color: string) => {
	const ctx = brush(canvas, color);
	ctx.beginPath();
	ctx.moveTo(pen.mid.x, pen.mid.y);
	ctx.lineTo(pen.last.x, pen.last.y);
	ctx.stroke();
};
