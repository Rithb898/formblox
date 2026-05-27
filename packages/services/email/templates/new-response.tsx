import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";

interface NewResponseEmailProps {
  formTitle: string;
  responseCount: number;
  responsesUrl: string;
}

export function NewResponseEmail({
  formTitle,
  responseCount,
  responsesUrl,
}: NewResponseEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>New response on &quot;{formTitle}&quot;</Preview>
      <Body style={body}>
        <Container style={container}>
          <Heading style={h1}>New Response 🎉</Heading>
          <Text style={text}>
            Someone just submitted <strong>{formTitle}</strong>.
          </Text>
          <Text style={text}>
            Total responses: <strong>{responseCount}</strong>
          </Text>
          <Link href={responsesUrl} style={button}>
            View Responses →
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

export default NewResponseEmail;
