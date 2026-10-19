import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Hr,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

export function EmailLayout({
  title,
  preview,
  children,
}: {
  title: string;
  preview?: string;
  children: ReactNode;
}) {
  return (
    <Html lang="en">
      <Head />
      {preview ? <Preview>{preview}</Preview> : null}
      <Body style={{ fontFamily: "Arial, Helvetica, sans-serif", background: "#f3f4f6", margin: 0 }}>
        <Container style={{ background: "#ffffff", padding: 24, maxWidth: 600 }}>
          <Heading as="h1" style={{ fontSize: 20, color: "#1a3e8c" }}>
            {title}
          </Heading>
          {children}
          <Hr />
          <Section>
            <Text style={{ fontSize: 12, color: "#6b7280" }}>
              Villanova University Tech Crew ·{" "}
              <Link href="https://www.vutc.com">www.vutc.com</Link> ·{" "}
              <Link href="mailto:events@vutc.com">events@vutc.com</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function DetailTable({ rows }: { rows: [string, string][] }) {
  return (
    <table cellPadding={4} style={{ fontSize: 14, borderCollapse: "collapse" }}>
      <tbody>
        {rows
          .filter(([, v]) => v !== "")
          .map(([k, v]) => (
            <tr key={k}>
              <td style={{ color: "#6b7280", verticalAlign: "top", paddingRight: 12 }}>{k}</td>
              <td style={{ whiteSpace: "pre-wrap" }}>{v}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );
}

export function Button({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "inline-block",
        background: "#1a3e8c",
        color: "#ffffff",
        padding: "10px 16px",
        borderRadius: 4,
        textDecoration: "none",
        fontSize: 14,
      }}
    >
      {children}
    </Link>
  );
}
