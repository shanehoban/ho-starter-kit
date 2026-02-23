import { createHash } from "node:crypto";
import { isIP } from "node:net";

function normalizeIp(raw: string): string | null {
	const value = raw.trim();
	if (!value) return null;

	const first = value.split(",")[0]?.trim();
	if (!first) return null;

	const bracketMatch = first.match(/^\[([^[\]]+)\](?::\d+)?$/);
	if (bracketMatch?.[1] && isIP(bracketMatch[1])) {
		return bracketMatch[1];
	}

	const maybeIpv4WithPort = first.match(/^(\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?$/);
	if (maybeIpv4WithPort?.[1] && isIP(maybeIpv4WithPort[1])) {
		return maybeIpv4WithPort[1];
	}

	return isIP(first) ? first : null;
}

function fallbackFingerprint(headers: Headers): string {
	const userAgent = headers.get("user-agent") || "";
	const acceptLanguage = headers.get("accept-language") || "";
	const hash = createHash("sha256")
		.update(`${userAgent}|${acceptLanguage}`)
		.digest("hex")
		.slice(0, 24);
	return `anon:${hash}`;
}

export function getRequestIdentifier(headers: Headers): string {
	const candidates = [
		headers.get("cf-connecting-ip"),
		headers.get("x-real-ip"),
		headers.get("x-forwarded-for"),
	];

	for (const candidate of candidates) {
		if (!candidate) continue;
		const ip = normalizeIp(candidate);
		if (ip) return ip;
	}

	return fallbackFingerprint(headers);
}
