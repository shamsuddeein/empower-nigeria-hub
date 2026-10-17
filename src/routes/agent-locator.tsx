import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/agent-locator")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      hash: "agents",
    });
  },
  component: () => null,
});
