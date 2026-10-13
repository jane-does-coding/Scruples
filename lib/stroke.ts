// Smooth pen strokes on a canvas, for the drawing frame (Page 6) and the
// notebook. Straight lines between pointer positions look jagged, so:
// - every position the browser saw is used (getCoalescedEvents), not just
//   the one per frame that pointermove reports
// - the line curves through them: each piece is a curve from the middle of
//   the last segment to the middle of the next, bending at the point between

export type Point = { x: number; y: number };
// Where the pen is in a stroke: its last point, and the middle of the last
// segment (where the next curve starts)
export type Pen = { last: Point; mid: Point };

// The pointer's positions since the last event, in the canvas's pixels
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

// Starts a stroke: a dot where the pen went down (so a tap leaves a mark)
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

// Carries the stroke on through `points`; returns where the pen is now
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

// Ends the stroke: the last little bit, from the last middle to the end
export const penUp = (canvas: HTMLCanvasElement, pen: Pen, color: string) => {
	const ctx = brush(canvas, color);
	ctx.beginPath();
	ctx.moveTo(pen.mid.x, pen.mid.y);
	ctx.lineTo(pen.last.x, pen.last.y);
	ctx.stroke();
};
