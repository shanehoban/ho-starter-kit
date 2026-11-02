import { expect, test, type Page } from "@playwright/test";

test.describe.configure({ mode: "serial" });

const password = "StarterKit!123";

function uniqueEmail(prefix: string): string {
	const random = Math.random().toString(36).slice(2, 8);
	return `${prefix}-${Date.now()}-${random}@example.com`;
}

async function gotoAllowRedirectAbort(page: Page, path: string) {
	try {
		await page.goto(path, { waitUntil: "domcontentloaded" });
	} catch (error) {
		if (!(error instanceof Error) || !error.message.includes("ERR_ABORTED")) {
			throw error;
		}
	}
}

async function registerUser(page: Page, name: string, email: string) {
	const response = await page.context().request.post("/api/auth/sign-up/email", {
		data: {
			name,
			email,
			password,
		},
	});
	if (!response.ok()) {
		throw new Error(`Registration request failed (${response.status()}): ${await response.text()}`);
	}
	await gotoAllowRedirectAbort(page, "/awaiting-approval");
}

test("enforces protected routes, rejection and later approval", async ({ browser, page }) => {
	const anonymous = await browser.newContext();
	const anonymousPage = await anonymous.newPage();
	await anonymousPage.goto("/app");
	await expect(anonymousPage).toHaveURL(/\/login$/);

	await gotoAllowRedirectAbort(anonymousPage, "/awaiting-approval");
	await expect(anonymousPage).toHaveURL(/\/$/);
	await anonymous.close();

	const adminEmail = uniqueEmail("admin");
	const memberEmail = uniqueEmail("member");

	await registerUser(page, "Audit Admin", adminEmail);
	await expect(page).toHaveURL(/\/app$/);
	await expect(page.getByText("Current role:").first()).toContainText("super-admin");

	await page.goto("/admin");
	await expect(page).toHaveURL(/\/admin\/users$/);

	const memberContext = await browser.newContext();
	const memberPage = await memberContext.newPage();
	await registerUser(memberPage, "Audit Member", memberEmail);
	await expect(memberPage).toHaveURL(/\/awaiting-approval$/);

	await memberPage.goto("/app");
	await expect(memberPage).toHaveURL(/\/awaiting-approval$/);

	await memberPage.goto("/admin/users");
	await expect(memberPage).toHaveURL(/\/awaiting-approval$/);

	await page.goto("/admin/users");
	const pendingCard = page.locator("div.rounded-md.border").filter({ hasText: memberEmail }).first();
	await expect(pendingCard).toBeVisible();
	await pendingCard.getByRole("button", { name: "Reject", exact: true }).click();
	const rejectedCard = page.locator("div.rounded-md.border").filter({ hasText: memberEmail }).first();
	await expect(rejectedCard.getByText("Rejected", { exact: true })).toBeVisible();

	// Rejection revokes existing sessions; signing in again still cannot grant app access.
	await memberPage.goto("/app");
	await expect(memberPage).toHaveURL(/\/login$/);
	const signInResponse = await memberContext.request.post("/api/auth/sign-in/email", {
		data: { email: memberEmail, password },
	});
	expect(signInResponse.ok()).toBe(true);
	await memberPage.goto("/app");
	await expect(memberPage).toHaveURL(/\/awaiting-approval$/);
	await expect(memberPage.getByText("Access request rejected", { exact: true })).toBeVisible();

	await rejectedCard.getByRole("button", { name: "Approve", exact: true }).click();
	await expect(page.getByText("User approved", { exact: true })).toBeVisible();

	await memberPage.goto("/awaiting-approval");
	await expect(memberPage).toHaveURL(/\/app$/);

	await memberPage.goto("/admin");
	await expect(memberPage).toHaveURL(/\/app$/);
	await memberContext.close();
});
