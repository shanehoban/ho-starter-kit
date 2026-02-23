import { afterEach, describe, expect, it } from "vitest";
import { getAppBaseUrl, toAppUrl } from "@/server/app-url";

const originalEnv = { ...process.env };

afterEach(() => {
	process.env = { ...originalEnv };
});

describe("app-url", () => {
	it("uses BETTER_AUTH_URL when configured", () => {
		process.env.BETTER_AUTH_URL = "https://starter.example.com/";
		expect(getAppBaseUrl()).toBe("https://starter.example.com");
		expect(toAppUrl("/app")).toBe("https://starter.example.com/app");
	});

	it("uses localhost fallback in non-production when unset", () => {
		delete process.env.BETTER_AUTH_URL;
		process.env.NODE_ENV = "development";
		expect(getAppBaseUrl()).toBe("http://localhost:3000");
	});

	it("throws in production when BETTER_AUTH_URL is missing", () => {
		delete process.env.BETTER_AUTH_URL;
		process.env.NODE_ENV = "production";
		expect(() => getAppBaseUrl()).toThrow("BETTER_AUTH_URL must be configured in production");
	});
});
