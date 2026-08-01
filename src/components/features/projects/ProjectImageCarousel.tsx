"use client";

import clsx from "clsx";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const AUTOPLAY_DELAY_MS = 3000;

interface ProjectImageCarouselProps {
  images: string[];
  title: string;
}

export function ProjectImageCarousel({
  images,
  title,
}: ProjectImageCarouselProps) {
  const t = useTranslations("projects.modal.carousel");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplayCycle, setAutoplayCycle] = useState(0);
  const [isPointerOver, setIsPointerOver] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const shouldPauseAutoplay = isPointerOver || hasFocusWithin;

  const resetAutoplay = useCallback(() => {
    setAutoplayCycle((cycle) => cycle + 1);
  }, []);

  const showImage = useCallback(
    (index: number) => {
      setCurrentIndex(index);
      resetAutoplay();
    },
    [resetAutoplay],
  );

  const showPreviousImage = useCallback(() => {
    setCurrentIndex((index) => (index - 1 + images.length) % images.length);
    resetAutoplay();
  }, [images.length, resetAutoplay]);

  const showNextImage = useCallback(() => {
    setCurrentIndex((index) => (index + 1) % images.length);
    resetAutoplay();
  }, [images.length, resetAutoplay]);

  useEffect(() => {
    if (images.length < 2 || shouldPauseAutoplay) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setCurrentIndex((index) => (index + 1) % images.length);
    }, AUTOPLAY_DELAY_MS);

    return () => window.clearInterval(intervalId);
  }, [autoplayCycle, images.length, shouldPauseAutoplay]);

  useEffect(() => {
    if (images.length < 2) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) {
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showPreviousImage();
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();
        showNextImage();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, showNextImage, showPreviousImage]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div
      className="relative aspect-video overflow-hidden border-b border-(--surface-border) bg-(--background)"
      role="region"
      aria-label={t("regionAria", { title })}
      onMouseEnter={() => setIsPointerOver(true)}
      onMouseMove={() => setIsPointerOver(true)}
      onMouseLeave={() => setIsPointerOver(false)}
      onFocusCapture={() => setHasFocusWithin(true)}
      onBlurCapture={(event) => {
        const nextTarget = event.relatedTarget;
        if (
          !(nextTarget instanceof Node) ||
          !event.currentTarget.contains(nextTarget)
        ) {
          setHasFocusWithin(false);
        }
      }}
    >
      {images.map((src, index) => {
        const isActive = index === currentIndex;

        return (
          <div
            key={src}
            className={clsx(
              "pointer-events-none absolute inset-0 transition-[opacity,transform] duration-500 ease-out motion-reduce:transform-none motion-reduce:transition-none",
              isActive
                ? "translate-x-0 opacity-100"
                : "translate-x-3 opacity-0",
            )}
            aria-hidden={!isActive}
          >
            <Image
              src={src}
              className="object-cover"
              alt={t("imageAlt", {
                title,
                index: index + 1,
                total: images.length,
              })}
              loading="eager"
              fill
              sizes="(max-width: 640px) calc(100vw - 1rem), 896px"
            />
          </div>
        );
      })}

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={showPreviousImage}
            aria-label={t("previousAria", { title })}
            className="absolute top-1/2 left-3 z-20 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/55 text-2xl text-white shadow-lg backdrop-blur-sm transition-[background-color,border-color,transform] duration-200 hover:scale-105 hover:border-white/40 hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) motion-reduce:transform-none motion-reduce:transition-none"
          >
            <FiChevronLeft aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={showNextImage}
            aria-label={t("nextAria", { title })}
            className="absolute top-1/2 right-3 z-20 inline-flex h-11 w-11 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-black/55 text-2xl text-white shadow-lg backdrop-blur-sm transition-[background-color,border-color,transform] duration-200 hover:scale-105 hover:border-white/40 hover:bg-black/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) motion-reduce:transform-none motion-reduce:transition-none"
          >
            <FiChevronRight aria-hidden="true" />
          </button>

          <div className="absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center rounded-full border border-white/15 bg-black/55 px-1.5! py-1! shadow-lg backdrop-blur-sm">
            {images.map((src, index) => {
              const isActive = index === currentIndex;

              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => showImage(index)}
                  aria-label={t("indicatorAria", {
                    title,
                    index: index + 1,
                    total: images.length,
                  })}
                  aria-current={isActive ? "true" : undefined}
                  className="group/indicator inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-(--accent)"
                >
                  <span
                    aria-hidden="true"
                    className={clsx(
                      "block rounded-full transition-[width,background-color] duration-200 motion-reduce:transition-none",
                      isActive
                        ? "h-2 w-5 bg-white"
                        : "h-2 w-2 bg-white/45 group-hover/indicator:bg-white/75",
                    )}
                  />
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </div>
  );
}
