import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/solar")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      hash: "services-solar",
    });
  },
  component: () => null,
});
