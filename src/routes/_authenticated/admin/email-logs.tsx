import { createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { getEmailLogs, retryFailedEmailLog } from "@/server/email-logs";
import { searchUsersForAdmin } from "@/server/users";

const EMAIL_TYPES = ["user_registered", "user_approved", "password_reset"] as const;
const EMAIL_STATUSES = ["pending", "sent", "delivered", "bounced", "failed"] as const;

const STATUS_BADGE_STYLES: Record<string, string> = {
	pending: "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300",
	sent: "border-sky-500/40 bg-sky-500/10 text-sky-700 dark:text-sky-300",
	delivered: "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
	bounced: "border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-300",
	failed: "border-destructive/40 bg-destructive/10 text-destructive",
};

export const Route = createFileRoute("/_authenticated/admin/email-logs")({
	component: EmailLogsPage,
	beforeLoad: ({ context }) => {
		const role = context.user.role;
		if (role !== "admin" && role !== "super-admin") {
			throw redirect({ to: "/app" });
		}
	},
	loader: async () => {
		const logs = await getEmailLogs({ data: {} });
		return { logs };
	},
});

function EmailLogsPage() {
	const { user } = Route.useRouteContext();
	const { logs: initialLogs } = Route.useLoaderData();
	const [logs, setLogs] = useState(initialLogs);
	const [filters, setFilters] = useState({ type: "", status: "", userId: "" });
	const [loading, setLoading] = useState(false);
	const [retryingId, setRetryingId] = useState<number | null>(null);
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [query, setQuery] = useState("");
	const [userQuery, setUserQuery] = useState("");
	const [selectedUser, setSelectedUser] = useState<{
		id: string;
		name: string;
		email: string;
	} | null>(null);
	const [userOptions, setUserOptions] = useState<
		Array<{ id: string; name: string; email: string }>
	>([]);
	const [searchingUsers, setSearchingUsers] = useState(false);
	const [userDropdownOpen, setUserDropdownOpen] = useState(false);

	const fetchLogs = async (nextFilters: typeof filters) => {
		setLoading(true);
		setError("");
		setMessage("");
		try {
			const nextLogs = await getEmailLogs({
				data: {
					type: nextFilters.type || undefined,
					status: nextFilters.status || undefined,
					userId: nextFilters.userId || undefined,
				},
			});
			setLogs(nextLogs);
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Failed to load email logs");
		} finally {
			setLoading(false);
		}
	};

	const handleFilterChange = async (key: "type" | "status" | "userId", value: string) => {
		const next = { ...filters, [key]: value };
		setFilters(next);
		await fetchLogs(next);
	};

	const handleRetry = async (logId: number) => {
		setRetryingId(logId);
		setError("");
		setMessage("");
		try {
			const result = await retryFailedEmailLog({ data: { logId } });
			await fetchLogs(filters);
			setMessage(
				result.success
					? "Email retry queued."
					: `Retry created a new failed log: ${result.error ?? "provider rejected the email"}`,
			);
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError.message : "Failed to retry email");
		} finally {
			setRetryingId(null);
		}
	};

	const visibleLogs = useMemo(() => {
		const trimmed = query.trim().toLowerCase();
		if (!trimmed) return logs;

		return logs.filter((log) => {
			return (
				log.to.toLowerCase().includes(trimmed) ||
				log.subject.toLowerCase().includes(trimmed) ||
				log.type.toLowerCase().includes(trimmed) ||
				log.status.toLowerCase().includes(trimmed) ||
				(log.userName ?? "").toLowerCase().includes(trimmed)
			);
		});
	}, [logs, query]);

	useEffect(() => {
		const trimmed = userQuery.trim();
		if (selectedUser || trimmed.length < 2) {
			setUserOptions([]);
			setSearchingUsers(false);
			return;
		}

		let cancelled = false;
		setSearchingUsers(true);
		const timeoutId = setTimeout(async () => {
			try {
				const results = await searchUsersForAdmin({ data: { query: trimmed, limit: 8 } });
				if (!cancelled) {
					setUserOptions(results);
					setUserDropdownOpen(true);
				}
			} catch {
				if (!cancelled) {
					setUserOptions([]);
				}
			} finally {
				if (!cancelled) {
					setSearchingUsers(false);
				}
			}
		}, 250);

		return () => {
			cancelled = true;
			clearTimeout(timeoutId);
		};
	}, [selectedUser, userQuery]);

	const clearUserFilter = async () => {
		setSelectedUser(null);
		setUserQuery("");
		setUserOptions([]);
		setUserDropdownOpen(false);
		await handleFilterChange("userId", "");
	};

	const handleUserSelect = (user: { id: string; name: string; email: string }) => {
		setSelectedUser(user);
		setUserQuery(`${user.name} (${user.email})`);
		setUserOptions([]);
		setUserDropdownOpen(false);
		void handleFilterChange("userId", user.id);
	};

	const formatTypeLabel = (value: string) =>
		value
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

	const formatStatusLabel = (value: string) =>
		value
			.split("_")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");

	const formatDateTime = (value: Date | null) => {
		if (!value) return "—";
		return new Date(value).toLocaleString();
	};

	const canRetryFailedEmails = user.role === "super-admin";

	return (
		<div className="space-y-4">
			<Card className="border-border/80 shadow-sm">
				<CardHeader>
					<CardTitle>Email logs</CardTitle>
					<CardDescription>Review outbound emails and delivery statuses.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid gap-3 md:grid-cols-4">
						<div className="space-y-1.5">
							<label htmlFor="email-log-type" className="text-sm font-medium">
								Type
							</label>
							<Select
								value={filters.type || "__all__"}
								onValueChange={(value) =>
									handleFilterChange("type", value === "__all__" ? "" : value)
								}
								disabled={loading}
							>
								<SelectTrigger id="email-log-type">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__all__">All types</SelectItem>
									{EMAIL_TYPES.map((type) => (
										<SelectItem key={type} value={type}>
											{formatTypeLabel(type)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<label htmlFor="email-log-status" className="text-sm font-medium">
								Status
							</label>
							<Select
								value={filters.status || "__all__"}
								onValueChange={(value) =>
									handleFilterChange("status", value === "__all__" ? "" : value)
								}
								disabled={loading}
							>
								<SelectTrigger id="email-log-status">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="__all__">All statuses</SelectItem>
									{EMAIL_STATUSES.map((status) => (
										<SelectItem key={status} value={status}>
											{formatStatusLabel(status)}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="space-y-1.5">
							<div className="flex items-center justify-between gap-2">
								<label htmlFor="email-log-user" className="text-sm font-medium">
									User
								</label>
								{filters.userId && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										className="h-auto px-1.5 py-0.5 text-xs"
										onClick={() => void clearUserFilter()}
										disabled={loading}
									>
										Clear
									</Button>
								)}
							</div>
							<div className="relative">
								<Input
									id="email-log-user"
									value={userQuery}
									placeholder="Search name or email"
									onFocus={() => {
										if (!selectedUser && userQuery.trim().length >= 2) {
											setUserDropdownOpen(true);
										}
									}}
									onBlur={() => {
										setTimeout(() => setUserDropdownOpen(false), 120);
									}}
									onChange={(event) => {
										const nextValue = event.target.value;
										setUserQuery(nextValue);
										setSelectedUser(null);
										setUserDropdownOpen(true);
										if (filters.userId) {
											void handleFilterChange("userId", "");
										}
									}}
									disabled={loading}
								/>
								{userDropdownOpen && !selectedUser && userQuery.trim().length >= 2 && (
									<div className="absolute z-20 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">
										{searchingUsers ? (
											<div className="px-2 py-2 text-sm text-muted-foreground">Searching...</div>
										) : userOptions.length === 0 ? (
											<div className="px-2 py-2 text-sm text-muted-foreground">No users found</div>
										) : (
											userOptions.map((user) => (
												<button
													key={user.id}
													type="button"
													className="w-full rounded px-2 py-1.5 text-left text-sm hover:bg-accent"
													onMouseDown={(event) => event.preventDefault()}
													onClick={() => handleUserSelect(user)}
												>
													<div className="font-medium">{user.name}</div>
													<div className="text-xs text-muted-foreground">{user.email}</div>
												</button>
											))
										)}
									</div>
								)}
							</div>
						</div>

						<div className="space-y-1.5">
							<label htmlFor="email-log-search" className="text-sm font-medium">
								Search
							</label>
							<Input
								id="email-log-search"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="to, subject, status"
								disabled={loading}
							/>
						</div>
					</div>

					{message && <p className="text-sm text-muted-foreground">{message}</p>}
					{error && <p className="text-sm text-destructive">{error}</p>}

					<div className="rounded-md border">
						<div className="hidden overflow-x-auto md:block">
							<table className="w-full">
								<thead>
									<tr className="border-b bg-muted/40">
										<th className="px-3 py-2 text-left text-sm font-medium">Date</th>
										<th className="px-3 py-2 text-left text-sm font-medium">To</th>
										<th className="px-3 py-2 text-left text-sm font-medium">Subject</th>
										<th className="px-3 py-2 text-left text-sm font-medium">Type</th>
										<th className="px-3 py-2 text-left text-sm font-medium">Status</th>
										{canRetryFailedEmails && (
											<th className="px-3 py-2 text-right text-sm font-medium">Actions</th>
										)}
									</tr>
								</thead>
								<tbody>
									{visibleLogs.length === 0 ? (
										<tr>
											<td
												colSpan={canRetryFailedEmails ? 6 : 5}
												className="px-3 py-8 text-center text-sm text-muted-foreground"
											>
												{loading ? "Loading..." : "No email logs found"}
											</td>
										</tr>
									) : (
										visibleLogs.map((log) => (
											<tr key={log.id} className="border-b hover:bg-accent/40">
												<td className="px-3 py-2 text-sm">{formatDateTime(log.createdAt)}</td>
												<td className="px-3 py-2 text-sm">
													<div className="max-w-[260px]">
														<p className="truncate font-medium">{log.to}</p>
														{log.userName && (
															<p className="truncate text-xs text-muted-foreground">
																{log.userName}
															</p>
														)}
													</div>
												</td>
												<td className="max-w-[300px] px-3 py-2 text-sm">
													<p className="truncate">{log.subject}</p>
												</td>
												<td className="px-3 py-2 text-sm">
													<Badge variant="outline" className="text-xs">
														{formatTypeLabel(log.type)}
													</Badge>
												</td>
												<td className="px-3 py-2 text-sm">
													<Badge
														variant="outline"
														className={cn(
															"font-medium",
															STATUS_BADGE_STYLES[log.status] ??
																"border-border text-muted-foreground",
														)}
													>
														{formatStatusLabel(log.status)}
													</Badge>
													{log.error && (
														<p className="mt-1 max-w-[240px] truncate text-xs text-destructive">
															{log.error}
														</p>
													)}
												</td>
												{canRetryFailedEmails && (
													<td className="px-3 py-2 text-right text-sm">
														{log.status === "failed" ? (
															<Button
																type="button"
																variant="outline"
																size="sm"
																disabled={retryingId === log.id || loading}
																onClick={() => void handleRetry(log.id)}
															>
																{retryingId === log.id ? "Retrying..." : "Retry"}
															</Button>
														) : (
															<span className="text-xs text-muted-foreground">—</span>
														)}
													</td>
												)}
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>

						<div className="space-y-2 p-2 md:hidden">
							{visibleLogs.length === 0 ? (
								<div className="rounded-md border border-dashed px-3 py-8 text-center text-sm text-muted-foreground">
									{loading ? "Loading..." : "No email logs found"}
								</div>
							) : (
								visibleLogs.map((log) => (
									<div key={log.id} className="space-y-2 rounded-md border bg-card/80 p-3">
										<div className="flex items-start justify-between gap-2">
											<div className="min-w-0">
												<p className="truncate text-sm font-medium">{log.subject}</p>
												<p className="truncate text-xs text-muted-foreground">{log.to}</p>
											</div>
											<Badge
												variant="outline"
												className={cn(
													"font-medium",
													STATUS_BADGE_STYLES[log.status] ?? "border-border text-muted-foreground",
												)}
											>
												{formatStatusLabel(log.status)}
											</Badge>
										</div>
										<div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
											<Badge variant="outline" className="text-[10px]">
												{formatTypeLabel(log.type)}
											</Badge>
											<span>{formatDateTime(log.createdAt)}</span>
											{log.userName && <span>{log.userName}</span>}
										</div>
										{log.error && <p className="text-xs text-destructive">{log.error}</p>}
										{canRetryFailedEmails && log.status === "failed" && (
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="w-full"
												disabled={retryingId === log.id || loading}
												onClick={() => void handleRetry(log.id)}
											>
												{retryingId === log.id ? "Retrying..." : "Retry email"}
											</Button>
										)}
									</div>
								))
							)}
						</div>
					</div>

					<p className="text-sm text-muted-foreground">
						Showing {visibleLogs.length} email log{visibleLogs.length === 1 ? "" : "s"}.
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
