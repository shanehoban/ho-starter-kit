import { getRequestHeaders } from "@tanstack/react-start/server";
import { getAppBaseUrl } from "@/server/app-url";
import { isSameOriginRequest } from "@/server/origin-guard";

export function assertSameOriginRequest(): void {
	const headers = getRequestHeaders();
	const allowWithoutOrigin = process.env.NODE_ENV === "test";
	const sameOrigin = isSameOriginRequest(headers, {
		appUrl: getAppBaseUrl(),
		allowWithoutOrigin,
	});

	if (!sameOrigin) {
		throw new Error("Invalid request origin");
	}
}
