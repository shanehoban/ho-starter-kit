import { createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

export const getSessionFn = createServerFn({ method: "GET" }).handler(async () => {
	const headers = getRequestHeaders();
	return auth.api.getSession({ headers });
});

export const getAuthUserFn = createServerFn({ method: "GET" }).handler(async () => {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });
	if (!session) {
		return null;
	}
	const user = session.user as typeof session.user & { approved: boolean };
	return { user, approved: user.approved };
});

export const requireAuthFn = createServerFn({ method: "GET" }).handler(async () => {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });
	if (!session) {
		throw new Error("Unauthorized");
	}
	const user = session.user as typeof session.user & { approved: boolean };
	return { user, approved: user.approved };
});

export const requireApprovedFn = createServerFn({ method: "GET" }).handler(async () => {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });
	if (!session) {
		throw new Error("Unauthorized");
	}
	const user = session.user as typeof session.user & { approved: boolean };
	if (!user.approved) {
		throw new Error("Account not approved");
	}
	return user;
});

export const requireAdminFn = createServerFn({ method: "GET" }).handler(async () => {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });
	if (!session) {
		throw new Error("Unauthorized");
	}

	const user = session.user as typeof session.user & {
		role?: string;
		approved: boolean;
	};

	if (!user.approved) {
		throw new Error("Account not approved");
	}

	if (user.role !== "admin" && user.role !== "super-admin") {
		throw new Error("Forbidden - Admin access required");
	}

	return user;
});
