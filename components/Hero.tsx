"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bath,
  BedDouble,
  MapPin,
  Ruler,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/rentease-data";
import skyline from "@/assets/prop-skyline.jpg";

export function Hero() {
  return (
    <section className="mesh-lavender relative overflow-hidden border-b border-border">
      <div className="mx-auto grid w-full max-w-[1400px] gap-16 px-6 py-16 sm:px-10 sm:py-24 lg:grid-cols-[1.15fr_1fr] lg:gap-20 xl:gap-28 lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-xs sm:text-sm font-bold uppercase tracking-[0.2em] text-primary">
            SMART RENTING, MADE SIMPLE
          </p>

          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.08] tracking-tight text-foreground sm:text-5xl md:text-[3.5rem] lg:text-[4rem] xl:text-[4.35rem]">
            Find a home.
            <br />
            <span className="text-primary">Know the risk.</span>
            <br />
            Pay a fair rent.
          </h1>

          <p className="mt-6 max-w-2xl text-lg sm:text-xl lg:text-[1.35rem] leading-relaxed text-muted-foreground font-normal">
            RentEase helps tenants and landlords make better rental decisions
            through intelligent listing assessment and data-driven rent
            estimation.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <Button size="lg" className="rounded-full px-8 py-4 text-base sm:text-lg font-semibold shadow-md gap-2.5 h-auto" render={<Link href="/properties" />}>
              Explore Properties <ArrowRight className="size-5" />
            </Button>

            <Button size="lg" variant="outline" className="rounded-full px-8 py-4 text-base sm:text-lg font-semibold h-auto" render={<Link href="/rent-estimator" />}>
              Estimate Your Rent
            </Button>
          </div>

          <dl className="mt-14 grid max-w-lg grid-cols-3 gap-8 pt-2">
            {[
              { k: "9,200+", v: "Listings assessed" },
              { k: "5 cities", v: "Live coverage" },
              { k: "18 signals", v: "Per risk review" },
            ].map((stat) => (
              <div key={stat.k}>
                <dt className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                  {stat.k}
                </dt>
                <dd className="mt-1 text-sm font-medium text-muted-foreground">{stat.v}</dd>
              </div>
            ))}
          </dl>
        </motion.div>

        <HeroComposition />
      </div>
    </section>
  );
}

function HeroComposition() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15 }}
      className="relative mx-auto w-full max-w-xl lg:max-w-none"
    >
      <div className="overflow-hidden rounded-3xl border border-border/80 bg-card shadow-lift">
        <Image
          src={skyline}
          alt="Modern 2 BHK apartment tower in Hyderabad"
          priority
          className="h-64 w-full object-cover sm:h-72 lg:h-80"
        />

        <div className="p-7 sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Modern 2 BHK Apartment
              </h2>

              <p className="mt-1.5 flex items-center gap-1.5 text-base font-medium text-muted-foreground">
                <MapPin className="size-4" />
                Hyderabad
              </p>
            </div>

            <div className="text-right">
              <p className="font-display text-2xl font-bold text-foreground">
                {formatINR(24000)}
              </p>
              <p className="text-xs text-muted-foreground font-medium">/ month</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-3 rounded-2xl bg-surface/80 px-4 py-3.5 text-sm font-semibold text-foreground border border-border/50">
            <span className="flex items-center gap-2">
              <BedDouble className="size-4 text-muted-foreground" />
              2 Beds
            </span>
            <span className="flex items-center gap-2">
              <Bath className="size-4 text-muted-foreground" />
              2 Baths
            </span>
            <span className="flex items-center gap-2">
              <Ruler className="size-4 text-muted-foreground" />
              1,250 sq ft
            </span>
          </div>

          <div className="mt-6 flex items-center justify-between rounded-2xl border border-primary/15 bg-lavender-soft/60 px-6 py-4.5">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-primary">
                TRUST SCORE
              </p>
              <p className="mt-1 font-display text-2xl font-bold text-primary-deep">
                92/100
              </p>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-sm font-bold text-primary shadow-xs border border-primary/10">
              <ShieldCheck className="size-4" />
              Low Risk
            </span>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.45 }}
        className="absolute -bottom-8 -left-4 sm:-left-8 w-68 sm:w-72 rounded-2xl border border-border/80 bg-card p-5 shadow-lift backdrop-blur-md"
      >
        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-warm">
          <Sparkles className="size-3.5" />
          AI RENT ESTIMATE
        </p>
        <p className="mt-1.5 font-display text-xl font-bold text-foreground">
          ₹22,500 – ₹25,000
        </p>
        <p className="mt-1 text-xs font-medium text-muted-foreground">
          Within expected range
        </p>
      </motion.div>
    </motion.div>
  );
}
