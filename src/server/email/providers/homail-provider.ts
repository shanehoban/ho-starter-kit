import { HomailProvider as HomailClientProvider } from "@shanehoban/homail";
import type { IEmailProvider, SendEmailParams, SendEmailResult } from "../types";

export class HomailProvider implements IEmailProvider {
	name = "homail";
	private client: HomailClientProvider;

	constructor(params: { baseUrl: string; apiKey: string; from: string }) {
		this.client = new HomailClientProvider({
			baseUrl: params.baseUrl,
			apiKey: params.apiKey,
			from: params.from,
		});
	}

	async send(params: SendEmailParams): Promise<SendEmailResult> {
		const result = await this.client.send({
			to: params.to,
			subject: params.subject,
			html: params.html,
			text: params.text,
		});

		if (!result.success) {
			return {
				success: false,
				error: result.error || "Homail send failed",
			};
		}

		return {
			success: true,
			id: result.id,
		};
	}
}
