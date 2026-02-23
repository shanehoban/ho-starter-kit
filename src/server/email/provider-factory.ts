import { EmailService } from "./email-service";
import { NullProvider } from "./providers/null-provider";
import { ResendProvider } from "./providers/resend-provider";
import type { IEmailProvider } from "./types";

export function createEmailProvider(): IEmailProvider {
	const providerType = process.env.EMAIL_PROVIDER || "resend";

	switch (providerType) {
		case "resend": {
			const resendKey = process.env.RESEND_API_KEY;
			const emailFrom = process.env.EMAIL_FROM;
			if (!resendKey || !emailFrom) {
				console.warn(
					"EMAIL_PROVIDER=resend but RESEND_API_KEY/EMAIL_FROM is missing. Falling back to null provider.",
				);
				return new NullProvider();
			}

			return new ResendProvider(resendKey, emailFrom);
		}
		case "null":
			return new NullProvider();
		default:
			console.warn(`Unknown EMAIL_PROVIDER=${providerType}. Falling back to null provider.`);
			return new NullProvider();
	}
}

let emailServiceInstance: EmailService | null = null;

export function getEmailService(): EmailService {
	if (!emailServiceInstance) {
		emailServiceInstance = new EmailService(createEmailProvider());
	}
	return emailServiceInstance;
}
