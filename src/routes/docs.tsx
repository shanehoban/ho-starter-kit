import { createFileRoute, Link } from "@tanstack/react-router";
import {
	BookOpenText,
	CheckCircle2,
	Database,
	ExternalLink,
	FileCheck2,
	FlaskConical,
	Github,
	Mail,
	Rocket,
	ShieldAlert,
	ShieldCheck,
	Terminal,
} from "lucide-react";
import { type ReactNode, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSession } from "@/lib/auth-client";

export const Route = createFileRoute("/docs")({
	component: DocsPage,
});

const githubRepoUrl = "https://github.com/shanehoban/ho-starter-kit";

const docsTabs = [
	{
		id: "included",
		label: "Included",
		subtitle: "What ships out of the box",
		icon: BookOpenText,
	},
	{
		id: "new-project",
		label: "Use It",
		subtitle: "Start a new project locally",
		icon: Terminal,
	},
	{
		id: "contributing",
		label: "Contribute",
		subtitle: "Work directly on the starter",
		icon: FileCheck2,
	},
] as const;

type DocsTab = (typeof docsTabs)[number]["id"];

const stackDocs = [
	{
		name: "TanStack Start",
		href: "https://tanstack.com/start/latest",
		description: "Framework used for routing, SSR, and server functions.",
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
		description: "Production DB option for managed services and scale.",
	},
	{
		name: "SQLite",
		href: "https://www.sqlite.org/docs.html",
		description: "Default file DB option for fast local startup.",
	},
	{
		name: "React Email",
		href: "https://react.email/docs/introduction",
		description: "Templated transactional email components.",
	},
	{
		name: "Resend",
		href: "https://resend.com/docs",
		description: "Optional transactional email provider.",
	},
	{
		name: "shadcn/ui",
		href: "https://ui.shadcn.com/docs",
		description: "Reusable UI primitives used throughout the starter.",
	},
	{
		name: "Tailwind CSS",
		href: "https://tailwindcss.com/docs",
		description: "Utility-first styling system used by the UI layer.",
	},
	{
		name: "Coolify",
		href: "https://coolify.io/docs",
		description: "Primary deployment target for this starter.",
	},
] as const;

const includedFeatures = [
	"TanStack Start app shell with typed routing and SSR",
	"Approval-first auth model (member/admin/super-admin)",
	"Admin tools: user approval, role management, password reset flows",
	"Email logging persisted in DB by default (provider optional)",
	"SQLite + Postgres migration scripts and smoke checks",
	"Route/security E2E coverage and release audit pipeline",
] as const;

const authRules = [
	"First registered user becomes super-admin and is auto-approved.",
	"Later registrations are member users and require admin approval.",
	"Unapproved users are redirected to /awaiting-approval for protected areas.",
	"Password reset and forced-password-change flows are included.",
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
		name: "BETTER_AUTH_TRUSTED_ORIGINS",
		required: "Optional",
		description:
			"Comma-separated absolute origins additionally trusted by Better Auth. BETTER_AUTH_URL origin is always trusted.",
	},
	{
		name: "CSP_SCRIPT_NONCE",
		required: "Optional (recommended in production)",
		description:
			"Nonce string used by CSP for inline SSR scripts (theme boot + TanStack hydration scripts).",
	},
	{
		name: "DB_PROVIDER",
		required: "Required (all setups)",
		description: "Database selector: sqlite (default) or postgres.",
	},
	{
		name: "DB_PATH",
		required: "Required when DB_PROVIDER=sqlite",
		description: "SQLite file path (default: ./sqlite.db).",
	},
	{
		name: "DATABASE_URL",
		required: "Required when DB_PROVIDER=postgres",
		description: "Postgres connection string used by Drizzle and runtime DB client.",
	},
	{
		name: "EMAIL_PROVIDER",
		required: "Optional",
		description: "Set to null or resend (recommended local default: null).",
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
			"SQLite only. Backup output directory (default: ./backups). Ignored when DB_PROVIDER=postgres.",
	},
	{
		name: "MAX_BACKUPS",
		required: "Optional",
		description:
			"SQLite only. Backup retention count (default: 15). Ignored when DB_PROVIDER=postgres.",
	},
] as const;

const securityPolicies = [
	"Dependency audit fails on moderate severity and above by default.",
	"Exceptions must be in security/audit-allowlist.json with a reason and expiry date.",
	"Expired exceptions fail security:audit until renewed or removed.",
	"Route and write-operation guardrails are enforced by pnpm security:check.",
] as const;

const namingAndRouteRules = [
	"Run pnpm naming:check to validate scripts, env vars, route names, and server file names.",
	"Route tests in src/routes must be prefixed with '-' so route generation ignores them.",
	"Use pnpm scripts only; avoid calling node scripts directly in normal contributor workflow.",
	"Nitro loads nitro.config.ts automatically during build/runtime; no manual import in vite.config.ts is required.",
] as const;

function DocsPage() {
	const { data: session } = useSession();
	const loggedIn = Boolean(session?.user);
	const [activeTab, setActiveTab] = useState<DocsTab>("included");

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
							<Github className="h-4 w-4" />
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
							Documentation
						</Badge>
						<h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
							ho-starter-kit docs
						</h1>
						<p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
							Primary reference for setup, usage, security defaults, and contribution workflow.
						</p>
					</div>

					<div className="flex flex-wrap items-center gap-3">
						{loggedIn ? (
							<Button asChild>
								<Link to="/app">Go to app</Link>
							</Button>
						) : null}
						<Button variant="outline" asChild>
							<Link to="/">Home</Link>
						</Button>
					</div>
				</div>
			</section>

			<section className="mt-5">
				<div
					role="tablist"
					aria-label="ho-starter-kit docs sections"
					className="grid gap-2 rounded-xl border border-border/80 bg-card/70 p-2 sm:grid-cols-3"
				>
					{docsTabs.map((tab) => {
						const TabIcon = tab.icon;

						return (
							<button
								key={tab.id}
								type="button"
								role="tab"
								aria-selected={activeTab === tab.id}
								onClick={() => setActiveTab(tab.id)}
								className={`rounded-lg border px-3 py-2 text-left transition-colors ${
									activeTab === tab.id
										? "border-primary/40 bg-background text-foreground"
										: "border-transparent bg-transparent text-muted-foreground hover:border-border hover:bg-background/60"
								}`}
							>
								<div className="flex items-center gap-2">
									<TabIcon className="h-4 w-4 shrink-0" />
									<div>
										<p className="font-medium text-sm">{tab.label}</p>
										<p className="text-xs">{tab.subtitle}</p>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			</section>

			<div role="tabpanel" className="mt-5">
				{activeTab === "included" && <IncludedTabContent />}
				{activeTab === "new-project" && <NewProjectTabContent />}
				{activeTab === "contributing" && <ContributingTabContent />}
			</div>
		</div>
	);
}

function IncludedTabContent() {
	return (
		<div className="space-y-5">
			<section className="grid gap-4 md:grid-cols-2">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<Rocket className="h-4 w-4" />
							What is included
						</CardTitle>
						<CardDescription>
							Core capabilities included in every generated project.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-2">
						{includedFeatures.map((item) => (
							<ChecklistItem key={item}>{item}</ChecklistItem>
						))}
					</CardContent>
				</Card>

				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<ShieldCheck className="h-4 w-4" />
							Auth model
						</CardTitle>
						<CardDescription>Approval-first onboarding with role-gated access.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						{authRules.map((rule) => (
							<AuthRuleItem key={rule}>{rule}</AuthRuleItem>
						))}
					</CardContent>
				</Card>
			</section>

			<section>
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<Mail className="h-4 w-4" />
							Email and audit behavior
						</CardTitle>
						<CardDescription>
							Outbound emails are logged in DB even when no external provider is configured.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">
							Use <code>EMAIL_PROVIDER=null</code> for local/dev. This keeps flows testable without
							real delivery. Set <code>EMAIL_PROVIDER=resend</code>, <code>RESEND_API_KEY</code>,
							and <code>EMAIL_FROM</code> when you want real sends.
						</p>
						<pre className="overflow-x-auto rounded-md border border-border/70 bg-background/60 p-3 text-xs sm:text-sm">
							{`SELECT id, "to", subject, status, provider, created_at
FROM email_logs
ORDER BY id DESC
LIMIT 50;`}
						</pre>
					</CardContent>
				</Card>
			</section>

			<section>
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
								<p className="mt-1 text-sm text-muted-foreground">{doc.description}</p>
							</a>
						))}
					</CardContent>
				</Card>
			</section>
		</div>
	);
}

function NewProjectTabContent() {
	return (
		<div className="space-y-5">
			<section className="grid gap-4 md:grid-cols-2">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<Terminal className="h-4 w-4" />
							SQLite setup (default)
						</CardTitle>
						<CardDescription>Fastest local start path for new projects.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<pre className="overflow-x-auto rounded-md border border-border/70 bg-background/60 p-3 text-xs sm:text-sm">
							{`cp .env.example .env
# set BETTER_AUTH_SECRET, BETTER_AUTH_URL, DB_PROVIDER=sqlite, DB_PATH=./sqlite.db
pnpm db:generate:sqlite
pnpm db:apply-migrations
pnpm dev`}
						</pre>
						<p className="text-sm text-muted-foreground">
							Use <code>pnpm db:safe-migrate</code> whenever you need cautious SQLite schema rollout
							on existing local data.
						</p>
					</CardContent>
				</Card>

				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<Database className="h-4 w-4" />
							Postgres setup
						</CardTitle>
						<CardDescription>Local parity path for managed production Postgres.</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<pre className="overflow-x-auto rounded-md border border-border/70 bg-background/60 p-3 text-xs sm:text-sm">
							{`cp .env.example .env
# set BETTER_AUTH_SECRET, BETTER_AUTH_URL, DB_PROVIDER=postgres
# set DATABASE_URL=postgres://postgres:postgres@localhost:5432/ho_starter_kit
# terminal 1: start postgres
pnpm start:local:db
# terminal 2:
pnpm db:generate:postgres
pnpm db:apply-migrations
pnpm dev`}
						</pre>
						<p className="text-sm text-muted-foreground">
							Local Postgres mode expects Postgres running first (docker recommended), then run
							<code>pnpm dev</code> in a separate terminal. Migration scripts load variables from{" "}
							<code>.env</code> automatically.
						</p>
					</CardContent>
				</Card>
			</section>

			<section>
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle>Environment variables</CardTitle>
						<CardDescription>
							Set these in <code>.env</code> before running migrations or dev server.
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

			<section className="space-y-4">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<Rocket className="h-4 w-4" />
							Coolify and deployment
						</CardTitle>
						<CardDescription>
							Recommended build and runtime setup for Coolify (SQLite and Postgres paths).
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<p className="text-sm text-muted-foreground">
							Build pack: use <code>Nixpacks</code> by default (repository includes{" "}
							<code>nixpacks.toml</code>). Dockerfile is also supported. Docker Compose is only
							needed when you want app + Postgres in one stack.
						</p>
						<div className="rounded-md border border-border/70 bg-background/60 p-3 text-sm">
							<p className="font-medium text-foreground">Important behavior</p>
							<p className="mt-1 text-muted-foreground">
								Setting <code>DB_PROVIDER=postgres</code> only switches app runtime behavior. It
								does not create or start a Postgres database automatically.
							</p>
						</div>
						<section className="grid gap-4 md:grid-cols-2">
							<div className="rounded-md border border-border/70 bg-background/60 p-3 text-sm">
								<p className="font-medium text-foreground">
									SQLite on Coolify (single app service)
								</p>
								<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
									<li>Deploy app using Nixpacks (recommended) or Dockerfile.</li>
									<li>
										Add persistent storage mount at <code>/app/data</code>.
									</li>
									<li>No external DB service is required.</li>
								</ul>
								<pre className="mt-3 overflow-x-auto rounded-md border border-border/70 bg-background p-2 text-xs">
									{`DB_PROVIDER=sqlite
DB_PATH=/app/data/sqlite.db
BACKUP_DIR=/app/data/backups
BETTER_AUTH_URL=https://your-app.example
BETTER_AUTH_SECRET=...`}
								</pre>
							</div>
							<div className="rounded-md border border-border/70 bg-background/60 p-3 text-sm">
								<p className="font-medium text-foreground">
									Postgres on Coolify (single app + separate DB service)
								</p>
								<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
									<li>Deploy app using Nixpacks (recommended) or Dockerfile.</li>
									<li>
										Create a Postgres service in Coolify (or use an external managed Postgres).
									</li>
									<li>
										Set <code>DATABASE_URL</code> to that service connection string.
									</li>
									<li>Do not configure SQLite volume settings for this mode.</li>
								</ul>
								<pre className="mt-3 overflow-x-auto rounded-md border border-border/70 bg-background p-2 text-xs">
									{`DB_PROVIDER=postgres
DATABASE_URL=postgres://user:password@postgres-host:5432/db_name
BETTER_AUTH_URL=https://your-app.example
BETTER_AUTH_SECRET=...`}
								</pre>
							</div>
						</section>
						<div className="rounded-md border border-border/70 bg-background/60 p-3 text-sm">
							<p className="font-medium text-foreground">
								Docker Compose stack mode (app + Postgres together)
							</p>
							<p className="mt-1 text-muted-foreground">
								Use this only if you want Coolify to run web + database in one compose stack. In
								this mode, app-to-DB host is typically the compose service name (for this repo:
								<code>postgres</code>), not <code>localhost</code>.
							</p>
							<ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
								<li>Coolify resource type: Docker Compose.</li>
								<li>
									Compose file/path: <code>docker-compose.postgres.yml</code>.
								</li>
								<li>
									Expose the <code>app</code> service (port <code>3000</code>).
								</li>
							</ul>
							<pre className="mt-3 overflow-x-auto rounded-md border border-border/70 bg-background p-2 text-xs">
								{`DB_PROVIDER=postgres
DATABASE_URL=postgres://postgres:postgres@postgres:5432/ho_starter_kit`}
							</pre>
						</div>
						<div className="rounded-md border border-border/70 bg-background/60 p-3 text-sm">
							<p className="font-medium text-foreground">Environment variable injection</p>
							<p className="mt-1 text-muted-foreground">
								Compose uses <code>${"{VAR}"}</code> substitution, so set variables once in Coolify
								(stack environment) and they are injected into services automatically.
							</p>
							<pre className="mt-3 overflow-x-auto rounded-md border border-border/70 bg-background p-2 text-xs">
								{`# required
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=https://your-app.example
CSP_SCRIPT_NONCE=...
DB_PROVIDER=postgres

# recommended explicit Postgres values
POSTGRES_USER=postgres
POSTGRES_PASSWORD=change-this
POSTGRES_DB=ho_starter_kit
DATABASE_URL=postgres://postgres:change-this@postgres:5432/ho_starter_kit`}
							</pre>
							<p className="mt-2 text-muted-foreground">
								If you change <code>POSTGRES_USER</code>, <code>POSTGRES_PASSWORD</code>, or{" "}
								<code>POSTGRES_DB</code>, update <code>DATABASE_URL</code> to match.
							</p>
							<p className="mt-2 text-muted-foreground">
								In Coolify, set <code>NODE_ENV</code> as runtime-only. Avoid build-time{" "}
								<code>NODE_ENV=production</code> because Node package managers may skip
								build-required devDependencies.
							</p>
						</div>
						<pre className="overflow-x-auto rounded-md border border-border/70 bg-background/60 p-3 text-xs sm:text-sm">
							{`# startup / release command
pnpm db:deploy-migrate
# then run app
node .output/server/index.mjs`}
						</pre>
						<p className="text-sm text-muted-foreground">
							For Postgres release checks, <code>pnpm release:audit:postgres</code> starts a
							temporary database from <code>docker-compose.audit-postgres.yml</code> to mirror CI.
							This file is for audit/test runs only, not normal app deployment.
						</p>
					</CardContent>
				</Card>
			</section>
		</div>
	);
}

function ContributingTabContent() {
	return (
		<div className="space-y-5">
			<section className="grid gap-4 md:grid-cols-2">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<Terminal className="h-4 w-4" />
							Contributor workflow
						</CardTitle>
						<CardDescription>Default local cycle for making changes safely.</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3">
						<CommandItem command="pnpm install" note="Install dependencies." />
						<CommandItem command="pnpm dev" note="Run local app while developing." />
						<CommandItem
							command="pnpm start:local:db"
							note="Start local Postgres when DB_PROVIDER=postgres."
						/>
						<CommandItem
							command="pnpm verify"
							note="Fast pre-commit check: format/lint/typecheck/unit tests."
						/>
						<CommandItem
							command="pnpm quality:check"
							note="Full contributor gate before opening PR (includes security + naming + audit)."
						/>
					</CardContent>
				</Card>

				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<FlaskConical className="h-4 w-4" />
							Release validation
						</CardTitle>
						<CardDescription>
							Run before tagging releases to validate both DB providers end-to-end.
						</CardDescription>
					</CardHeader>
					<CardContent className="grid gap-3">
						<CommandItem
							command="pnpm release:check"
							note="Runs full SQLite + Postgres release matrix."
						/>
						<CommandItem
							command="pnpm release:audit:sqlite"
							note="Run only SQLite release path when iterating quickly."
						/>
						<CommandItem
							command="pnpm release:audit:postgres"
							note="Run only Postgres release path with docker-backed DB."
						/>
						<CommandItem
							command="RELEASE_AUDIT_MAX_ARTIFACTS=10 pnpm release:check"
							note="Optional cap for local artifacts/release-audit retention."
						/>
					</CardContent>
				</Card>
			</section>

			<section className="grid gap-4 md:grid-cols-2">
				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<ShieldAlert className="h-4 w-4" />
							Security and naming rules
						</CardTitle>
						<CardDescription>
							These rules are expected for every contribution before merge.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-2">
						{securityPolicies.map((rule) => (
							<AuthRuleItem key={rule}>{rule}</AuthRuleItem>
						))}
						{namingAndRouteRules.map((rule) => (
							<AuthRuleItem key={rule}>{rule}</AuthRuleItem>
						))}
					</CardContent>
				</Card>

				<Card className="border-border/80 shadow-sm">
					<CardHeader>
						<CardTitle className="inline-flex items-center gap-2">
							<ShieldCheck className="h-4 w-4" />
							Automation status
						</CardTitle>
						<CardDescription>
							Current repository behavior and contributor expectations.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3">
						<div className="rounded-md border border-border/70 bg-background/60 p-3">
							<p className="font-medium text-sm text-foreground">Before opening a PR</p>
							<p className="mt-1 text-sm text-muted-foreground">
								No pre-commit hook is configured in this repository.
							</p>
							<div className="mt-3 flex flex-wrap gap-2">
								<Badge variant="outline">
									<code>pnpm verify</code>
								</Badge>
								<Badge variant="outline">
									<code>pnpm quality:check</code>
								</Badge>
							</div>
						</div>

						<div className="rounded-md border border-border/70 bg-background/60 p-3">
							<p className="font-medium text-sm text-foreground">Command policy</p>
							<p className="mt-1 text-sm text-muted-foreground">
								Use <code>pnpm</code> scripts for routine development. Internal scripts under{" "}
								<code>scripts/</code> are wrapped and should not be called directly during normal
								contributor workflow.
							</p>
						</div>
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

function ChecklistItem({ children }: { children: ReactNode }) {
	return (
		<div className="flex items-start gap-2 rounded-md border border-border/70 bg-background/60 p-3 text-sm text-foreground/90">
			<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
			<span>{children}</span>
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
