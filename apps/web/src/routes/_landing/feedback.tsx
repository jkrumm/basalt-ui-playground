import {
  Button,
  Callout,
  FormGroup,
  H2,
  HTMLSelect,
  InputGroup,
  Intent,
  TextArea,
} from "@blueprintjs/core";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageLayout } from "../../components/layout/PageLayout.tsx";

export const Route = createFileRoute("/_landing/feedback")({
  component: FeedbackPage,
});

function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState("general");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <PageLayout>
        <div style={{ padding: "4rem 2rem", maxWidth: 560, margin: "0 auto" }}>
          <Callout intent={Intent.SUCCESS} title="Thank you for your feedback!">
            Your message has been received. We appreciate you taking the time to share your
            thoughts.
          </Callout>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div style={{ padding: "4rem 2rem", maxWidth: 560, margin: "0 auto" }}>
        <H2>Feedback</H2>
        <p
          style={{
            color: "var(--bp-typography-color-default-disabled)",
            marginBottom: "2rem",
          }}
        >
          Have a suggestion, found a bug, or just want to say hello? We'd love to hear from you.
        </p>

        <form onSubmit={handleSubmit}>
          <FormGroup label="Name" labelFor="name">
            <InputGroup
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </FormGroup>

          <FormGroup label="Email" labelFor="email" helperText="Optional">
            <InputGroup
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
          </FormGroup>

          <FormGroup label="Type" labelFor="type">
            <HTMLSelect
              id="type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              options={[
                { label: "General Feedback", value: "general" },
                { label: "Bug Report", value: "bug" },
                { label: "Feature Request", value: "feature" },
              ]}
            />
          </FormGroup>

          <FormGroup label="Message" labelFor="message">
            <TextArea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message..."
              style={{ width: "100%", minHeight: 120 }}
            />
          </FormGroup>

          <Button
            type="submit"
            intent="primary"
            text="Send Feedback"
            disabled={!name.trim() || !message.trim()}
          />
        </form>
      </div>
    </PageLayout>
  );
}
