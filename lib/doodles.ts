type Ctx = CanvasRenderingContext2D;
type Point = [number, number];

const wobble = () => (Math.random() - 0.5) * 0.012;

const line = (ctx: Ctx, points: Point[], color: string, close = false) => {
	const { width, height } = ctx.canvas;
	ctx.strokeStyle = color;
	ctx.beginPath();
	points.forEach(([x, y], i) => {
		const px = (x + wobble()) * width;
		const py = (y + wobble()) * height;
		if (i === 0) ctx.moveTo(px, py);
		else ctx.lineTo(px, py);
	});
	if (close) ctx.closePath();
	ctx.stroke();
};

const ring = (r: number, cx: number, cy: number, steps = 24): Point[] =>
	Array.from({ length: steps + 1 }, (_, i) => {
		const a = (i / steps) * Math.PI * 2;
		return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
	});

const arc = (r: number, cx: number, cy: number, a: number, b: number) =>
	Array.from({ length: 13 }, (_, i): Point => {
		const t = a + ((b - a) * i) / 12;
		return [cx + Math.cos(t) * r, cy + Math.sin(t) * r];
	});

const DOODLES: ((ctx: Ctx, c: Record<string, string>) => void)[] = [
	(ctx, c) => {
		line(ctx, ring(0.18, 0.5, 0.5), c.yellow);
		for (let i = 0; i < 10; i++) {
			const a = (i / 10) * Math.PI * 2;
			line(
				ctx,
				[
					[0.5 + Math.cos(a) * 0.25, 0.5 + Math.sin(a) * 0.25],
					[0.5 + Math.cos(a) * 0.38, 0.5 + Math.sin(a) * 0.38],
				],
				c.orange,
			);
		}
	},
	(ctx, c) => {
		line(
			ctx,
			[
				[0.5, 0.45],
				[0.52, 0.65],
				[0.49, 0.9],
			],
			c.brown,
		);
		for (let i = 0; i < 6; i++) {
			const a = (i / 6) * Math.PI * 2;
			line(
				ctx,
				ring(0.08, 0.5 + Math.cos(a) * 0.13, 0.32 + Math.sin(a) * 0.13, 14),
				c.orange,
			);
		}
		line(ctx, ring(0.06, 0.5, 0.32, 14), c.yellow);
	},
	(ctx, c) => {
		line(
			ctx,
			[
				[0.25, 0.45],
				[0.25, 0.85],
				[0.75, 0.85],
				[0.75, 0.45],
			],
			c.brown,
			true,
		);
		line(
			ctx,
			[
				[0.2, 0.47],
				[0.5, 0.18],
				[0.8, 0.47],
			],
			c.orange,
		);
		line(
			ctx,
			[
				[0.44, 0.85],
				[0.44, 0.65],
				[0.56, 0.65],
				[0.56, 0.85],
			],
			c.brown,
		);
		line(
			ctx,
			[
				[0.31, 0.52],
				[0.39, 0.52],
				[0.39, 0.6],
				[0.31, 0.6],
			],
			c.blue,
			true,
		);
	},
	(ctx, c) => {
		line(ctx, ring(0.3, 0.5, 0.5, 28), c.yellow);
		line(ctx, ring(0.025, 0.4, 0.42, 8), c.brown);
		line(ctx, ring(0.025, 0.6, 0.42, 8), c.brown);
		line(ctx, arc(0.17, 0.5, 0.5, 0.2 * Math.PI, 0.8 * Math.PI), c.brown);
	},
	(ctx, c) => {
		line(
			ctx,
			[
				[0.22, 0.62],
				[0.78, 0.62],
				[0.68, 0.75],
				[0.32, 0.75],
			],
			c.brown,
			true,
		);
		line(
			ctx,
			[
				[0.5, 0.62],
				[0.5, 0.2],
			],
			c.brown,
		);
		line(
			ctx,
			[
				[0.5, 0.22],
				[0.72, 0.55],
				[0.5, 0.55],
			],
			c.orange,
			true,
		);
		for (const y of [0.82, 0.9])
			line(
				ctx,
				Array.from({ length: 9 }, (_, i): Point => [
					0.1 + i * 0.1,
					y + (i % 2 ? 0.03 : 0),
				]),
				c.blue,
			);
	},
	(ctx, c) => {
		line(
			ctx,
			[
				[0.46, 0.88],
				[0.47, 0.55],
				[0.53, 0.55],
				[0.54, 0.88],
			],
			c.brown,
		);
		line(ctx, ring(0.14, 0.4, 0.42, 16), c.orange);
		line(ctx, ring(0.14, 0.6, 0.42, 16), c.orange);
		line(ctx, ring(0.15, 0.5, 0.3, 16), c.yellow);
	},
];

export const drawRandomDoodle = (
	canvas: HTMLCanvasElement,
	colors: { blue: string; yellow: string; orange: string; brown: string },
) => {
	const ctx = canvas.getContext("2d")!;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.lineWidth = Math.max(2, canvas.width * 0.025);
	ctx.lineCap = "round";
	ctx.lineJoin = "round";
	DOODLES[Math.floor(Math.random() * DOODLES.length)](ctx, colors);
};
