export type EmailLogType = "user_registered" | "user_approved" | "password_reset" | "feedback";

export type SendEmailParams = {
	to: string;
	subject: string;
	html: string;
	text?: string;
};

export type SendEmailResult = {
	success: boolean;
	id?: string;
	error?: string;
};

export interface IEmailProvider {
	name: string;
	send(params: SendEmailParams): Promise<SendEmailResult>;
}
