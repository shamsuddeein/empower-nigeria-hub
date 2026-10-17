import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  category: z.string().optional(),
  product: z.string().optional(),
  price: z.coerce.number().optional(),
  duration: z.coerce.number().optional(),
  frequency: z.enum(["weekly", "monthly"]).optional(),
});

export const Route = createFileRoute("/apply")({
  validateSearch: (s) => searchSchema.parse(s),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/",
      hash: "apply",
      search,
    });
  },
  component: () => null,
});
