import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/become-an-agent")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      hash: "become-agent",
    });
  },
  component: () => null,
});
