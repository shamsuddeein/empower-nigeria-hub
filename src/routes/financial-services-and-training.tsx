import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/financial-services-and-training")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      hash: "services-finance",
    });
  },
  component: () => null,
});
