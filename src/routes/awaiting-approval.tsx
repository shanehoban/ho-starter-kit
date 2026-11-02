import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAuthUserFn } from "@/server/session";

export const Route = createFileRoute("/awaiting-approval")({
	component: AwaitingApprovalPage,
	beforeLoad: async () => {
		const result = await getAuthUserFn();
		if (!result) {
			throw redirect({ to: "/" });
		}
		if (result.approved) {
			throw redirect({ to: "/app" });
		}
		return { rejected: result?.user.rejected === true };
	},
});

function AwaitingApprovalPage() {
	const { rejected } = Route.useRouteContext();
	return (
		<div className="flex flex-1 items-center justify-center p-6">
			<Card className="w-full max-w-sm border-border/80 text-center shadow-sm">
				<CardHeader>
					<div className="mb-2 flex justify-center">
						<Clock className="h-12 w-12 text-muted-foreground" />
					</div>
					<CardTitle className="text-2xl">
						{rejected ? "Access request rejected" : "Awaiting Approval"}
					</CardTitle>
					<CardDescription>
						{rejected
							? "Your request for access has been rejected. You cannot access the app."
							: "Your account has been created but still needs super-admin approval."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline" asChild>
						<Link to="/">Home</Link>
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
