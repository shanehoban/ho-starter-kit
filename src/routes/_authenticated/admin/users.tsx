import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import {
	approveUser,
	getAllUsers,
	getPendingUsers,
	sendPasswordResetLinkAsAdmin,
	updateUser,
} from "@/server/users";

type PendingUser = {
	id: string;
	name: string;
	email: string;
	createdAt: Date;
};

type AdminUser = {
	id: string;
	name: string;
	email: string;
	role: "member" | "admin" | "super-admin";
	approved: boolean;
	phone: string | null;
	mustChangePassword: boolean;
	createdAt: Date;
	updatedAt: Date;
};

type EditableRole = "member" | "admin" | "super-admin";

export const Route = createFileRoute("/_authenticated/admin/users")({
	component: AdminUsersPage,
	beforeLoad: ({ context }) => {
		const role = context.user.role;
		if (role !== "admin" && role !== "super-admin") {
			throw redirect({ to: "/app" });
		}
	},
	loader: async () => {
		const [pending, all] = await Promise.all([getPendingUsers(), getAllUsers()]);
		return { pending, all };
	},
});

function AdminUsersPage() {
	const router = useRouter();
	const { user } = Route.useRouteContext();
	const data = Route.useLoaderData() as { pending: PendingUser[]; all: AdminUser[] };
	const [workingId, setWorkingId] = useState<string | null>(null);
	const [message, setMessage] = useState("");
	const [search, setSearch] = useState("");
	const [roleDrafts, setRoleDrafts] = useState<Record<string, EditableRole>>({});

	const approvedUsers = useMemo(() => {
		const q = search.trim().toLowerCase();
		const approvedOnly = data.all.filter((entry: AdminUser) => entry.approved);
		if (!q) return approvedOnly;
		return approvedOnly.filter((entry: AdminUser) => {
			return entry.name.toLowerCase().includes(q) || entry.email.toLowerCase().includes(q);
		});
	}, [data.all, search]);

	const refresh = async () => {
		await router.invalidate();
	};

	const handleApprove = async (userId: string) => {
		setWorkingId(userId);
		setMessage("");
		try {
			await approveUser({ data: { userId } });
			setMessage("User approved");
			await refresh();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Failed to approve user");
		} finally {
			setWorkingId(null);
		}
	};

	const handleSaveRole = async (userId: string, nextRole: EditableRole) => {
		setWorkingId(userId);
		setMessage("");
		try {
			await updateUser({ data: { userId, role: nextRole } });
			setMessage(`Role updated to ${nextRole}`);
			setRoleDrafts((prev) => {
				const next = { ...prev };
				delete next[userId];
				return next;
			});
			await refresh();
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Failed to update role");
		} finally {
			setWorkingId(null);
		}
	};

	const handleSendReset = async (userId: string) => {
		setWorkingId(userId);
		setMessage("");
		try {
			await sendPasswordResetLinkAsAdmin({ data: { userId } });
			setMessage("Password reset email sent");
		} catch (error) {
			setMessage(error instanceof Error ? error.message : "Failed to send reset email");
		} finally {
			setWorkingId(null);
		}
	};

	const resolveEditableRole = (role: AdminUser["role"]): EditableRole => role;

	return (
		<div className="space-y-4">
			<Card className="border-border/80 shadow-sm">
				<CardHeader>
					<CardTitle>User approvals</CardTitle>
					<CardDescription>{data.pending.length} users awaiting approval</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					{data.pending.length === 0 ? (
						<p className="text-sm text-muted-foreground">No pending users.</p>
					) : (
						data.pending.map((entry: PendingUser) => (
							<div
								key={entry.id}
								className="flex items-center justify-between gap-3 rounded-md border p-3"
							>
								<div>
									<p className="font-medium">{entry.name}</p>
									<p className="text-sm text-muted-foreground">{entry.email}</p>
								</div>
								<Button disabled={workingId === entry.id} onClick={() => handleApprove(entry.id)}>
									Approve
								</Button>
							</div>
						))
					)}
				</CardContent>
			</Card>

			<Card className="border-border/80 shadow-sm">
				<CardHeader>
					<CardTitle>Approved users</CardTitle>
					<CardDescription>Manage roles and reset links for approved accounts.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="space-y-2">
						<Label htmlFor="search">Search</Label>
						<Input
							id="search"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="name or email"
						/>
					</div>
					<div className="space-y-2">
						{approvedUsers.map((entry: AdminUser) => {
							const isSelf = entry.id === user.id;
							const isSuperAdmin = entry.role === "super-admin";
							const canEditRole = !isSelf && !isSuperAdmin;
							const currentRole = resolveEditableRole(entry.role);
							const draftRole = roleDrafts[entry.id] ?? currentRole;
							const roleChanged = draftRole !== currentRole;
							return (
								<div key={entry.id} className="rounded-md border p-3">
									<div className="mb-2 flex flex-wrap items-center gap-2">
										<p className="font-medium">{entry.name}</p>
										<Badge variant="secondary">{entry.role}</Badge>
										<Badge>approved</Badge>
									</div>
									<p className="mb-3 text-sm text-muted-foreground">{entry.email}</p>
									<div className="flex flex-wrap gap-2">
										<Button variant="secondary" asChild>
											<Link to="/admin/users/$userId/edit" params={{ userId: entry.id }}>
												Edit
											</Link>
										</Button>
										<Select
											value={draftRole}
											disabled={workingId === entry.id || !canEditRole}
											onValueChange={(value) => {
												setRoleDrafts((prev) => ({
													...prev,
													[entry.id]: value as EditableRole,
												}));
											}}
										>
											<SelectTrigger className="w-[150px]">
												<SelectValue />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value="member">member</SelectItem>
												<SelectItem value="admin">admin</SelectItem>
												{currentRole === "super-admin" && (
													<SelectItem value="super-admin">super-admin</SelectItem>
												)}
											</SelectContent>
										</Select>
										{roleChanged && canEditRole && (
											<Button
												disabled={workingId === entry.id}
												onClick={() => handleSaveRole(entry.id, draftRole)}
											>
												Save role
											</Button>
										)}
										<Button
											variant="outline"
											disabled={workingId === entry.id}
											onClick={() => handleSendReset(entry.id)}
										>
											Send reset link
										</Button>
									</div>
									{(isSelf || isSuperAdmin) && (
										<p className="mt-2 text-xs text-muted-foreground">
											{isSelf
												? "You cannot change your own role."
												: "Super-admin role changes are restricted."}
										</p>
									)}
								</div>
							);
						})}
						{approvedUsers.length === 0 && (
							<p className="text-sm text-muted-foreground">No approved users found.</p>
						)}
					</div>
					{message && <p className="text-sm text-muted-foreground">{message}</p>}
				</CardContent>
			</Card>
		</div>
	);
}
