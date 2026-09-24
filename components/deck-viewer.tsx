"use client";

import { useCallback, useEffect, useState } from "react";

import { DeckStatusBadge } from "@/components/deck-status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Progress, ProgressLabel, ProgressValue } from "@/components/ui/progress";
import { Spinner } from "@/components/ui/spinner";
import type { DeckDetail } from "@/lib/types/deck";

const POLL_INTERVAL_MS = 3000;

function isGenerating(status: DeckDetail["status"]) {
  return status === "PENDING" || status === "GENERATING";
}

export function DeckViewer({ deckId }: { deckId: string }) {
  const [deck, setDeck] = useState<DeckDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  const fetchDeck = useCallback(async () => {
    const response = await fetch(`/api/decks/${deckId}`);

    if (!response.ok) {
      throw new Error("Deck not found");
    }

    return response.json() as Promise<DeckDetail>;
  }, [deckId]);

  // Initial load
  useEffect(() => {
    fetchDeck()
      .then(setDeck)
      .catch(() => setLoadError("Could not load this deck."));
  }, [fetchDeck]);

  // Poll while generating
  useEffect(() => {
    if (!deck || !isGenerating(deck.status)) {
      return;
    }

    const interval = setInterval(() => {
      fetchDeck()
        .then(setDeck)
        .catch(() => setLoadError("Could not refresh deck status."));
    }, POLL_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [deck, fetchDeck]);

  // Track carousel slide number
  useEffect(() => {
    if (!carouselApi) {
      return;
    }

    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };

    onSelect();
    carouselApi.on("select", onSelect);

    return () => {
      carouselApi.off("select", onSelect);
    };
  }, [carouselApi]);

  if (loadError) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{loadError}</AlertDescription>
      </Alert>
    );
  }

  if (!deck) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Spinner className="size-5" />
        <span>Loading deck…</span>
      </div>
    );
  }

  const displayTitle = deck.title ?? "Untitled Pitch Deck";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">
            {displayTitle}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">{deck.idea}</p>
        </div>
        <DeckStatusBadge status={deck.status} />
      </div>

      {isGenerating(deck.status) ? (
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-dashed p-12 text-center">
          <Spinner className="size-8" />
          <div className="space-y-1">
            <p className="font-medium">Generating your pitch deck…</p>
            <p className="text-sm text-muted-foreground">
              This runs in the background via Inngest. The page refreshes every few
              seconds.
            </p>
            {deck.slides.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {deck.slides.length} slide{deck.slides.length === 1 ? "" : "s"} ready
                so far
              </p>
            ) : null}
          </div>
          <Progress value={null} className="w-full max-w-md">
            <ProgressLabel className="sr-only">Generating</ProgressLabel>
            <ProgressValue />
          </Progress>
        </div>
      ) : null}

      {deck.status === "FAILED" ? (
        <Alert variant="destructive">
          <AlertTitle>Generation failed</AlertTitle>
          <AlertDescription>
            {deck.errorMessage ?? "Something went wrong while generating this deck."}
          </AlertDescription>
        </Alert>
      ) : null}

      {deck.status === "COMPLETE" && deck.slides.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
            <span>
              Slide <strong className="font-semibold text-foreground">{currentSlide + 1}</strong> of{" "}
              {deck.slides.length}
            </span>
            <span className="text-xs">Use arrows or drag to navigate</span>
          </div>

          <Carousel setApi={setCarouselApi} className="mx-auto w-full max-w-5xl px-12">
            <CarouselContent>
              {deck.slides.map((slide) => (
                <CarouselItem key={slide.id}>
                  <article className="group relative flex w-full flex-col md:flex-row items-stretch justify-between gap-6 md:gap-8 overflow-hidden rounded-2xl border bg-card p-6 md:p-8 shadow-sm ring-1 ring-foreground/5 aspect-auto md:aspect-[16/9] min-h-[400px] md:min-h-[420px]">
                    {/* Left Column: Slide Number, Title, Content */}
                    <div className="flex flex-1 flex-col justify-between space-y-4 overflow-y-auto pr-1">
                      <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          <span className="flex size-5 items-center justify-center rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                            {slide.order}
                          </span>
                          Slide {slide.order}
                        </div>
                        <h2 className="font-heading text-xl md:text-2xl font-bold tracking-tight text-card-foreground">
                          {slide.title}
                        </h2>
                        <p className="whitespace-pre-line text-sm md:text-base leading-relaxed text-muted-foreground font-normal">
                          {slide.content}
                        </p>
                      </div>
                    </div>

                    {/* Right Column: Visual / Image Container */}
                    {slide.imageUrl ? (
                      <div className="relative w-full md:w-[45%] shrink-0 min-h-[200px] md:min-h-0 aspect-video md:aspect-auto overflow-hidden rounded-xl border border-border/60 bg-muted/50">
                        <img
                          src={slide.imageUrl}
                          alt={slide.title}
                          className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : null}
                  </article>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      ) : null}
    </div>
  );
}
