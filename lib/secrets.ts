export const SECRETS = [
	"bird",
	"key",
	"keyhole",
	"carpet",
	"book",
	"poster",
	"photo",
] as const;
export type Secret = (typeof SECRETS)[number];

const STORAGE_KEY = "scruples-secrets";

export const loadSecrets = (): Secret[] => {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
		return Array.isArray(saved)
			? SECRETS.filter((secret) => saved.includes(secret))
			: [];
	} catch {
		return [];
	}
};

export const findSecret = (secret: Secret) => {
	const found = loadSecrets();
	if (found.includes(secret)) return false;
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify([...found, secret]));
	} catch {}
	return true;
};
