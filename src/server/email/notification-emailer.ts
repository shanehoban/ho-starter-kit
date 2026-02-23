import { eq, or } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { toAppUrl } from "@/server/app-url";
import { getEmailService } from "./provider-factory";
import { TemplateRenderer } from "./template-renderer";

export async function sendUserRegisteredEmailToAdmins(params: {
	userName: string;
	userEmail: string;
	userId: string;
}) {
	try {
		const emailService = getEmailService();
		const admins = await db
			.select({ id: users.id, name: users.name, email: users.email })
			.from(users)
			.where(or(eq(users.role, "admin"), eq(users.role, "super-admin")));

		for (const admin of admins) {
			const templateData = {
				adminName: admin.name,
				userId: params.userId,
				userName: params.userName,
				userEmail: params.userEmail,
				adminUsersUrl: toAppUrl("/admin/users"),
			};

			const { html, text } = await TemplateRenderer.render("user_registered", templateData);

			await emailService.sendEmail({
				userId: admin.id,
				to: admin.email,
				subject: "New user registration",
				html,
				text,
				type: "user_registered",
				templateData,
			});
		}
	} catch (error) {
		console.error("Failed to send user registered emails:", error);
	}
}

export async function sendUserApprovedEmail(params: { userId: string }) {
	try {
		const emailService = getEmailService();
		const [user] = await db
			.select({ name: users.name })
			.from(users)
			.where(eq(users.id, params.userId));
		if (!user) {
			return;
		}

		const templateData = {
			userName: user.name,
			loginUrl: toAppUrl("/login"),
		};
		const { html, text } = await TemplateRenderer.render("user_approved", templateData);

		await emailService.sendToUser({
			userId: params.userId,
			subject: "Your account has been approved",
			html,
			text,
			type: "user_approved",
			templateData,
		});
	} catch (error) {
		console.error("Failed to send user approved email:", error);
	}
}

export async function sendPasswordResetEmail(params: {
	userId: string;
	email: string;
	resetUrl: string;
	expiryMinutes: number;
}) {
	try {
		const emailService = getEmailService();
		const [user] = await db
			.select({ name: users.name })
			.from(users)
			.where(eq(users.id, params.userId));
		if (!user) {
			return;
		}

		const templateData = {
			userName: user.name,
			resetUrl: params.resetUrl,
			expiryMinutes: params.expiryMinutes,
		};
		const { html, text } = await TemplateRenderer.render("password_reset", templateData);

		await emailService.sendEmail({
			userId: params.userId,
			to: params.email,
			subject: "Reset your password",
			html,
			text,
			type: "password_reset",
			templateData,
		});
	} catch (error) {
		console.error("Failed to send password reset email:", error);
	}
}
