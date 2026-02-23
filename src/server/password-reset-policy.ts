type PasswordResetRole = "member" | "admin" | "super-admin";

export function canAdminSendResetLink(params: {
	adminRole: PasswordResetRole;
	targetRole: PasswordResetRole;
}): boolean {
	if (params.targetRole === "super-admin") {
		return params.adminRole === "super-admin";
	}

	return params.adminRole === "admin" || params.adminRole === "super-admin";
}
