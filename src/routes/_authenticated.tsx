import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Nav } from "@/components/nav";
import type { FeedbackActionInput } from "@/lib/feedback";
import { sendFeedbackAction } from "@/server/feedback";
import { requireApprovedFn } from "@/server/session";
import { getAdminStats } from "@/server/users";

export const Route = createFileRoute("/_authenticated")({
	component: AuthenticatedLayout,
	beforeLoad: async () => {
		const user = await requireApprovedFn().catch((error: unknown) => {
			if (error instanceof Error && error.message === "Unauthorized") {
				throw redirect({ to: "/login" });
			}
			if (error instanceof Error && error.message === "Account not approved") {
				throw redirect({ to: "/awaiting-approval" });
			}
			throw error;
		});

		if (!user) throw redirect({ to: "/login" });
		if (user.mustChangePassword) throw redirect({ to: "/change-password" });

		let pendingApprovalCount = 0;
		if (user.role === "admin" || user.role === "super-admin") {
			try {
				const stats = await getAdminStats();
				pendingApprovalCount = stats.pendingUserCount;
			} catch {
				// no-op
			}
		}

		return { user, pendingApprovalCount };
	},
});

function AuthenticatedLayout() {
	const { user, pendingApprovalCount } = Route.useRouteContext();
	const handleSendFeedback = (input: FeedbackActionInput) => sendFeedbackAction({ data: input });

	return (
		<div className="flex flex-1 flex-col">
			<Nav
				user={user}
				pendingApprovalCount={pendingApprovalCount}
				onSendFeedback={handleSendFeedback}
			/>
			<main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-5 sm:py-6">
				<Outlet />
			</main>
		</div>
	);
}
