const DEV_DEFAULT_APP_URL = "http://localhost:3000";

function trimTrailingSlashes(value: string): string {
	return value.replace(/\/+$/, "");
}

export function getAppBaseUrl(): string {
	const configured = process.env.BETTER_AUTH_URL?.trim();
	if (configured) {
		return trimTrailingSlashes(configured);
	}

	if (process.env.NODE_ENV === "production") {
		throw new Error("BETTER_AUTH_URL must be configured in production");
	}

	return DEV_DEFAULT_APP_URL;
}

export function toAppUrl(pathname: string): string {
	const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
	return `${getAppBaseUrl()}${normalizedPath}`;
}
