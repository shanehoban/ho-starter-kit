import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import { db } from "@/db";
import { verifications } from "@/db/schema";

const PASSWORD_RESET_IDENTIFIER_PREFIX = "password_reset";

function hashToken(token: string): string {
	return createHash("sha256").update(token).digest("hex");
}

function toScopedIdentifier(identifier: string): string {
	return `${PASSWORD_RESET_IDENTIFIER_PREFIX}:${identifier.trim().toLowerCase()}`;
}

export async function createVerificationToken(
	identifier: string,
	expiryMinutes = 60,
): Promise<string> {
	const scopedIdentifier = toScopedIdentifier(identifier);
	const token = randomBytes(32).toString("base64url");
	const hashedToken = hashToken(token);

	const expiresAt = new Date();
	expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

	await db.delete(verifications).where(eq(verifications.identifier, scopedIdentifier));

	await db.insert(verifications).values({
		id: randomBytes(16).toString("base64url"),
		identifier: scopedIdentifier,
		value: hashedToken,
		expiresAt,
		createdAt: new Date(),
	});

	return token;
}

export async function verifyToken(identifier: string, token: string): Promise<boolean> {
	const scopedIdentifier = toScopedIdentifier(identifier);
	const hashedToken = hashToken(token);

	const [verification] = await db
		.select()
		.from(verifications)
		.where(
			and(
				eq(verifications.identifier, scopedIdentifier),
				eq(verifications.value, hashedToken),
				gt(verifications.expiresAt, new Date()),
			),
		);

	if (!verification) {
		return false;
	}

	await db.delete(verifications).where(eq(verifications.id, verification.id));

	return true;
}
