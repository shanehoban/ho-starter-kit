import { describe, expect, it } from "vitest";
import { isSameOriginRequest } from "@/server/origin-guard";

describe("isSameOriginRequest", () => {
	it("allows requests without Origin header by default", () => {
		const headers = new Headers();
		expect(isSameOriginRequest(headers)).toBe(true);
	});

	it("can reject requests without Origin when explicitly configured", () => {
		const headers = new Headers();
		expect(isSameOriginRequest(headers, { allowWithoutOrigin: false })).toBe(false);
	});

	it("validates against configured app URL when provided", () => {
		const headers = new Headers({ origin: "https://starter.example.com" });
		expect(isSameOriginRequest(headers, { appUrl: "https://starter.example.com" })).toBe(true);
		expect(isSameOriginRequest(headers, { appUrl: "https://other.example.com" })).toBe(false);
	});

	it("falls back to host and forwarded proto when app URL is not configured", () => {
		const headers = new Headers({
			origin: "https://starter.example.com",
			host: "starter.example.com",
			"x-forwarded-proto": "https",
		});
		expect(isSameOriginRequest(headers)).toBe(true);
	});

	it("prefers x-forwarded-host over host in proxied environments", () => {
		const headers = new Headers({
			origin: "https://public.example.com",
			host: "internal.service:3000",
			"x-forwarded-host": "public.example.com",
			"x-forwarded-proto": "https",
		});
		expect(isSameOriginRequest(headers)).toBe(true);
	});

	it("rejects origin mismatch when host fallback does not match", () => {
		const headers = new Headers({
			origin: "https://other.example.com",
			host: "starter.example.com",
			"x-forwarded-proto": "https",
		});
		expect(isSameOriginRequest(headers)).toBe(false);
	});

	it("rejects malformed origins", () => {
		const headers = new Headers({ origin: "not-a-url" });
		expect(isSameOriginRequest(headers, { appUrl: "https://starter.example.com" })).toBe(false);
	});
});
