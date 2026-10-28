import { useSyncExternalStore } from "react";

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
