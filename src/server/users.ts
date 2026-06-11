import { createServerFn } from "@tanstack/react-start";
import { hashPassword } from "better-auth/crypto";
import { and, asc, count, eq, like, or } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { accounts, notifications, sessions, users } from "@/db/schema";
import { toAppUrl } from "@/server/app-url";
import { getAuthUser, requireAdmin } from "@/server/auth-utils";
import { sendPasswordResetEmail, sendUserApprovedEmail } from "@/server/email/notification-emailer";
import { checkEmailRateLimit } from "@/server/email/rate-limiter";
import { createVerificationToken, verifyToken } from "@/server/email/verification-tokens";
import { canAdminSendResetLink } from "@/server/password-reset-policy";
import { checkPublicRateLimit } from "@/server/rate-limiter";
import { assertSameOriginRequest } from "@/server/request-security";
import { roleSchema } from "@/server/validators";

const userIdSchema = z.object({
	userId: z.string().trim().min(1),
});

const searchUsersInputSchema = z.object({
	query: z.string().trim().min(1).max(100),
	limit: z.number().int().positive().max(25).optional(),
});

const updateProfileSchema = z.object({
	name: z.string().trim().min(1).max(100),
	phone: z.string().trim().max(50).nullable().optional(),
});

const updateUserSchema = z.object({
	userId: z.string().trim().min(1),
	name: z.string().trim().min(1).max(100).optional(),
	phone: z.string().trim().max(50).nullable().optional(),
	role: roleSchema.optional(),
	approved: z.boolean().optional(),
	mustChangePassword: z.boolean().optional(),
});

const adminResetPasswordSchema = z.object({
	userId: z.string().trim().min(1),
	newPassword: z.string().min(8).max(128),
	mustChangePassword: z.boolean().optional(),
});

const changePasswordSchema = z.object({
	newPassword: z.string().min(8).max(128),
});

const requestPasswordResetSchema = z.object({
	email: z.email().trim().toLowerCase(),
});

const resetPasswordSchema = z.object({
	email: z.email().trim().toLowerCase(),
	token: z.string().trim().min(1),
	newPassword: z.string().min(8).max(128),
});

export const getAllUsers = createServerFn({ method: "GET" }).handler(async () => {
	const user = await getAuthUser();
	requireAdmin(user);

	return db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			approved: users.approved,
			phone: users.phone,
			mustChangePassword: users.mustChangePassword,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
		})
		.from(users)
		.orderBy(asc(users.createdAt));
});

export const searchUsersForAdmin = createServerFn({ method: "GET" })
	.validator((data) => searchUsersInputSchema.parse(data))
	.handler(async ({ data }) => {
		const user = await getAuthUser();
		requireAdmin(user);

		const query = `%${data.query}%`;
		return db
			.select({ id: users.id, name: users.name, email: users.email })
			.from(users)
			.where(or(like(users.name, query), like(users.email, query)))
			.orderBy(asc(users.name))
			.limit(data.limit ?? 10);
	});

export const getPendingUsers = createServerFn({ method: "GET" }).handler(async () => {
	const user = await getAuthUser();
	requireAdmin(user);

	return db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			createdAt: users.createdAt,
		})
		.from(users)
		.where(eq(users.approved, false))
		.orderBy(asc(users.createdAt));
});

export const getAdminUser = createServerFn({ method: "GET" })
	.validator((data) => userIdSchema.parse(data))
	.handler(async ({ data }) => {
		const admin = await getAuthUser();
		requireAdmin(admin);

		const [user] = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
				approved: users.approved,
				phone: users.phone,
				mustChangePassword: users.mustChangePassword,
				createdAt: users.createdAt,
				updatedAt: users.updatedAt,
			})
			.from(users)
			.where(eq(users.id, data.userId));

		if (!user) throw new Error("User not found");
		return user;
	});

export const approveUser = createServerFn({ method: "POST" })
	.validator((data) => userIdSchema.parse(data))
	.handler(async ({ data }) => {
		assertSameOriginRequest();
		const admin = await getAuthUser();
		requireAdmin(admin);

		const [targetUser] = await db.select().from(users).where(eq(users.id, data.userId));
		if (!targetUser) throw new Error("User not found");
		if (targetUser.approved) return { success: true };

		await db
			.update(users)
			.set({ approved: true, updatedAt: new Date(), updatedBy: admin.id })
			.where(eq(users.id, data.userId));

		await db.insert(notifications).values({
			userId: data.userId,
			type: "user_approved",
			message: "Your account has been approved. You can now log in.",
		});

		await sendUserApprovedEmail({ userId: data.userId });

		return { success: true };
	});

export const updateUser = createServerFn({ method: "POST" })
	.validator((data) => updateUserSchema.parse(data))
	.handler(async ({ data }) => {
		assertSameOriginRequest();
		const admin = await getAuthUser();
		requireAdmin(admin);

		const [targetUser] = await db.select().from(users).where(eq(users.id, data.userId));
		if (!targetUser) throw new Error("User not found");

		if (targetUser.role === "super-admin" && admin.role !== "super-admin") {
			throw new Error("Only super-admins can modify super-admin users");
		}

		if (data.role === "super-admin" && admin.role !== "super-admin") {
			throw new Error("Only super-admins can promote to super-admin");
		}

		const removesSuperAdminRole =
			targetUser.role === "super-admin" && data.role !== undefined && data.role !== "super-admin";
		const removesSuperAdminApproval =
			targetUser.role === "super-admin" && data.approved !== undefined && data.approved === false;

		if (removesSuperAdminRole || removesSuperAdminApproval) {
			const [result] = await db
				.select({ count: count() })
				.from(users)
				.where(eq(users.role, "super-admin"));
			if (result.count <= 1) {
				throw new Error("Cannot remove approval/role from the last super-admin");
			}
		}

		await db
			.update(users)
			.set({
				name: data.name ?? targetUser.name,
				phone: data.phone ?? targetUser.phone,
				role: data.role ?? targetUser.role,
				approved: data.approved ?? targetUser.approved,
				mustChangePassword: data.mustChangePassword ?? targetUser.mustChangePassword,
				updatedAt: new Date(),
				updatedBy: admin.id,
			})
			.where(eq(users.id, data.userId));

		if (!targetUser.approved && data.approved === true) {
			await db.insert(notifications).values({
				userId: data.userId,
				type: "user_approved",
				message: "Your account has been approved. You can now log in.",
			});
			await sendUserApprovedEmail({ userId: data.userId });
		}

		return { success: true };
	});

export const adminResetPassword = createServerFn({ method: "POST" })
	.validator((data) => adminResetPasswordSchema.parse(data))
	.handler(async ({ data }) => {
		assertSameOriginRequest();
		const admin = await getAuthUser();
		requireAdmin(admin);

		const [targetUser] = await db.select().from(users).where(eq(users.id, data.userId));
		if (!targetUser) throw new Error("User not found");

		if (targetUser.role === "super-admin" && admin.role !== "super-admin") {
			throw new Error("Only super-admins can reset super-admin passwords");
		}

		if (admin.id === data.userId && admin.role !== "super-admin") {
			throw new Error("Use your profile page to change your own password");
		}

		const [credentialAccount] = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(and(eq(accounts.userId, data.userId), eq(accounts.providerId, "credential")));
		if (!credentialAccount) {
			throw new Error("User does not have password login configured");
		}

		const hashed = await hashPassword(data.newPassword);
		await db
			.update(accounts)
			.set({ password: hashed, updatedAt: new Date() })
			.where(and(eq(accounts.userId, data.userId), eq(accounts.providerId, "credential")));

		if (data.mustChangePassword !== undefined) {
			await db
				.update(users)
				.set({
					mustChangePassword: data.mustChangePassword,
					updatedAt: new Date(),
					updatedBy: admin.id,
				})
				.where(eq(users.id, data.userId));
		}

		return { success: true };
	});

export const updateProfile = createServerFn({ method: "POST" })
	.validator((data) => updateProfileSchema.parse(data))
	.handler(async ({ data }) => {
		assertSameOriginRequest();
		const user = await getAuthUser();

		await db
			.update(users)
			.set({
				name: data.name,
				phone: data.phone || null,
				updatedAt: new Date(),
				updatedBy: user.id,
			})
			.where(eq(users.id, user.id));

		return { success: true };
	});

export const changeMyPassword = createServerFn({ method: "POST" })
	.validator((data) => changePasswordSchema.parse(data))
	.handler(async ({ data }) => {
		assertSameOriginRequest();
		const user = await getAuthUser();

		const [credentialAccount] = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")));
		if (!credentialAccount) {
			throw new Error("Password login is not configured for this account");
		}

		const hashed = await hashPassword(data.newPassword);
		await db
			.update(accounts)
			.set({ password: hashed, updatedAt: new Date() })
			.where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")));

		await db
			.update(users)
			.set({ mustChangePassword: false, updatedAt: new Date(), updatedBy: user.id })
			.where(eq(users.id, user.id));

		return { success: true };
	});

export const requestPasswordReset = createServerFn({ method: "POST" })
	.validator((data) => requestPasswordResetSchema.parse(data))
	.handler(async ({ data }) => {
		assertSameOriginRequest();
		const allowed = await checkPublicRateLimit("requestPasswordReset", 6, 15);
		if (!allowed) {
			return { success: true };
		}

		const [user] = await db.select().from(users).where(eq(users.email, data.email));
		if (!user) {
			return { success: true };
		}

		const [credentialAccount] = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")));
		if (!credentialAccount) {
			return { success: true };
		}

		const canSend = await checkEmailRateLimit(user.id, "password_reset", 3, 60);
		if (!canSend) {
			return { success: true };
		}

		const token = await createVerificationToken(data.email, 60);
		const resetUrl = `${toAppUrl("/reset-password")}?email=${encodeURIComponent(data.email)}&token=${encodeURIComponent(token)}`;

		await sendPasswordResetEmail({
			userId: user.id,
			email: data.email,
			resetUrl,
			expiryMinutes: 60,
		});

		return { success: true };
	});

export const sendPasswordResetLinkAsAdmin = createServerFn({ method: "POST" })
	.validator((data) => userIdSchema.parse(data))
	.handler(async ({ data }) => {
		assertSameOriginRequest();
		const admin = await getAuthUser();
		requireAdmin(admin);

		const [targetUser] = await db
			.select({ id: users.id, email: users.email, role: users.role })
			.from(users)
			.where(eq(users.id, data.userId));

		if (!targetUser) {
			throw new Error("User not found");
		}

		if (
			!canAdminSendResetLink({
				adminRole: admin.role as "member" | "admin" | "super-admin",
				targetRole: targetUser.role,
			})
		) {
			throw new Error("Only super-admins can send reset links to super-admin users");
		}

		const [credentialAccount] = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(and(eq(accounts.userId, targetUser.id), eq(accounts.providerId, "credential")));

		if (!credentialAccount) {
			throw new Error("User does not have password login configured");
		}

		const canSend = await checkEmailRateLimit(targetUser.id, "password_reset", 5, 60);
		if (!canSend) {
			throw new Error("Too many password reset emails sent recently for this user");
		}

		const token = await createVerificationToken(targetUser.email, 60);
		const resetUrl = `${toAppUrl("/reset-password")}?email=${encodeURIComponent(targetUser.email)}&token=${encodeURIComponent(token)}`;

		await sendPasswordResetEmail({
			userId: targetUser.id,
			email: targetUser.email,
			resetUrl,
			expiryMinutes: 60,
		});

		return { success: true };
	});

export const resetPassword = createServerFn({ method: "POST" })
	.validator((data) => resetPasswordSchema.parse(data))
	.handler(async ({ data }) => {
		assertSameOriginRequest();
		const isValid = await verifyToken(data.email, data.token);
		if (!isValid) {
			throw new Error("Invalid or expired reset link");
		}

		const [user] = await db.select().from(users).where(eq(users.email, data.email));
		if (!user) {
			throw new Error("User not found");
		}

		const [credentialAccount] = await db
			.select({ id: accounts.id })
			.from(accounts)
			.where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")));
		if (!credentialAccount) {
			throw new Error("Password reset unavailable for this account");
		}

		const hashed = await hashPassword(data.newPassword);
		await db
			.update(accounts)
			.set({ password: hashed, updatedAt: new Date() })
			.where(and(eq(accounts.userId, user.id), eq(accounts.providerId, "credential")));

		await db
			.update(users)
			.set({ mustChangePassword: false, updatedAt: new Date(), updatedBy: user.id })
			.where(eq(users.id, user.id));

		await db.delete(sessions).where(eq(sessions.userId, user.id));

		return { success: true };
	});

export const getAdminStats = createServerFn({ method: "GET" }).handler(async () => {
	const user = await getAuthUser();
	requireAdmin(user);

	const pendingUsers = await db.select().from(users).where(eq(users.approved, false));

	return {
		pendingUserCount: pendingUsers.length,
	};
});
