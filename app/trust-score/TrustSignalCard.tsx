"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";

import { Reveal } from "@/components/rentease/Section";

interface TrustSignalCardProps {
  label: string;
  score: number;
  note: string;
  index: number;
}

export default function TrustSignalCard({
  label,
  score,
  note,
  index,
}: TrustSignalCardProps) {
  return (
    <Reveal delay={index * 0.06}>
      <div className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <h3 className="flex items-center gap-2 font-display text-sm font-semibold">
            <span className="grid size-5 place-items-center rounded-full bg-accent text-accent-foreground">
              <Check className="size-3" />
            </span>

            {label}
          </h3>

          <span className="font-display text-sm font-semibold tabular-nums text-primary">
            {score}
          </span>
        </div>

        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {note}
        </p>

        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-surface-strong">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{
              width: `${score}%`,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.8,
            }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      </div>
    </Reveal>
  );
}
