import { useStage } from "@/components/Stage";
import { asset } from "@/lib/asset";
import { BILL_IMAGES, billsFor } from "@/lib/shop";

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
	// Each bill is 6vw wide and 1.5vw further right than the one before
	const width = 6 + Math.max(bills.length - 1, 0) * 1.5;
	const mid = (bills.length - 1) / 2;

	return (
		<div className="relative h-[12vh]" style={{ width: `${width}vw` }}>
			{/* Stick first, so the money sits in front of it. Centred under the
			    bills and poking out below them */}
			<img
				src={asset("/imgs/popsicle-stick.webp")}
				className="h-[25vh] w-[2.5vw] max-w-none absolute bottom-[-18vh] left-[50%] -translate-x-[50%]"
				alt="Wooden popsicle stick holding up the money"
			/>
			{bills.map((src, i) => (
				<img
					key={i}
					src={src}
					className="absolute bottom-0 w-[6vw] max-w-none origin-bottom"
					style={{
						left: `${i * 1.5}vw`,
						rotate: `${(i - mid) * 6}deg`,
						// Fanned: the middle ones sit a little higher
						marginBottom: `${(mid - Math.abs(i - mid)) * 1.2}vh`,
					}}
					alt="A banknote"
				/>
			))}
			<span className="absolute bottom-[-1vh] right-[-1.5vw] z-1 bg-white border-[0.2vh] border-black px-[0.5vw] text-[2.5vh] leading-tight scribbler">
				${money}
			</span>
		</div>
	);
}
