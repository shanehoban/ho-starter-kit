import { EmailService } from "./email-service";
import { HomailProvider } from "./providers/homail-provider";
import { NullProvider } from "./providers/null-provider";
import type { IEmailProvider } from "./types";

export function createEmailProvider(): IEmailProvider {
	const providerType = process.env.EMAIL_PROVIDER || "null";

	switch (providerType) {
		case "homail": {
			const apiKey = process.env.HOMAIL_API_KEY;
			const baseUrl = process.env.HOMAIL_BASE_URL || "https://homail.shanehoban.com";
			const from = process.env.HOMAIL_FROM || process.env.EMAIL_FROM;

			if (!apiKey || !from) {
				console.warn("EMAIL_PROVIDER=homail requires HOMAIL_API_KEY and HOMAIL_FROM.");
				return new NullProvider();
			}

			return new HomailProvider({ apiKey, baseUrl, from });
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
