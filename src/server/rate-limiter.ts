import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, eq, gt, lt } from "drizzle-orm";
import { db } from "@/db";
import { publicRateLimits } from "@/db/schema";
import { getRequestIdentifier } from "@/server/request-identity";

export async function checkPublicRateLimit(
	endpoint: string,
	maxRequests = 100,
	windowMinutes = 60,
): Promise<boolean> {
	const headers = getRequestHeaders();
	const identifier = getRequestIdentifier(headers);

	const windowStart = new Date();
	windowStart.setMinutes(windowStart.getMinutes() - windowMinutes);

	const recentRequests = await db
		.select()
		.from(publicRateLimits)
		.where(
			and(
				eq(publicRateLimits.identifier, identifier),
				eq(publicRateLimits.endpoint, endpoint),
				gt(publicRateLimits.createdAt, windowStart),
			),
		);

	if (recentRequests.length >= maxRequests) {
		return false;
	}

	await db.insert(publicRateLimits).values({
		identifier,
		endpoint,
	});

	return true;
}

export async function cleanupRateLimits(): Promise<void> {
	const dayAgo = new Date();
	dayAgo.setHours(dayAgo.getHours() - 24);

	await db.delete(publicRateLimits).where(lt(publicRateLimits.createdAt, dayAgo));
}
