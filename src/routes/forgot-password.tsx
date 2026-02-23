import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/server/users";

export const Route = createFileRoute("/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(false);
	const [error, setError] = useState("");
	const [sending, setSending] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setSending(true);

		try {
			await requestPasswordReset({ data: { email } });
			setSent(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to send reset email");
		} finally {
			setSending(false);
		}
	};

	if (sent) {
		return (
			<div className="flex flex-1 items-center justify-center px-4 py-8 sm:p-6">
				<Card className="w-full max-w-md border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="text-2xl">Check your email</CardTitle>
						<CardDescription>
							If an account exists for <strong>{email}</strong>, a reset link has been sent.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button variant="outline" className="w-full" asChild>
							<Link to="/">Back to home</Link>
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return (
		<div className="flex flex-1 items-center justify-center px-4 py-8 sm:p-6">
			<Card className="w-full max-w-md border-border/80 shadow-sm">
				<CardHeader>
					<CardTitle className="text-2xl">Reset your password</CardTitle>
					<CardDescription>Enter your email to receive a reset link.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						{error && (
							<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
								{error}
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="email">Email</Label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								required
								disabled={sending}
							/>
						</div>
						<Button type="submit" className="w-full" disabled={sending}>
							{sending ? "Sending..." : "Send reset link"}
						</Button>
						<div className="text-center text-sm text-muted-foreground">
							<Link to="/login" className="hover:text-foreground">
								Back to login
							</Link>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
