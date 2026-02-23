import { describe, expect, it } from "vitest";
import { optionalTrimmedStringSchema, roleSchema, trimmedStringSchema } from "@/server/validators";

describe("validators", () => {
	it("validates roles", () => {
		expect(roleSchema.parse("super-admin")).toBe("super-admin");
		expect(() => roleSchema.parse("owner")).toThrow();
	});

	it("validates trimmed string", () => {
		expect(trimmedStringSchema.parse(" value ")).toBe("value");
		expect(() => trimmedStringSchema.parse("   ")).toThrow();
	});

	it("maps empty optional strings to null", () => {
		expect(optionalTrimmedStringSchema.parse("  ")).toBeNull();
		expect(optionalTrimmedStringSchema.parse(" value ")).toBe("value");
	});
});
