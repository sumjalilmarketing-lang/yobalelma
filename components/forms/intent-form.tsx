"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  type YobalelmaIntentInput,
  yobalelmaIntentSchema,
} from "@/lib/validation/yobalelma-intent";

type IntentFormProps = {
  defaultIntent?: YobalelmaIntentInput["intent"];
};

export function IntentForm({ defaultIntent = "send_parcel" }: IntentFormProps) {
  const form = useForm<YobalelmaIntentInput>({
    resolver: zodResolver(yobalelmaIntentSchema),
    defaultValues: {
      intent: defaultIntent,
      origin: "",
      destination: "",
    },
  });

  return (
    <form
      className="grid gap-3"
      onSubmit={form.handleSubmit(() => undefined)}
      noValidate
    >
      <input type="hidden" {...form.register("intent")} />
      <Input placeholder="Ville de depart" {...form.register("origin")} />
      <Input placeholder="Ville d'arrivee" {...form.register("destination")} />
      <Button type="submit">Continuer</Button>
    </form>
  );
}

