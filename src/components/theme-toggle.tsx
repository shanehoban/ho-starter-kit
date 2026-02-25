import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { applyTheme, persistTheme, resolveTheme, type Theme } from "@/lib/theme";

type ThemeToggleProps = {
	className?: string;
	variant?: "ghost" | "outline";
	size?: "icon" | "sm";
};

export function ThemeToggle({ className, variant = "ghost", size = "icon" }: ThemeToggleProps) {
	const [theme, setTheme] = useState<Theme>("light");
	const [ready, setReady] = useState(false);

	useEffect(() => {
		const resolved = resolveTheme();
		setTheme(resolved);
		applyTheme(resolved);
		setReady(true);
	}, []);

	const handleToggle = () => {
		const next: Theme = theme === "dark" ? "light" : "dark";
		setTheme(next);
		applyTheme(next, { animate: true });
		persistTheme(next);
	};

	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant={variant}
					size={size}
					className={className}
					aria-label={
						ready ? `Switch to ${theme === "dark" ? "light" : "dark"} mode` : "Toggle theme"
					}
					onClick={handleToggle}
				>
					{theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
				</Button>
			</TooltipTrigger>
			<TooltipContent>Toggle theme</TooltipContent>
		</Tooltip>
	);
}
