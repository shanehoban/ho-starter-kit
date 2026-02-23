import type { IEmailProvider, SendEmailParams, SendEmailResult } from "../types";

export class NullProvider implements IEmailProvider {
	name = "null";

	async send(params: SendEmailParams): Promise<SendEmailResult> {
		console.warn("Email not sent (no provider configured)");
		console.warn(`To: ${params.to}`);
		console.warn(`Subject: ${params.subject}`);
		console.warn("Configure RESEND_API_KEY and EMAIL_FROM to enable sending");

		return {
			success: false,
			error: "Email provider not configured",
		};
	}
}
