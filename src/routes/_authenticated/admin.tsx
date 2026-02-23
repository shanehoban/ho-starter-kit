import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
	component: AdminLayout,
	beforeLoad: ({ context }) => {
		const role = context.user.role;
		if (role !== "admin" && role !== "super-admin") {
			throw redirect({ to: "/app" });
		}
	},
});

function AdminLayout() {
	return <Outlet />;
}
