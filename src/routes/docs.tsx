import { createFileRoute, Link } from "@tanstack/react-router";
import {
	BookOpenText,
	CheckCircle2,
	Database,
	ExternalLink,
	Mail,
	Rocket,
	ShieldCheck,
	Terminal,
} from "lucide-react";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/docs")({
	component: DocsPage,
});

const stackDocs = [
	{
		name: "TanStack Start",
		href: "https://tanstack.com/start/latest",
		description:
			"Full-stack React framework used for routing, SSR, and server functions.",
	},
	{
		name: "TanStack Router",
		href: "https://tanstack.com/router/latest",
		description: "File-based routing with typed links and nested layouts.",
	},
	{
		name: "Better Auth",
		href: "https://www.better-auth.com/docs",
		description: "Email/password auth, sessions, and adapter integration.",
	},
	{
		name: "Drizzle ORM",
		href: "https://orm.drizzle.team/docs/overview",
		description: "Type-safe SQL ORM used for schema, queries, and migrations.",
	},
	{
		name: "Drizzle Kit",
		href: "https://orm.drizzle.team/docs/drizzle-kit-overview",
		description: "Schema diffing and migration generation tooling.",
	},
	{
		name: "PostgreSQL",
		href: "https://www.postgresql.org/docs/",
		description:
			"Production database option for managed DB and horizontal growth.",
	},
	{
		name: "SQLite",
		href: "https://www.sqlite.org/docs.html",
		description: "Default local/file database option for fast startup.",
	},
	{
		name: "React Email",
		href: "https://react.email/docs/introduction",
		description: "Templated transactional email components.",
	},
	{
		name: "Resend",
		href: "https://resend.com/docs",
		description: "Optional transactional email provider implementation.",
	},
	{
		name: "shadcn/ui",
		href: "https://ui.shadcn.com/docs",
		description: "Reusable component primitives used throughout the starter.",
	},
	{
		name: "Tailwind CSS",
		href: "https://tailwindcss.com/docs",
		description: "Utility-first styling system used by the UI layer.",
	},
	{
		name: "Coolify",
		href: "https://coolify.io/docs",
		description: "Primary deployment target for this starter and services.",
	},
] as const;

const envVars = [
	{
		name: "BETTER_AUTH_SECRET",
		required: "Required (all setups)",
		description: "High-entropy secret used to sign auth tokens and sessions.",
	},
	{
		name: "BETTER_AUTH_URL",
		required: "Required (all setups)",
		description: "Public app URL (local example: http://localhost:3000).",
	},
	{
		name: "DB_PROVIDER",
		required: "Required (all setups)",
		description: "Database provider selector: sqlite (default) or postgres.",
	},
	{
		name: "DB_PATH",
		required: "Required when DB_PROVIDER=sqlite",
		description: "SQLite file path (default: ./sqlite.db).",
	},
	{
		name: "DATABASE_URL",
		required: "Required when DB_PROVIDER=postgres",
		description:
			"Postgres connection string used by Drizzle and runtime DB client.",
	},
	{
		name: "EMAIL_PROVIDER",
		required: "Optional",
		description: "Set to null or resend (recommended default for local: null).",
	},
	{
		name: "RESEND_API_KEY",
		required: "Required when EMAIL_PROVIDER=resend",
		description: "API key for Resend provider.",
	},
	{
		name: "EMAIL_FROM",
		required: "Required when EMAIL_PROVIDER=resend",
		description: "From address label for outbound mail.",
	},
	{
		name: "BACKUP_DIR",
		required: "Optional",
		description:
			"SQLite only. Directory used by backup scripts. Default: ./backups. Ignored when DB_PROVIDER=postgres.",
	},
	{
		name: "MAX_BACKUPS",
		required: "Optional",
		description:
			"SQLite only. Number of backup files retained by db:backup/safe-migrate. Default: 15. Ignored when DB_PROVIDER=postgres.",
	},
] as const;

function DocsPage() {
	const { data: session } = useSession();
	const loggedIn = Boolean(session?.user);

	return (
		<div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-8 sm:py-10">
			<section className="relative overflow-hidden rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm sm:p-8">
				<div className="absolute top-4 right-4 z-10">
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
							Documentation
						</Badge>
						<h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
							ho-starter-kit docs
						</h1>
						<p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
							Everything needed to bootstrap, configure, and operate this
							starter kit in local development and production.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						{loggedIn ? (
							<Button asChild>
								<Link to="/app">Open app</Link>
							</Button>
						) : (
							<Button asChild>
								<Link to="/register">Create account</Link>
							</Button>
						)}
						<Button variant="outline" asChild>
							<Link to="/">Back home</Link>
						</Button>
					</div>
				</div>
			</section>

			<section className="mt-5 grid gap-4 md:grid-cols-2">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<Terminal className="h-4 w-4" />
							Quick start
						</CardTitle>
						<CardDescription>Default path uses SQLite.</CardDescription>
					</CardHeader>
					<CardContent>
						<pre className="overflow-x-auto rounded-md border border-border/70 bg-background/60 p-3 text-xs sm:text-sm">
							{`nvm use
pnpm install
cp .env.example .env
openssl rand -base64 48
# paste into BETTER_AUTH_SECRET in .env
pnpm db:generate:sqlite
pnpm db:apply-migrations
pnpm dev`}
						</pre>
					</CardContent>
				</Card>

				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<ShieldCheck className="h-4 w-4" />
							Auth model
						</CardTitle>
						<CardDescription>
							Approval-first onboarding with admin roles.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						<AuthRuleItem>
							First registered user becomes <code>super-admin</code> and is
							auto-approved.
						</AuthRuleItem>
						<AuthRuleItem>
							All later registrations are <code>member</code> and require admin
							approval.
						</AuthRuleItem>
						<AuthRuleItem>
							Authenticated users get an app area with role-gated admin
							management tools.
						</AuthRuleItem>
						<AuthRuleItem>
							Password reset and forced password-change flows are included.
						</AuthRuleItem>
					</CardContent>
				</Card>
			</section>

			<section className="mt-5">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle>Environment variables</CardTitle>
						<CardDescription>
							Copy `.env.example` to `.env` and set the values below.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						{envVars.map((item) => (
							<div
								key={item.name}
								className="rounded-md border border-border/70 bg-background/60 p-3 text-sm"
							>
								<div className="flex flex-wrap items-center gap-2">
									<code className="font-semibold">{item.name}</code>
									<Badge variant="outline">{item.required}</Badge>
								</div>
								<p className="mt-1 text-muted-foreground">{item.description}</p>
							</div>
						))}
					</CardContent>
				</Card>
			</section>

			<section className="mt-5 grid gap-4 md:grid-cols-2">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<Database className="h-4 w-4" />
							SQLite (default)
						</CardTitle>
						<CardDescription>
							Best local default and simplest deployment path.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<pre className="overflow-x-auto rounded-md border border-border/70 bg-background/60 p-3 text-xs sm:text-sm">
							{`DB_PROVIDER=sqlite
DB_PATH=./sqlite.db

pnpm db:generate:sqlite
pnpm db:apply-migrations`}
						</pre>
						<p className="text-sm text-muted-foreground">
							For safe rollout on existing SQLite data, use `pnpm
							db:safe-migrate`.
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<Database className="h-4 w-4" />
							Postgres
						</CardTitle>
						<CardDescription>
							Recommended for managed production databases.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<pre className="overflow-x-auto rounded-md border border-border/70 bg-background/60 p-3 text-xs sm:text-sm">
							{`DB_PROVIDER=postgres
DATABASE_URL=postgres://user:password@host:5432/db_name

pnpm db:generate:postgres
pnpm db:apply-migrations`}
						</pre>
						<p className="text-sm text-muted-foreground">
							The runtime `db:deploy-migrate` script auto-selects safe behavior
							by provider.
						</p>
					</CardContent>
				</Card>
			</section>

			<section className="mt-5">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<Mail className="h-4 w-4" />
							Email and audit trails
						</CardTitle>
						<CardDescription>
							All outbound emails are logged to the `email_logs` table by
							default.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">
							Use `EMAIL_PROVIDER=null` for local/dev. For production email
							delivery, set `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`, and
							`EMAIL_FROM`.
						</p>
						<pre className="overflow-x-auto rounded-md border border-border/70 bg-background/60 p-3 text-xs sm:text-sm">
							{`-- inspect recent email logs
SELECT id, "to", subject, status, provider, created_at
FROM email_logs
ORDER BY id DESC
LIMIT 50;`}
						</pre>
					</CardContent>
				</Card>
			</section>

			<section className="mt-5">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<Rocket className="h-4 w-4" />
							Ops and deployment commands
						</CardTitle>
						<CardDescription>
							Use these scripts to keep DB changes predictable.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3 sm:grid-cols-2">
						<CommandItem
							command="pnpm verify"
							note="Biome + TypeScript + tests in one command."
						/>
						<CommandItem
							command="pnpm db:check"
							note="DB integrity checks (users/accounts/super-admin invariants)."
						/>
						<CommandItem
							command="pnpm db:safe-migrate"
							note="SQLite integrity-check + backup + migration + post-check."
						/>
						<CommandItem
							command="pnpm db:deploy-migrate"
							note="Deployment migration entrypoint."
						/>
						<CommandItem
							command="pnpm db:smoke"
							note="Idempotent migration smoke test."
						/>
						<CommandItem
							command="pnpm email:preview"
							note="Preview email templates locally."
						/>
					</CardContent>
				</Card>
			</section>

			<section className="mt-5">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle>Docker and Coolify (Postgres path)</CardTitle>
						<CardDescription>
							Use the bundled compose file for local parity.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<pre className="overflow-x-auto rounded-md border border-border/70 bg-background/60 p-3 text-xs sm:text-sm">
							{`docker compose -f docker-compose.postgres.yml up --build`}
						</pre>
						<p className="text-sm text-muted-foreground">
							For Coolify, keep `DB_PROVIDER` and provider-specific connection
							values in service environment variables, then run `pnpm
							db:deploy-migrate` during start/release.
						</p>
					</CardContent>
				</Card>
			</section>

			<section className="mt-5">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<BookOpenText className="h-4 w-4" />
							Third-party documentation
						</CardTitle>
						<CardDescription>
							Official references for the technologies used by this starter.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
						{stackDocs.map((doc) => (
							<a
								key={doc.name}
								href={doc.href}
								target="_blank"
								rel="noreferrer"
								className="group rounded-md border border-border/70 bg-background/60 p-3 transition-colors hover:border-primary/40 hover:bg-background"
							>
								<div className="flex items-start justify-between gap-2">
									<p className="font-medium">{doc.name}</p>
									<ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground group-hover:text-foreground" />
								</div>
								<p className="mt-1 text-sm text-muted-foreground">
									{doc.description}
								</p>
							</a>
						))}
					</CardContent>
				</Card>
			</section>
		</div>
	);
}

function CommandItem({ command, note }: { command: string; note: string }) {
	return (
		<div className="rounded-md border border-border/70 bg-background/60 p-3">
			<div className="mb-1 inline-flex items-center gap-2">
				<CheckCircle2 className="h-4 w-4 text-primary" />
				<code className="font-semibold">{command}</code>
			</div>
			<p className="text-sm text-muted-foreground">{note}</p>
		</div>
	);
}

function AuthRuleItem({ children }: { children: ReactNode }) {
	return (
		<div className="rounded-md border border-border/70 bg-background/60 p-3 text-sm text-muted-foreground">
			<div className="inline-flex items-start gap-2">
				<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
				<span>{children}</span>
			</div>
		</div>
	);
}
