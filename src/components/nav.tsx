import { Link } from "@tanstack/react-router";
import { ChevronDown, LogOut, Menu, Shield, User } from "lucide-react";
import { FeedbackDialog } from "@/components/feedback-dialog";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth-client";
import type { FeedbackActionInput } from "@/lib/feedback";
import { ThemeToggle } from "./theme-toggle";

export function Nav({
	user,
	pendingApprovalCount,
	onSendFeedback,
}: {
	user: { name: string; email: string; role: string };
	pendingApprovalCount?: number;
	onSendFeedback: (input: FeedbackActionInput) => Promise<unknown>;
}) {
	const isAdmin = user.role === "admin" || user.role === "super-admin";

	return (
		<nav className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl supports-backdrop-filter:bg-background/70">
			<div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-3 sm:px-4">
				<div className="flex items-center gap-3 sm:gap-6">
					<Link to="/app" className="font-bold text-lg tracking-tight">
						ho-starter-kit
					</Link>
					<div className="hidden sm:flex items-center gap-1">
						<Button variant="ghost" size="sm" asChild>
							<Link to="/app" activeProps={{ className: "bg-accent" }}>
								Dashboard
							</Link>
						</Button>
						<Button variant="ghost" size="sm" asChild>
							<Link to="/docs" activeProps={{ className: "bg-accent" }}>
								Docs
							</Link>
						</Button>
						<Button variant="ghost" size="sm" asChild>
							<Link to="/profile" activeProps={{ className: "bg-accent" }}>
								Profile
							</Link>
						</Button>
						{isAdmin && (
							<>
								<Button variant="ghost" size="sm" asChild>
									<Link to="/admin/users" activeProps={{ className: "bg-accent" }}>
										<Shield className="mr-1 h-4 w-4" />
										Users
										{pendingApprovalCount ? (
											<span className="ml-1 rounded-full bg-primary/15 px-1.5 py-0.5 text-center text-xs font-medium text-primary">
												{pendingApprovalCount}
											</span>
										) : null}
									</Link>
								</Button>
								<Button variant="ghost" size="sm" asChild>
									<Link to="/admin/email-logs" activeProps={{ className: "bg-accent" }}>
										Email Logs
									</Link>
								</Button>
							</>
						)}
					</div>
				</div>

				<div className="flex items-center gap-1.5 sm:gap-2">
					<FeedbackDialog onSendFeedback={onSendFeedback} />
					<ThemeToggle variant="ghost" size="icon" />
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="sm" className="h-8 flex items-center justify-center">
								<Menu className="h-4 w-4 sm:hidden" />
								<span className="text-sm font-medium sm:hidden">Menu</span>
								<User className="hidden h-4 w-4 sm:block" />
								<span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
								<ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56 p-1.5">
							<div className="rounded-md bg-muted/40 px-2.5 py-2">
								<div className="text-sm font-medium">{user.name}</div>
								<div className="truncate text-xs text-muted-foreground">{user.email}</div>
							</div>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<Link to="/app">Dashboard</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link to="/docs">Docs</Link>
							</DropdownMenuItem>
							<DropdownMenuItem asChild>
								<Link to="/profile">Profile</Link>
							</DropdownMenuItem>
							{isAdmin && (
								<>
									<DropdownMenuItem asChild>
										<Link to="/admin">Admin</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link to="/admin/email-logs">Email Logs</Link>
									</DropdownMenuItem>
								</>
							)}
							<DropdownMenuSeparator />
							<DropdownMenuItem
								onClick={async () => {
									await signOut();
									window.location.href = "/login";
								}}
							>
								<LogOut className="mr-2 h-4 w-4" />
								Logout
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		</nav>
	);
}
