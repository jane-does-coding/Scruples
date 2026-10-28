import { useEffect, useState } from "react";

export default function useLeaving<T>(value: T, ms = 800) {
	const [previous, setPrevious] = useState(value);
	const [leaving, setLeaving] = useState<T | null>(null);

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
