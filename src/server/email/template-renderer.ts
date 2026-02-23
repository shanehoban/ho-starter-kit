import { render } from "@react-email/render";
import { PasswordResetEmail } from "@/emails/password-reset";
import { UserApprovedEmail } from "@/emails/user-approved";
import { UserRegisteredEmail } from "@/emails/user-registered";
import type { EmailLogType } from "./types";

const templateRenderers: Record<
	EmailLogType,
	(data: Record<string, unknown>) => React.ReactElement
> = {
	user_registered: (data) =>
		UserRegisteredEmail(data as unknown as Parameters<typeof UserRegisteredEmail>[0]),
	user_approved: (data) =>
		UserApprovedEmail(data as unknown as Parameters<typeof UserApprovedEmail>[0]),
	password_reset: (data) =>
		PasswordResetEmail(data as unknown as Parameters<typeof PasswordResetEmail>[0]),
};

export const TemplateRenderer = {
	async render(templateName: EmailLogType, data: Record<string, unknown>) {
		const template = templateRenderers[templateName];
		const component = template(data);

		return {
			html: await render(component),
			text: await render(component, { plainText: true }),
		};
	},
};
