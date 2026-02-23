import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";
import {
	isAdmin as isAdminGuard,
	isSuperAdmin as isSuperAdminGuard,
	requireAdmin as requireAdminGuard,
	requireApproved as requireApprovedGuard,
	requireSuperAdmin as requireSuperAdminGuard,
} from "@/server/auth-guards";

export type AuthUser = {
	id: string;
	name: string;
	email: string;
	role: string;
	approved: boolean;
	phone: string | null;
	mustChangePassword: boolean;
};

export async function getAuthUser(): Promise<AuthUser> {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });
	if (!session) throw new Error("Not authenticated");
	return session.user as AuthUser;
}

export function requireApproved(user: Pick<AuthUser, "approved">): void {
	requireApprovedGuard(user);
}

export function requireAdmin(user: Pick<AuthUser, "role" | "approved">): void {
	requireAdminGuard(user);
}

export function isSuperAdmin(user: Pick<AuthUser, "role">): boolean {
	return isSuperAdminGuard(user);
}

export function requireSuperAdmin(user: Pick<AuthUser, "role" | "approved">): void {
	requireSuperAdminGuard(user);
}

export function isAdmin(user: Pick<AuthUser, "role" | "approved">): boolean {
	return isAdminGuard(user);
}
