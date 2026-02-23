import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn } from "@/lib/auth-client";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const result = await signIn.email({ email, password });
			if (result.error) {
				setError(result.error.message || "Login failed");
			} else {
				router.navigate({ to: "/app" });
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
						<CardTitle className="text-2xl">Log in</CardTitle>
						<CardDescription>Sign in to your account</CardDescription>
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
									autoComplete="email"
								/>
							</div>
							<div className="space-y-2">
								<div className="flex items-center justify-between">
									<Label htmlFor="password">Password</Label>
									<Link
										to="/forgot-password"
										className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
									>
										Forgot password?
									</Link>
								</div>
								<Input
									id="password"
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									required
									autoComplete="current-password"
								/>
							</div>
							<Button type="submit" className="w-full" disabled={loading}>
								{loading ? "Signing in..." : "Sign in"}
							</Button>
							<p className="text-center text-sm text-muted-foreground">
								Don't have an account?{" "}
								<Link to="/register" className="text-primary underline-offset-4 hover:underline">
									Register
								</Link>
							</p>
						</form>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
