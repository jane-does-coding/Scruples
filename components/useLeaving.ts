import { useEffect, useState } from "react";

// For things that get replaced (like a line of dialogue): returns the
// previous value for `ms` after `value` changes, so it can be shown lifting
// away (.hang-out) while the new one comes in, instead of just vanishing
export default function useLeaving<T>(value: T, ms = 800) {
	const [previous, setPrevious] = useState(value);
	const [leaving, setLeaving] = useState<T | null>(null);

	// Updating state while rendering, when the value changes, is React's
	// pattern for state that depends on a prop
	if (value !== previous) {
		setPrevious(value);
		setLeaving(previous);
	}

	useEffect(() => {
		if (leaving === null) return;
		const timer = setTimeout(() => setLeaving(null), ms);
		return () => clearTimeout(timer);
	}, [leaving, ms]);

	return leaving;
}
