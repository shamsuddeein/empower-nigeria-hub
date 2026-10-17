import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/electric-vehicles")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      hash: "services-ev",
    });
  },
  component: () => null,
});
