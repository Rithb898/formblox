import { Body, Container, Head, Heading, Html, Link, Preview, Text } from "@react-email/components";

interface VerifyEmailProps {
  link: string;
}

export function VerifyEmail({ link }: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email to activate your FormBlox account</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>Verify your email</Heading>
          <Text style={text}>
            Thanks for signing up! Click the button below to verify your email address and get
            started.
          </Text>
          <Text style={text}>This link expires in 24 hours.</Text>
          <Link href={link} style={button}>
            Verify Email →
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

export default VerifyEmail;
