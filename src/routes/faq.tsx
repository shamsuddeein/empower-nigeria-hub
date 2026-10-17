import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/faq")({
  beforeLoad: () => {
    throw redirect({
      to: "/",
      hash: "faq",
    });
  },
  component: () => null,
});
