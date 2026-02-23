import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signOut } from "@/lib/auth-client";
import { requireAuthFn } from "@/server/session.server";
import { changeMyPassword } from "@/server/users";

const checkMustChangePassword = createServerFn({ method: "GET" }).handler(async () => {
	try {
		const { user } = await requireAuthFn();
		const typedUser = user as typeof user & { mustChangePassword?: boolean };
		if (!typedUser.mustChangePassword) throw redirect({ to: "/app" });
		return true;
	} catch {
		throw redirect({ to: "/login" });
	}
});

export const Route = createFileRoute("/change-password")({
	component: ChangePasswordPage,
	beforeLoad: async () => {
		await checkMustChangePassword();
	},
});

function ChangePasswordPage() {
	const router = useRouter();
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (newPassword.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setLoading(true);
		setError("");
		try {
			await changeMyPassword({ data: { newPassword } });
			router.navigate({ to: "/app" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to change password");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-col gap-10 flex-1 items-center justify-center p-6">
			<Card className="w-full max-w-sm border-border/80 shadow-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Change your password</CardTitle>
					<CardDescription>
						An administrator has required a password change before you continue.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="newPassword">New password</Label>
							<Input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(e) => setNewPassword(e.target.value)}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmPassword">Confirm password</Label>
							<Input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(e) => setConfirmPassword(e.target.value)}
								required
							/>
						</div>
						<Button type="submit" className="w-full" disabled={loading}>
							{loading ? "Changing..." : "Change password"}
						</Button>
					</form>
				</CardContent>
			</Card>

			<div className="flex items-center justify-center">
				{/* Logout button */}
				<Button
					variant="outline"
					className="ml-4"
					onClick={async () => {
						await signOut();
						window.location.href = "/login";
					}}
				>
					Logout
				</Button>
			</div>
		</div>
	);
}
