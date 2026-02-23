import { Link, Text } from "@react-email/components";
import { BaseEmail, buttonStyle, paragraph } from "./_shared";

type UserApprovedEmailProps = {
	userName: string;
	loginUrl: string;
};

export function UserApprovedEmail({ userName, loginUrl }: UserApprovedEmailProps) {
	return (
		<BaseEmail preview="Your account is approved" title="Account approved">
			<Text style={paragraph}>Hi {userName},</Text>
			<Text style={paragraph}>Your account has been approved. You can now sign in.</Text>
			<Link href={loginUrl} style={buttonStyle}>
				Sign in
			</Link>
		</BaseEmail>
	);
}

export default UserApprovedEmail;
