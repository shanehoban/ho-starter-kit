import { MessageSquare, Send } from "lucide-react";
import { type FormEvent, type ReactNode, useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
	type FeedbackActionInput,
	type FeedbackCategory,
	feedbackCategories,
	feedbackCategoryLabels,
} from "@/lib/feedback";

type FeedbackStatus = {
	tone: "success" | "error";
	text: string;
} | null;

type FeedbackFormProps = {
	category: FeedbackCategory;
	message: string;
	context: string;
	status: FeedbackStatus;
	sending: boolean;
	onCategoryChange: (category: FeedbackCategory) => void;
	onMessageChange: (message: string) => void;
	onContextChange: (context: string) => void;
	onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};

export function FeedbackForm(props: FeedbackFormProps) {
	return (
		<form className="space-y-4" onSubmit={props.onSubmit}>
			<div className="space-y-2">
				<Label htmlFor="feedback-category">Category</Label>
				<Select value={props.category} onValueChange={props.onCategoryChange}>
					<SelectTrigger id="feedback-category">
						<SelectValue />
					</SelectTrigger>
					<SelectContent>
						{feedbackCategories.map((category) => (
							<SelectItem key={category} value={category}>
								{feedbackCategoryLabels[category]}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>

			<div className="space-y-2">
				<Label htmlFor="feedback-message">Message</Label>
				<Textarea
					id="feedback-message"
					value={props.message}
					onChange={(event) => props.onMessageChange(event.target.value)}
					placeholder="What should I know?"
					maxLength={4000}
					rows={5}
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="feedback-context">Context</Label>
				<Textarea
					id="feedback-context"
					value={props.context}
					onChange={(event) => props.onContextChange(event.target.value)}
					placeholder="Steps, expected behavior, or anything else useful"
					maxLength={2000}
					rows={3}
				/>
			</div>

			{props.status ? (
				<div
					aria-live="polite"
					className={
						props.status.tone === "success"
							? "rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-emerald-700 text-sm dark:text-emerald-300"
							: "rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-destructive text-sm"
					}
				>
					{props.status.text}
				</div>
			) : null}

			<DialogFooter>
				<Button type="submit" disabled={props.sending || props.message.trim().length < 5}>
					<Send className="h-4 w-4" />
					{props.sending ? "Sending" : "Send feedback"}
				</Button>
			</DialogFooter>
		</form>
	);
}

export function FeedbackDialog({
	trigger,
	onSendFeedback,
}: {
	trigger?: ReactNode;
	onSendFeedback: (input: FeedbackActionInput) => Promise<unknown>;
}) {
	const [open, setOpen] = useState(false);
	const [category, setCategory] = useState<FeedbackCategory>("bug");
	const [message, setMessage] = useState("");
	const [context, setContext] = useState("");
	const [status, setStatus] = useState<FeedbackStatus>(null);
	const [sending, setSending] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setSending(true);
		setStatus(null);
		try {
			await onSendFeedback({
				category,
				message,
				context,
				currentUrl: window.location.href,
			});
			setMessage("");
			setContext("");
			setStatus({ tone: "success", text: "Feedback sent. Thank you." });
		} catch (error) {
			setStatus({
				tone: "error",
				text: error instanceof Error ? error.message : "Feedback could not be sent right now.",
			});
		} finally {
			setSending(false);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				{trigger || (
					<Button variant="ghost" size="icon" aria-label="Send feedback">
						<MessageSquare className="h-4 w-4" />
					</Button>
				)}
			</DialogTrigger>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>Send feedback</DialogTitle>
					<DialogDescription>Share a bug, question, or idea from this app.</DialogDescription>
				</DialogHeader>
				<FeedbackForm
					category={category}
					message={message}
					context={context}
					status={status}
					sending={sending}
					onCategoryChange={setCategory}
					onMessageChange={setMessage}
					onContextChange={setContext}
					onSubmit={handleSubmit}
				/>
			</DialogContent>
		</Dialog>
	);
}
