import { describe, expect, it, vi } from "vitest";
import { NullProvider } from "@/server/email/providers/null-provider";

describe("NullProvider", () => {
	it("returns failed send when provider is not configured", async () => {
		const provider = new NullProvider();
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

		const result = await provider.send({
			to: "user@example.com",
			subject: "Test",
			html: "<p>Hello</p>",
		});

		expect(provider.name).toBe("null");
		expect(result.success).toBe(false);
		expect(result.error).toBe("Email provider not configured");
		expect(warnSpy).toHaveBeenCalled();

		warnSpy.mockRestore();
	});
});
