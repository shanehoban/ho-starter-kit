import type { AuthUser } from "@/server/auth-utils";
import { getEmailService } from "@/server/email/provider-factory";
import { checkEmailRateLimit } from "@/server/email/rate-limiter";
import { TemplateRenderer } from "@/server/email/template-renderer";
import {
	buildFeedbackSubject,
	buildFeedbackTemplateData,
	type FeedbackInput,
	getFeedbackToEmail,
} from "@/server/feedback";

export async function sendFeedbackEmail(params: {
	input: FeedbackInput;
	user: AuthUser;
	userAgent: string;
}): Promise<{ success: true }> {
	const to = getFeedbackToEmail();
	const allowed = await checkEmailRateLimit(params.user.id, "feedback", 5, 30);
	if (!allowed) {
		throw new Error("Too many feedback messages sent recently. Please try again later.");
	}

	const templateData = buildFeedbackTemplateData(params);
	const { html, text } = await TemplateRenderer.render("feedback", templateData);
	const result = await getEmailService().sendEmail({
		userId: params.user.id,
		to,
		subject: buildFeedbackSubject({
			category: params.input.category,
			message: params.input.message,
		}),
		html,
		text,
		type: "feedback",
		templateData,
	});

	if (!result.success) {
		throw new Error("Feedback could not be sent right now. Please try again later.");
	}

	return { success: true };
}
