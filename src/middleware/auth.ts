import { redirect } from "@tanstack/react-router";
import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { auth } from "@/lib/auth";

export const authMiddleware = createMiddleware().server(async ({ next }) => {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });

	if (!session) {
		throw redirect({ to: "/login" });
	}

	const user = session.user as typeof session.user & {
		approved: boolean;
		role: string;
	};

	if (!user.approved) {
		throw redirect({ to: "/awaiting-approval" });
	}

	return next({ context: { user, session } });
});

export const adminMiddleware = createMiddleware().server(async ({ next }) => {
	const headers = getRequestHeaders();
	const session = await auth.api.getSession({ headers });

	if (!session) {
		throw redirect({ to: "/login" });
	}

	const user = session.user as typeof session.user & {
		approved: boolean;
		role: string;
	};

	if (!user.approved) {
		throw redirect({ to: "/awaiting-approval" });
	}

	if (user.role !== "admin" && user.role !== "super-admin") {
		throw redirect({ to: "/app" });
	}

	return next({ context: { user, session } });
});
