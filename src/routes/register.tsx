import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/auth-client";

export const Route = createFileRoute("/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const router = useRouter();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}
		if (password.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}

		setLoading(true);
		try {
			const result = await signUp.email({ name, email, password });
			if (result.error) {
				setError(result.error.message || "Registration failed");
			} else {
				router.navigate({ to: "/awaiting-approval" });
			}
		} catch {
			setError("Something went wrong. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="flex flex-1 items-center justify-center px-4 py-8 sm:p-6">
			<div className="w-full max-w-sm space-y-4">
				<div className="text-center space-y-1">
					<Link to="/" className="font-bold text-lg tracking-tight hover:text-primary">
						ho-starter-kit
					</Link>
				</div>
				<Card className="w-full border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="text-2xl">Register</CardTitle>
						<CardDescription>Create your account</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSubmit} className="space-y-4">
							{error && (
								<div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
									{error}
								</div>
							)}
							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="password">Password</Label>
								<Input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									minLength={8}
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
								{loading ? "Creating account..." : "Create account"}
							</Button>
							<p className="text-center text-sm text-muted-foreground">
								Already have an account?{" "}
								<Link to="/login" className="text-primary underline-offset-4 hover:underline">
									Log in
								</Link>
							</p>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
