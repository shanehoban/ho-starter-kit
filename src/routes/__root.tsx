import { createRootRoute, HeadContent, Link, Outlet, Scripts } from "@tanstack/react-router";
import { BookOpenText, Compass, Home } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getThemeBootScript } from "@/lib/theme";
import appCss from "../styles.css?url";

export const Route = createRootRoute({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{ name: "viewport", content: "width=device-width, initial-scale=1" },
			{ title: "ho-starter-kit" },
		],
		links: [{ rel: "stylesheet", href: appCss }],
	}),
	component: RootComponent,
	shellComponent: RootDocument,
	notFoundComponent: NotFoundPage,
});

function RootDocument({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<head>
				<script>{getThemeBootScript()}</script>
				<HeadContent />
			</head>
			<body className="min-h-screen bg-background text-foreground">
				{children}
				<Scripts />
			</body>
		</html>
	);
}

function RootComponent() {
	return (
		<div className="flex min-h-screen flex-col">
			<div className="flex flex-1 flex-col">
				<Outlet />
			</div>
			<SiteFooter />
		</div>
	);
}

function NotFoundPage() {
	return (
		<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:py-14">
			<div className="mx-auto w-full max-w-2xl">
				<Card className="overflow-hidden border-border/80 shadow-sm">
					<div
						aria-hidden
						className="h-2 bg-[linear-gradient(90deg,rgba(56,189,248,0.75),rgba(99,102,241,0.55),rgba(34,197,94,0.7))]"
					/>
					<CardHeader className="space-y-3">
						<div className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border/70 bg-muted/50">
							<Compass className="h-5 w-5 text-foreground" />
						</div>
						<CardTitle className="text-2xl tracking-tight sm:text-3xl">Page not found</CardTitle>
						<CardDescription>
							The page you requested does not exist or may have been moved.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-5">
						<p className="text-sm text-muted-foreground">
							Error code: <span className="font-medium text-foreground">404</span>
						</p>
						<div className="flex flex-wrap gap-3">
							<Button asChild>
								<Link to="/" className="inline-flex items-center gap-2">
									<Home className="h-4 w-4" />
									Go home
								</Link>
							</Button>
							<Button variant="outline" asChild>
								<Link to="/docs" className="inline-flex items-center gap-2">
									<BookOpenText className="h-4 w-4" />
									Read docs
								</Link>
							</Button>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
