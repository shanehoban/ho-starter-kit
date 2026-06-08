import { afterEach, describe, expect, it } from "vitest";
import { TemplateRenderer } from "@/server/email/template-renderer";
import {
	buildFeedbackSubject,
	buildFeedbackTemplateData,
	feedbackInputSchema,
	getFeedbackAppName,
	getFeedbackToEmail,
} from "@/server/feedback";

describe("feedback input validation", () => {
	it("accepts valid feedback", () => {
		const result = feedbackInputSchema.parse({
			category: "bug",
			message: "The save button did not respond.",
			currentUrl: "https://example.com/app",
			context: "Clicked twice after editing profile.",
		});

		expect(result.category).toBe("bug");
		expect(result.currentUrl).toBe("https://example.com/app");
	});

	it("rejects empty or too-short messages", () => {
		expect(() =>
			feedbackInputSchema.parse({
				category: "bug",
				message: "   ",
			}),
		).toThrow();
	});

	it("rejects invalid current URLs", () => {
		expect(() =>
			feedbackInputSchema.parse({
				category: "bug",
				message: "The dashboard failed to load.",
				currentUrl: "javascript:alert(1)",
			}),
		).toThrow("Current URL must be an HTTP URL");
	});
});

describe("feedback email helpers", () => {
	const originalAppName = process.env.APP_NAME;
	const originalFeedbackToEmail = process.env.FEEDBACK_TO_EMAIL;

	afterEach(() => {
		if (originalAppName === undefined) {
			delete process.env.APP_NAME;
		} else {
			process.env.APP_NAME = originalAppName;
		}
		process.env.FEEDBACK_TO_EMAIL = originalFeedbackToEmail;
	});

	it("defaults feedback app name to the starter kit", () => {
		process.env.APP_NAME = "";
		expect(getFeedbackAppName()).toBe("ho-starter-kit");
	});

	it("uses a configured feedback app name", () => {
		process.env.APP_NAME = "hobnb";
		expect(getFeedbackAppName()).toBe("hobnb");
	});

	it("requires a configured feedback destination", () => {
		process.env.FEEDBACK_TO_EMAIL = "";
		expect(() => getFeedbackToEmail()).toThrow("Feedback destination is not configured.");
	});

	it("returns the configured feedback destination", () => {
		process.env.FEEDBACK_TO_EMAIL = "owner@example.com";
		expect(getFeedbackToEmail()).toBe("owner@example.com");
	});

	it("builds a compact subject", () => {
		process.env.APP_NAME = "";
		expect(
			buildFeedbackSubject({
				category: "idea",
				message: "It would be useful to export this screen as CSV.",
			}),
		).toBe("[ho-starter-kit feedback] Idea: It would be useful to export this screen as CSV.");
	});

	it("renders the feedback email with user and context details", async () => {
		const templateData = buildFeedbackTemplateData({
			input: feedbackInputSchema.parse({
				category: "question",
				message: "Can this page support filtering?",
				currentUrl: "https://example.com/app",
				context: "Looking at the admin list.",
			}),
			user: {
				id: "user_123",
				name: "Shane",
				email: "shane@example.com",
			},
			userAgent: "Vitest",
		});

		const { html, text } = await TemplateRenderer.render("feedback", templateData);

		expect(html).toContain("ho-starter-kit feedback");
		expect(text).toContain("Can this page support filtering?");
		expect(text).toContain("shane@example.com");
		expect(text).toContain("Vitest");
	});
});
