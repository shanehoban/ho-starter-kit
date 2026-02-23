import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeMyPassword, updateProfile } from "@/server/users";

export const Route = createFileRoute("/_authenticated/profile")({
	component: ProfilePage,
});

function ProfilePage() {
	const router = useRouter();
	const { user } = Route.useRouteContext();

	const [name, setName] = useState(user.name);
	const [phone, setPhone] = useState(user.phone || "");
	const [profileLoading, setProfileLoading] = useState(false);
	const [profileMessage, setProfileMessage] = useState("");

	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordLoading, setPasswordLoading] = useState(false);
	const [passwordMessage, setPasswordMessage] = useState("");

	const saveProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		setProfileLoading(true);
		setProfileMessage("");
		try {
			await updateProfile({ data: { name, phone: phone.trim() ? phone : null } });
			setProfileMessage("Profile saved");
			router.invalidate();
		} catch (error) {
			setProfileMessage(error instanceof Error ? error.message : "Failed to save profile");
		} finally {
			setProfileLoading(false);
		}
	};

	const savePassword = async (e: React.FormEvent) => {
		e.preventDefault();
		setPasswordMessage("");
		if (newPassword.length < 8) {
			setPasswordMessage("Password must be at least 8 characters");
			return;
		}
		if (newPassword !== confirmPassword) {
			setPasswordMessage("Passwords do not match");
			return;
		}

		setPasswordLoading(true);
		try {
			await changeMyPassword({ data: { newPassword } });
			setPasswordMessage("Password changed");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error) {
			setPasswordMessage(error instanceof Error ? error.message : "Failed to change password");
		} finally {
			setPasswordLoading(false);
		}
	};

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			<Card className="border-border/80 shadow-sm">
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>Update your account details.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={saveProfile} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Name</Label>
							<Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
						</div>
						<div className="space-y-2">
							<Label htmlFor="phone">Phone</Label>
							<Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
						</div>
						<Button type="submit" disabled={profileLoading}>
							{profileLoading ? "Saving..." : "Save profile"}
						</Button>
						{profileMessage && <p className="text-sm text-muted-foreground">{profileMessage}</p>}
					</form>
				</CardContent>
			</Card>

			<Card className="border-border/80 shadow-sm">
				<CardHeader>
					<CardTitle>Password</CardTitle>
					<CardDescription>Set a new password.</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={savePassword} className="space-y-4">
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
						<Button type="submit" disabled={passwordLoading}>
							{passwordLoading ? "Saving..." : "Change password"}
						</Button>
						{passwordMessage && <p className="text-sm text-muted-foreground">{passwordMessage}</p>}
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
