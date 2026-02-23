function toOrigin(value: string): string | null {
	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

export function isSameOriginRequest(
	requestHeaders: Headers,
	config: {
		appUrl?: string;
		allowWithoutOrigin?: boolean;
	} = {},
): boolean {
	const origin = requestHeaders.get("origin");
	if (!origin) {
		return config.allowWithoutOrigin ?? true;
	}

	const requestOrigin = toOrigin(origin);
	if (!requestOrigin) return false;

	const configuredOrigin = config.appUrl ? toOrigin(config.appUrl) : null;
	if (configuredOrigin) {
		return requestOrigin === configuredOrigin;
	}

	const forwardedHost = requestHeaders.get("x-forwarded-host");
	const host = forwardedHost || requestHeaders.get("host");
	if (!host) return false;

	const forwardedProto = requestHeaders.get("x-forwarded-proto");
	const protocol = forwardedProto === "https" ? "https" : "http";
	return requestOrigin === `${protocol}://${host}`;
}
