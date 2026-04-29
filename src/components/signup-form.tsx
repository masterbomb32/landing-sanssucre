import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

import { REWARDS } from "@/lib/rewards";
import { createSignup } from "@/server/signup.functions";
import { siteCopy } from "@/lib/site-copy";
import { Link } from "@tanstack/react-router";

const PH_MOBILE = /^(\+?63|0)?9\d{9}$/;

const Schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100),
  mobile: z
    .string()
    .trim()
    .refine((v) => PH_MOBILE.test(v.replace(/\s|-/g, "")), {
      message: "Enter a valid PH mobile (e.g. 09171234567).",
    }),
  email: z
    .string()
    .trim()
    .max(254)
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  rewardChoice: z.string().min(1, "Please choose a reward"),
});

type FormValues = z.infer<typeof Schema>;

export function SignupForm() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(Schema),
    defaultValues: { name: "", mobile: "", email: "", rewardChoice: "" },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const { code } = await createSignup({
        data: {
          name: values.name,
          mobile: values.mobile,
          email: values.email || undefined,
          rewardChoice: values.rewardChoice,
        },
      });
      toast.success("You're in! Saving your reward…");
      navigate({ to: "/receipt/$code", params: { code } });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Maria Santos" autoComplete="name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="mobile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mobile number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="09171234567"
                    inputMode="tel"
                    autoComplete="tel"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Email <span className="text-muted-foreground">(optional)</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" type="email" autoComplete="email" {...field} />
              </FormControl>
              <FormDescription>
                We'll send your reward by SMS. Add an email for a copy too.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="rewardChoice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Choose your reward</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid gap-3 sm:grid-cols-3"
                >
                  {REWARDS.map((r) => (
                    <label
                      key={r.id}
                      htmlFor={`reward-${r.id}`}
                      className={`group flex cursor-pointer flex-col rounded-lg border bg-card p-4 transition-colors hover:border-primary ${
                        field.value === r.id
                          ? "border-primary ring-2 ring-primary/30"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="text-3xl" aria-hidden>
                          {r.emoji}
                        </div>
                        <RadioGroupItem id={`reward-${r.id}`} value={r.id} />
                      </div>
                      <div className="mt-3 font-display text-lg font-semibold">{r.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{r.description}</div>
                    </label>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-4">
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" /> : null}
            {siteCopy.form.submit}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            {siteCopy.form.consentPrefix}{" "}
            <Link to="/privacy" className="text-primary underline underline-offset-2">
              {siteCopy.form.consentLinkLabel}
            </Link>
            . {siteCopy.form.fineprint}
          </p>
        </div>
      </form>
    </Form>
  );
}