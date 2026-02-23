import { Resend } from "resend";
import type { IEmailProvider, SendEmailParams, SendEmailResult } from "../types";

export class ResendProvider implements IEmailProvider {
	name = "resend";
	private client: Resend;
	private from: string;

	constructor(apiKey: string, from: string) {
		this.client = new Resend(apiKey);
		this.from = from;
	}

	async send(params: SendEmailParams): Promise<SendEmailResult> {
		try {
			const response = await this.client.emails.send({
				from: this.from,
				to: params.to,
				subject: params.subject,
				html: params.html,
				text: params.text,
			});

			if (response.error) {
				return { success: false, error: response.error.message || "Resend send failed" };
			}

			return {
				success: true,
				id: response.data?.id,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : "Unknown resend error",
			};
		}
	}
}
