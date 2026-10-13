import { useSyncExternalStore } from "react";

// Whether the screen is taller than it's wide (a phone held upright) - the
// same as Tailwind's `portrait:` variant, for the places that need it in
// JavaScript (inline positions and sizes). On the server, and until the
// page is running, it's false
const QUERY = "(orientation: portrait)";

const subscribe = (onChange: () => void) => {
	const query = matchMedia(QUERY);
	query.addEventListener("change", onChange);
	return () => query.removeEventListener("change", onChange);
};

export default function usePortrait() {
	return useSyncExternalStore(
		subscribe,
		() => matchMedia(QUERY).matches,
		() => false,
	);
}
