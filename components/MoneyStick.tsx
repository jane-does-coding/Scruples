import { useStage } from "@/components/Stage";
import { asset } from "@/lib/asset";
import { BILL_IMAGES, billsFor } from "@/lib/shop";
import usePortrait from "@/components/usePortrait";

// The money on a popsicle stick (the souvenir shop, Daphne's price): shows
// what's actually in the inventory - one bill per $5 and per $1, fanned out
// over the stick, with the total on a little tag
export default function MoneyStick() {
	const { money } = useStage();
	const { fives, ones } = billsFor(money);
	const bills = [
		...Array.from({ length: fives }, () => BILL_IMAGES.five),
		...Array.from({ length: ones }, () => BILL_IMAGES.one),
	];
	// Each bill is 6vw wide and 1.5vw further right than the one before - on
	// portrait screens, where vw is tiny, 7.2svh and 1.8svh instead
	const portrait = usePortrait();
	const unit = portrait ? "svh" : "vw";
	const k = portrait ? 1.2 : 1;
	const width = (6 + Math.max(bills.length - 1, 0) * 1.5) * k;
	const mid = (bills.length - 1) / 2;

	return (
		<div className="relative h-[12svh]" style={{ width: `${width}${unit}` }}>
			{/* Stick first, so the money sits in front of it. Centred under the
			    bills and poking out below them */}
			<img
				src={asset("/imgs/stage/popsicle-stick.webp")}
				className="h-[25svh] w-[2.5vw] portrait:w-[3svh] max-w-none absolute bottom-[-18svh] left-[50%] -translate-x-[50%]"
				alt="Wooden popsicle stick holding up the money"
			/>
			{bills.map((src, i) => (
				<img
					key={i}
					src={src}
					className="absolute bottom-0 w-[6vw] portrait:w-[7.2svh] max-w-none origin-bottom"
					style={{
						left: `${i * 1.5 * k}${unit}`,
						rotate: `${(i - mid) * 6}deg`,
						// Fanned: the middle ones sit a little higher
						marginBottom: `${(mid - Math.abs(i - mid)) * 1.2}svh`,
					}}
					alt="A banknote"
				/>
			))}
			<span className="absolute bottom-[-1svh] right-[-1.5vw] portrait:right-[-2svh] z-1 bg-white border-[0.2svh] border-black px-[0.5vw] text-[2.5svh] leading-tight scribbler">
				${money}
			</span>
		</div>
	);
}
