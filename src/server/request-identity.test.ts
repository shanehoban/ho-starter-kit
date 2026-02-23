import { describe, expect, it } from "vitest";
import { getRequestIdentifier } from "@/server/request-identity";

describe("getRequestIdentifier", () => {
	it("prefers cf-connecting-ip over x-forwarded-for", () => {
		const headers = new Headers({
			"cf-connecting-ip": "198.51.100.10",
			"x-forwarded-for": "203.0.113.9, 10.0.0.1",
		});
		expect(getRequestIdentifier(headers)).toBe("198.51.100.10");
	});

	it("uses first IP from x-forwarded-for", () => {
		const headers = new Headers({
			"x-forwarded-for": "203.0.113.9, 10.0.0.1",
		});
		expect(getRequestIdentifier(headers)).toBe("203.0.113.9");
	});

	it("normalizes IPs with ports", () => {
		const headers = new Headers({
			"x-real-ip": "198.51.100.22:54321",
		});
		expect(getRequestIdentifier(headers)).toBe("198.51.100.22");
	});

	it("normalizes bracketed IPv6 with port", () => {
		const headers = new Headers({
			"x-real-ip": "[2001:db8::1]:443",
		});
		expect(getRequestIdentifier(headers)).toBe("2001:db8::1");
	});

	it("falls back to deterministic anonymous fingerprint", () => {
		const headers = new Headers({
			"user-agent": "VitestAgent/1.0",
			"accept-language": "en-US",
		});

		const identifier = getRequestIdentifier(headers);
		expect(identifier.startsWith("anon:")).toBe(true);
		expect(identifier.length).toBeGreaterThan("anon:".length);
	});

	it("falls back when forwarded headers are invalid", () => {
		const headers = new Headers({
			"x-forwarded-for": "definitely-not-an-ip",
			"x-real-ip": "also-invalid",
			"user-agent": "VitestAgent/2.0",
			"accept-language": "en-IE",
		});
		expect(getRequestIdentifier(headers).startsWith("anon:")).toBe(true);
	});
});
