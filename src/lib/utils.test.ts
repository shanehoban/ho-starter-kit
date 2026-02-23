import { describe, expect, it } from "vitest";
import { capitalize, slugify } from "@/lib/utils";

describe("utils", () => {
	it("slugify handles spacing and symbols", () => {
		expect(slugify("Hello, Starter Kit!")).toBe("hello-starter-kit");
	});

	it("capitalize uppercases first character", () => {
		expect(capitalize("starter")).toBe("Starter");
	});
});
