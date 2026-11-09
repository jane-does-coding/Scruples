export const STRING = "string w-[0.1vw] min-w-px bg-black/60 absolute";

export const LABEL =
	"relative text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker";

export const BUTTON = `${LABEL.replace("border-[0.2svh]", "border-[0.3svh]")} border-dashed cursor-pointer`;

export default function Strings({
	inset,
	place = "h-svh top-[-100svh]",
	className = "",
}: {
	inset?: string;
	place?: string;
	className?: string;
}) {
	const base = `${STRING} ${place} ${className}`;
	return (
		<>
			<span
				aria-hidden
				className={`${base} ${inset ? "" : "left-0"}`}
				style={inset ? { left: inset } : undefined}
			/>
			<span
				aria-hidden
				className={`${base} ${inset ? "" : "right-0"}`}
				style={inset ? { right: inset } : undefined}
			/>
		</>
	);
}
