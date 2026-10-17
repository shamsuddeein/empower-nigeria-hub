import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/land-and-estate")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      hash: "land",
    });
  },
  component: () => null,
});
