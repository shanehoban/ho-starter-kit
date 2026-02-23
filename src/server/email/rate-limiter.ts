import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { emailLogs } from "@/db/schema";
import type { EmailLogType } from "./types";

export async function checkEmailRateLimit(
	userId: string,
	type: EmailLogType,
	maxEmails = 5,
	windowMinutes = 60,
): Promise<boolean> {
	const windowStart = new Date();
	windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

	const recentEmails = await db
		.select()
		.from(emailLogs)
		.where(
			and(
				eq(emailLogs.userId, userId),
				eq(emailLogs.type, type),
				gt(emailLogs.createdAt, windowStart),
			),
		);

	return recentEmails.length < maxEmails;
}
