import { createFileRoute, redirect, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
	adminResetPassword,
	getAdminUser,
	sendPasswordResetLinkAsAdmin,
	updateUser,
} from "@/server/users";

type EditableRole = "member" | "admin" | "super-admin";

export const Route = createFileRoute("/_authenticated/admin/users_/$userId/edit")({
	component: EditUserPage,
	beforeLoad: ({ context }) => {
		const role = context.user.role;
		if (role !== "admin" && role !== "super-admin") {
			throw redirect({ to: "/app" });
		}
	},
	loader: async ({ params }) => {
		const user = await getAdminUser({ data: { userId: params.userId } });
		return { user };
	},
});

function EditUserPage() {
	const { user: initial } = Route.useLoaderData();
	const { user: currentUser } = Route.useRouteContext();
	const router = useRouter();

	const initialRole: EditableRole =
		initial.role === "admin" || initial.role === "super-admin" ? initial.role : "member";
	const [name, setName] = useState(initial.name);
	const [phone, setPhone] = useState(initial.phone ?? "");
	const [role, setRole] = useState<EditableRole>(initialRole);
	const [approved, setApproved] = useState(initial.approved);
	const [mustChangePassword, setMustChangePassword] = useState(initial.mustChangePassword);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const isSelf = initial.id === currentUser.id;
	const targetIsSuperAdmin = initial.role === "super-admin";
	const currentIsSuperAdmin = currentUser.role === "super-admin";
	const roleDisabled =
		(isSelf && !currentIsSuperAdmin) || (targetIsSuperAdmin && !currentIsSuperAdmin) || saving;
	const approvedDisabled = isSelf || saving;
	const canDirectlyResetPassword = !isSelf || currentIsSuperAdmin;

	const handleSaveUser = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!name.trim()) {
			setError("Name is required");
			return;
		}

		setSaving(true);
		setError("");
		setSuccess("");
		try {
			await updateUser({
				data: {
					userId: initial.id,
					name: name.trim(),
					phone: phone.trim() || null,
					role,
					approved,
					mustChangePassword,
				},
			});
			setSuccess("User details updated");
			await router.invalidate();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to update user");
		} finally {
			setSaving(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex items-center gap-2">
				<Button variant="ghost" size="icon" onClick={() => router.history.back()}>
					<ArrowLeft className="h-4 w-4" />
				</Button>
				<div>
					<h2 className="text-xl font-bold">Edit user</h2>
					<p className="text-sm text-muted-foreground">{initial.email}</p>
				</div>
			</div>

			<div className="grid items-start gap-4 lg:grid-cols-2">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle>User details</CardTitle>
						<CardDescription>Update identity, role, and access settings.</CardDescription>
					</CardHeader>
					<CardContent>
						<form onSubmit={handleSaveUser} className="space-y-4">
							{error && (
								<div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
									{error}
								</div>
							)}

							{success && (
								<div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-500/10 dark:text-emerald-300">
									{success}
								</div>
							)}

							<div className="space-y-2">
								<Label htmlFor="name">Name</Label>
								<Input
									id="name"
									value={name}
									onChange={(e) => setName(e.target.value)}
									disabled={saving}
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="phone">Phone</Label>
								<Input
									id="phone"
									type="tel"
									value={phone}
									onChange={(e) => setPhone(e.target.value)}
									placeholder="Optional"
									disabled={saving}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input id="email" value={initial.email} disabled className="opacity-70" />
							</div>

							<div className="space-y-2">
								<Label>Role</Label>
								<Select
									value={role}
									onValueChange={(value) => setRole(value as EditableRole)}
									disabled={roleDisabled}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="member">member</SelectItem>
										<SelectItem value="admin">admin</SelectItem>
										{currentIsSuperAdmin && (
											<SelectItem value="super-admin">super-admin</SelectItem>
										)}
									</SelectContent>
								</Select>
								{isSelf && !currentIsSuperAdmin && (
									<p className="text-xs text-muted-foreground">You cannot change your own role.</p>
								)}
								{targetIsSuperAdmin && !currentIsSuperAdmin && (
									<p className="text-xs text-muted-foreground">
										Only super-admins can modify super-admin roles.
									</p>
								)}
							</div>

							<div className="flex items-center justify-between gap-3 rounded-md border p-3">
								<div>
									<Label>Approved</Label>
									<p className="text-xs text-muted-foreground">Allow this user into the app.</p>
								</div>
								<Switch
									checked={approved}
									onCheckedChange={setApproved}
									disabled={approvedDisabled}
								/>
							</div>

							<div className="flex items-center justify-between gap-3 rounded-md border p-3">
								<div>
									<Label>Force password change</Label>
									<p className="text-xs text-muted-foreground">
										Require a password change on next login.
									</p>
								</div>
								<Switch
									checked={mustChangePassword}
									onCheckedChange={setMustChangePassword}
									disabled={saving}
								/>
							</div>

							<div className="text-xs text-muted-foreground">
								Created {new Date(initial.createdAt).toLocaleString()} | Updated{" "}
								{new Date(initial.updatedAt).toLocaleString()}
							</div>

							<Button type="submit" className="w-full" disabled={saving}>
								{saving ? "Saving..." : "Save changes"}
							</Button>
						</form>
					</CardContent>
				</Card>

				<PasswordResetCard
					userId={initial.id}
					canDirectlyResetPassword={canDirectlyResetPassword}
					onAppliedMustChangePassword={setMustChangePassword}
				/>
			</div>
		</div>
	);
}

function PasswordResetCard({
	userId,
	canDirectlyResetPassword,
	onAppliedMustChangePassword,
}: {
	userId: string;
	canDirectlyResetPassword: boolean;
	onAppliedMustChangePassword: (value: boolean) => void;
}) {
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [forceChange, setForceChange] = useState(false);
	const [savingPassword, setSavingPassword] = useState(false);
	const [sendingResetLink, setSendingResetLink] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");

	const handlePasswordReset = async (e: React.FormEvent) => {
		e.preventDefault();
		if (newPassword.length < 8) {
			setError("Password must be at least 8 characters");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setSavingPassword(true);
		setError("");
		setSuccess("");
		try {
			await adminResetPassword({
				data: {
					userId,
					newPassword,
					mustChangePassword: forceChange,
				},
			});
			onAppliedMustChangePassword(forceChange);
			setNewPassword("");
			setConfirmPassword("");
			setSuccess("Password reset completed");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to reset password");
		} finally {
			setSavingPassword(false);
		}
	};

	const handleSendResetLink = async () => {
		setSendingResetLink(true);
		setError("");
		setSuccess("");
		try {
			await sendPasswordResetLinkAsAdmin({ data: { userId } });
			setSuccess("Password reset email sent");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to send reset link");
		} finally {
			setSendingResetLink(false);
		}
	};

	return (
		<Card className="border-border/80 shadow-sm">
			<CardHeader>
				<CardTitle>Password reset</CardTitle>
				<CardDescription>Reset directly or send a reset email link.</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handlePasswordReset} className="space-y-4">
					{error && (
						<div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
							{error}
						</div>
					)}
					{success && (
						<div className="rounded-md border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-400/35 dark:bg-emerald-500/10 dark:text-emerald-300">
							<span className="inline-flex items-center gap-1">
								<Check className="h-4 w-4" />
								{success}
							</span>
						</div>
					)}

					<div className="space-y-2">
						<Label htmlFor="newPassword">New password</Label>
						<Input
							id="newPassword"
							type="password"
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							placeholder="Minimum 8 characters"
							autoComplete="new-password"
							disabled={!canDirectlyResetPassword || savingPassword}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Confirm password</Label>
						<Input
							id="confirmPassword"
							type="password"
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							placeholder="Confirm password"
							autoComplete="new-password"
							disabled={!canDirectlyResetPassword || savingPassword}
						/>
					</div>

					<div className="flex items-center justify-between gap-3 rounded-md border p-3">
						<div>
							<Label>Force password change</Label>
							<p className="text-xs text-muted-foreground">
								User must change password at next login.
							</p>
						</div>
						<Switch
							checked={forceChange}
							onCheckedChange={setForceChange}
							disabled={!canDirectlyResetPassword || savingPassword}
						/>
					</div>

					<div className="flex flex-wrap gap-2">
						<Button
							type="submit"
							disabled={
								!canDirectlyResetPassword ||
								savingPassword ||
								newPassword.length === 0 ||
								confirmPassword.length === 0
							}
						>
							{savingPassword ? "Resetting..." : "Reset password"}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={handleSendResetLink}
							disabled={sendingResetLink}
						>
							{sendingResetLink ? "Sending..." : "Send reset link"}
						</Button>
					</div>

					{!canDirectlyResetPassword && (
						<p className="text-xs text-muted-foreground">
							Use your profile page to change your own password.
						</p>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
