export const THEME_STORAGE_KEY = "ho-starter-kit-theme";

export type Theme = "light" | "dark";
type ApplyThemeOptions = {
	animate?: boolean;
};

export function isTheme(value: string | null): value is Theme {
	return value === "light" || value === "dark";
}

export function getSystemTheme(): Theme {
	if (typeof window === "undefined") {
		return "light";
	}
	return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function getStoredTheme(): Theme | null {
	if (typeof window === "undefined") {
		return null;
	}
	const value = window.localStorage.getItem(THEME_STORAGE_KEY);
	return isTheme(value) ? value : null;
}

export function resolveTheme(): Theme {
	return getStoredTheme() ?? getSystemTheme();
}

function canAnimateThemeTransition(): boolean {
	if (typeof window === "undefined") {
		return false;
	}
	return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function applyTheme(theme: Theme, options?: ApplyThemeOptions): void {
	if (typeof document === "undefined") {
		return;
	}
	const root = document.documentElement;
	const shouldAnimate = options?.animate === true && canAnimateThemeTransition();
	if (shouldAnimate) {
		root.classList.add("theme-transition");
	}
	root.classList.toggle("dark", theme === "dark");
	root.style.colorScheme = theme;
	if (shouldAnimate) {
		window.setTimeout(() => {
			root.classList.remove("theme-transition");
		}, 220);
	}
}

export function persistTheme(theme: Theme): void {
	if (typeof window === "undefined") {
		return;
	}
	window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function getThemeBootScript(): string {
	return `(() => {
  try {
    const key = "${THEME_STORAGE_KEY}";
    const stored = window.localStorage.getItem(key);
    const isStoredTheme = stored === "light" || stored === "dark";
    const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = isStoredTheme ? stored : (systemDark ? "dark" : "light");
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    root.style.colorScheme = theme;
  } catch {}
})();`;
}
