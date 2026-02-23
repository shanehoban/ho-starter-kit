export type GuardUser = {
	role: string;
	approved: boolean;
};

export function requireApproved(user: Pick<GuardUser, "approved">): void {
	if (!user.approved) throw new Error("Account not approved");
}

export function requireAdmin(user: Pick<GuardUser, "role" | "approved">): void {
	requireApproved(user);
	if (user.role !== "admin" && user.role !== "super-admin") {
		throw new Error("Not authorized");
	}
}

export function isSuperAdmin(user: Pick<GuardUser, "role">): boolean {
	return user.role === "super-admin";
}

export function requireSuperAdmin(user: Pick<GuardUser, "role" | "approved">): void {
	requireApproved(user);
	if (user.role !== "super-admin") {
		throw new Error("Super-admin access required");
	}
}

export function isAdmin(user: Pick<GuardUser, "role" | "approved">): boolean {
	return user.approved && (user.role === "admin" || user.role === "super-admin");
}
