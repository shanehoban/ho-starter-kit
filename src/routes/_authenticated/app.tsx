import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/app")({
	component: AppDashboard,
});

function AppDashboard() {
	const { user } = Route.useRouteContext();

	return (
		<div className="space-y-4">
			<Card className="border-border/80 shadow-sm">
				<CardHeader>
					<CardTitle>Welcome back, {user.name}</CardTitle>
					<CardDescription>
						This is your starter dashboard. Replace this route with your project features.
					</CardDescription>
				</CardHeader>
				<CardContent className="text-sm text-muted-foreground">
					Current role: <strong>{user.role}</strong>
				</CardContent>
			</Card>
		</div>
	);
}
