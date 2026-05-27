import { Body, Container, Head, Heading, Html, Link, Preview, Text } from "@react-email/components";

interface ResetPasswordProps {
  link: string;
}

export function ResetPassword({ link }: ResetPasswordProps) {
  return (
    <Html>
      <Head />
      <Preview>Reset your FormBlox account password</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Reset your password</Heading>
          <Text style={text}>
            Someone requested a password reset for your account. Click the button below to set a new
            password.
          </Text>
          <Text style={text}>This link expires in 1 hour.</Text>
          <Text style={text}>
            If you didn&apos;t request this, you can safely ignore this email.
          </Text>
          <Link href={link} style={button}>
            Reset Password →
          </Link>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  backgroundColor: "#080808",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
};

const container = {
  maxWidth: "480px",
  margin: "40px auto",
  backgroundColor: "#111111",
  borderRadius: "12px",
  padding: "32px",
  border: "1px solid #222222",
};

const h1 = {
  color: "#F2F2F2",
  fontSize: "22px",
  fontWeight: "600",
  margin: "0 0 16px",
};

const text = {
  color: "#A0A0A0",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 12px",
};

const button = {
  display: "inline-block",
  backgroundColor: "#E8854A",
  color: "#080808",
  fontWeight: "600",
  fontSize: "14px",
  padding: "10px 20px",
  borderRadius: "8px",
  textDecoration: "none",
  marginTop: "8px",
};

export default ResetPassword;
