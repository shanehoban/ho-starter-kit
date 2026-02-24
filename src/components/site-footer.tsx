import { Link } from "@tanstack/react-router";
import { useSession } from "@/lib/auth-client";
import { ThemeToggle } from "./theme-toggle";

export function SiteFooter() {
	const year = new Date().getFullYear();
	const { data: session } = useSession();
	const isLoggedIn = Boolean(session?.user);

	return (
		<footer className="border-t bg-background/90 backdrop-blur-sm">
			<div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
				<p className="text-center sm:text-left">
					Built with{" "}
					<a
						href="https://github.com/shanehoban/ho-starter-kit"
						target="_blank"
						rel="noreferrer"
						className="font-medium text-foreground transition-colors hover:text-primary"
					>
						ho-starter-kit
					</a>{" "}
					&copy; {year}
				</p>
				<nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 sm:justify-end">
					<Link to="/" className="transition-colors hover:text-foreground">
						Home
					</Link>
					<Link to="/docs" className="transition-colors hover:text-foreground">
						Docs
					</Link>
					<a
						href="https://github.com/shanehoban/ho-starter-kit"
						target="_blank"
						rel="noreferrer"
						className="transition-colors hover:text-foreground"
					>
						GitHub
					</a>
					{!isLoggedIn && (
						<Link to="/login" className="transition-colors hover:text-foreground">
							Log in
						</Link>
					)}
					<ThemeToggle variant="ghost" size="icon" className="h-8 w-8" />
				</nav>
			</div>
		</footer>
	);
}
