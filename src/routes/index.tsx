import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Database, GitFork, Rocket, ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/")({
	component: HomePage,
});

const githubRepoUrl = "https://github.com/shanehoban/ho-starter-kit";

const pillars = [
	{
		title: "Auth and Access",
		description:
			"Better Auth, approval flow, admin roles, and secure password reset are ready out of the box.",
		icon: ShieldCheck,
	},
	{
		title: "Data and Migrations",
		description:
			"Drizzle setup supports SQLite and Postgres with safety-first migration scripts for real deployments.",
		icon: Database,
	},
	{
		title: "Deploy and Operate",
		description:
			"Coolify-friendly defaults, Docker options, and CI smoke checks keep the template production focused.",
		icon: Rocket,
	},
] as const;

const included = [
	"TanStack Start + SSR-ready routing",
	"shadcn/ui primitives and theme toggle",
	"Drizzle ORM with SQLite and Postgres support",
	"Email provider abstraction with DB-backed email logs",
	"Admin user management with approval workflow",
	"SQLite backup/integrity scripts and Postgres migration path",
] as const;

function HomePage() {
	const { data: session } = useSession();
	const loggedIn = Boolean(session?.user);

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:py-10">
			<section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm sm:p-8">
				<div className="absolute top-4 right-4 z-10 flex items-center gap-2">
					<Button variant="outline" size="icon" asChild>
						<a
							href={githubRepoUrl}
							target="_blank"
							rel="noreferrer"
							aria-label="Open ho-starter-kit on GitHub"
							title="Open ho-starter-kit on GitHub"
						>
							<GitFork className="h-4 w-4" />
						</a>
					</Button>
					<ThemeToggle variant="outline" size="icon" />
				</div>
				<div
					aria-hidden
					className="pointer-events-none absolute inset-0 bg-[radial-gradient(650px_220px_at_50%_-140px,rgba(56,189,248,0.22),transparent_70%)]"
				/>
				<div className="relative space-y-6">
					<div className="space-y-3">
						<Badge
							variant="secondary"
							className="px-3 py-1 text-[0.7rem] tracking-[0.12em] uppercase"
						>
							Open-source starter kit
						</Badge>
						<h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
							ho-starter-kit
						</h1>
						<p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
							TanStack Start template with production-oriented auth, role access, migration safety,
							and deployment defaults.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						{loggedIn ? (
							<>
								<Button asChild>
									<Link to="/app" className="inline-flex items-center gap-2">
										Open app
									</Link>
								</Button>
								<Button variant="outline" asChild>
									<Link to="/docs">Read the docs</Link>
								</Button>
							</>
						) : (
							<Button asChild>
								<Link to="/docs">Read the docs</Link>
							</Button>
						)}
					</div>
				</div>
			</section>

			<section className="mt-5 grid gap-4 md:grid-cols-3">
				{pillars.map((pillar) => {
					const Icon = pillar.icon;
					return (
						<Card key={pillar.title} className="border-border/80 bg-card/95 shadow-sm">
							<CardHeader className="space-y-3">
								<div className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border/70 bg-background/70">
									<Icon className="h-4 w-4 text-foreground" />
								</div>
								<CardTitle className="text-base">{pillar.title}</CardTitle>
								<CardDescription>{pillar.description}</CardDescription>
							</CardHeader>
						</Card>
					);
				})}
			</section>

			<section className="mt-5">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle>What you get out of the box</CardTitle>
						<CardDescription>
							A practical default stack designed for internal tools, SaaS dashboards, and
							admin-heavy products.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3 sm:grid-cols-2">
						{included.map((item) => (
							<div
								key={item}
								className="flex items-start gap-2 rounded-md border border-border/70 bg-background/60 p-3"
							>
								<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
								<p className="text-sm text-foreground/90">{item}</p>
							</div>
						))}
					</CardContent>
				</Card>
			</section>
		</div>
	);
}
