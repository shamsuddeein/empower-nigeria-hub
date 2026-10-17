import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/phones-and-gadgets")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      hash: "gadgets",
    });
  },
  component: () => null,
});
