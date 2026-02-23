import { Link, Text } from "@react-email/components";
import { BaseEmail, buttonStyle, paragraph } from "./_shared";

type PasswordResetEmailProps = {
	userName: string;
	resetUrl: string;
	expiryMinutes: number;
};

export function PasswordResetEmail({ userName, resetUrl, expiryMinutes }: PasswordResetEmailProps) {
	return (
		<BaseEmail preview="Reset your password" title="Password reset">
			<Text style={paragraph}>Hi {userName},</Text>
			<Text style={paragraph}>
				Use the button below to reset your password. This link expires in {expiryMinutes} minutes.
			</Text>
			<Link href={resetUrl} style={buttonStyle}>
				Reset password
			</Link>
		</BaseEmail>
	);
}

export default PasswordResetEmail;
