import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/server/users";

export const Route = createFileRoute("/reset-password")({
	component: ResetPasswordPage,
	validateSearch: (search: Record<string, unknown>) => ({
		email: (search.email as string) || "",
		token: (search.token as string) || "",
	}),
});

function ResetPasswordPage() {
	const { email, token } = Route.useSearch();
	const navigate = useNavigate();

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);
	const [success, setSuccess] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (newPassword.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		if (newPassword !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setSaving(true);
		try {
			await resetPassword({ data: { email, token, newPassword } });
			setSuccess(true);
			setTimeout(() => {
				navigate({ to: "/login" });
			}, 2500);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to reset password");
		} finally {
			setSaving(false);
		}
	};

	if (!email || !token) {
		return (
			<div className="flex flex-1 items-center justify-center p-4">
				<Card className="w-full max-w-md border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle>Invalid reset link</CardTitle>
						<CardDescription>This password reset link is invalid or incomplete.</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="outline" className="w-full" asChild>
							<Link to="/forgot-password">Request new link</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	if (success) {
		return (
			<div className="flex flex-1 items-center justify-center p-4">
				<Card className="w-full max-w-md border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle>Password updated</CardTitle>
						<CardDescription>You can now log in with your new password.</CardDescription>
					</CardHeader>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex flex-1 items-center justify-center p-4">
			<Card className="w-full max-w-md border-border/80 shadow-sm">
				<CardHeader>
					<CardTitle>Set new password</CardTitle>
					<CardDescription>Choose a new password for your account.</CardDescription>
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
								disabled={saving}
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
								disabled={saving}
							/>
						</div>
						<Button type="submit" className="w-full" disabled={saving}>
							{saving ? "Resetting..." : "Reset password"}
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
