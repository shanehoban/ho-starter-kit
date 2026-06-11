import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { z } from "zod";
import { feedbackCategories, feedbackCategoryLabels } from "@/lib/feedback";
import { getAppBaseUrl } from "@/server/app-url";
import type { AuthUser } from "@/server/auth-utils";

function isHttpUrl(value: string): boolean {
	try {
		const url = new URL(value);
		return url.protocol === "http:" || url.protocol === "https:";
	} catch {
		return false;
	}
}

export const feedbackInputSchema = z.object({
	category: z.enum(feedbackCategories),
	message: z.string().trim().min(5).max(4000),
	currentUrl: z
		.string()
		.trim()
		.max(2000)
		.optional()
		.transform((value) => value || undefined)
		.refine((value) => !value || isHttpUrl(value), "Current URL must be an HTTP URL"),
	context: z
		.string()
		.trim()
		.max(2000)
		.optional()
		.transform((value) => value || undefined),
});

export type FeedbackInput = z.infer<typeof feedbackInputSchema>;

export function getFeedbackAppName(): string {
	const candidate = process.env.APP_NAME?.trim();
	return candidate && candidate !== "undefined" ? candidate : "ho-starter-kit";
}

export function buildFeedbackSubject(params: {
	category: FeedbackInput["category"];
	message: string;
}): string {
	const compactMessage = params.message.replace(/\s+/g, " ").trim();
	const summary =
		compactMessage.length > 80 ? `${compactMessage.slice(0, 77).trim()}...` : compactMessage;
	return `[${getFeedbackAppName()} feedback] ${feedbackCategoryLabels[params.category]}: ${summary}`;
}

export function getFeedbackToEmail(): string {
	const candidate = process.env.FEEDBACK_TO_EMAIL?.trim();
	const result = z.email().safeParse(candidate);
	if (!result.success) {
		throw new Error("Feedback destination is not configured.");
	}
	return result.data;
}

export function buildFeedbackTemplateData(params: {
	input: FeedbackInput;
	user: Pick<AuthUser, "id" | "name" | "email">;
	userAgent: string;
}) {
	return {
		appName: getFeedbackAppName(),
		category: params.input.category,
		categoryLabel: feedbackCategoryLabels[params.input.category],
		message: params.input.message,
		context: params.input.context,
		userName: params.user.name,
		userEmail: params.user.email,
		userId: params.user.id,
		currentUrl: params.input.currentUrl,
		appUrl: getAppBaseUrl(),
		userAgent: params.userAgent || "Unknown",
	};
}

export const sendFeedbackAction = createServerFn({ method: "POST" })
	.validator((data) => feedbackInputSchema.parse(data))
	.handler(async ({ data }) => {
		const [{ getAuthUser, requireApproved }, { assertSameOriginRequest }, { sendFeedbackEmail }] =
			await Promise.all([
				import("@/server/auth-utils"),
				import("@/server/request-security"),
				import("@/server/feedback.service"),
			]);

		assertSameOriginRequest();
		const user = await getAuthUser();
		requireApproved(user);
		const headers = getRequestHeaders();

		return sendFeedbackEmail({
			input: data,
			user,
			userAgent: headers.get("user-agent") || "Unknown",
		});
	});
