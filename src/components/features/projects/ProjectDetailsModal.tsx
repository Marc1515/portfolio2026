"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { FiArrowUpRight, FiGithub, FiMaximize2, FiX } from "react-icons/fi";

import type { Project } from "@/types/project";

interface ProjectDetailsModalProps {
  project: Project;
  title: string;
}

interface DetailSectionProps {
  title: string;
  children: ReactNode;
}

interface ScrollState {
  bodyOverflow: string;
  htmlOverflow: string;
}

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <section className="border-l-2 border-[color-mix(in_srgb,var(--accent)_55%,var(--surface-border))] pl-4! md:pl-5!">
      <h3 className="text-lg! font-semibold text-(--foreground)!">{title}</h3>
      <div className="mt-2! text-(--muted)!">{children}</div>
    </section>
  );
}

function toStringList(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }

  return [];
}

export function ProjectDetailsModal({
  project,
  title,
}: ProjectDetailsModalProps) {
  const t = useTranslations("projects");
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const scrollStateRef = useRef<ScrollState | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const titleId = `${useId()}-title`;
  const detailsKey = `items.${project.translationKey}.details`;

  const overview = project.details?.overview
    ? toStringList(t.raw(`${detailsKey}.overview`))
    : [];
  const keyFeatures = project.details?.keyFeatures
    ? toStringList(t.raw(`${detailsKey}.keyFeatures`))
    : [];
  const testing = project.details?.testing
    ? toStringList(t.raw(`${detailsKey}.testing`))
    : [];
  const deployment = project.details?.deployment
    ? toStringList(t.raw(`${detailsKey}.deployment`))
    : [];

  const unlockBackgroundScroll = useCallback(() => {
    const scrollState = scrollStateRef.current;
    if (!scrollState) {
      return;
    }

    document.body.style.overflow = scrollState.bodyOverflow;
    document.documentElement.style.overflow = scrollState.htmlOverflow;
    scrollStateRef.current = null;
  }, []);

  const lockBackgroundScroll = useCallback(() => {
    if (scrollStateRef.current) {
      return;
    }

    scrollStateRef.current = {
      bodyOverflow: document.body.style.overflow,
      htmlOverflow: document.documentElement.style.overflow,
    };
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
  }, []);

  const closeModal = useCallback(() => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, []);

  const openModal = useCallback(() => {
    const dialog = dialogRef.current;
    if (!dialog || dialog.open) {
      return;
    }

    dialog.showModal();
    setIsOpen(true);
    lockBackgroundScroll();
  }, [lockBackgroundScroll]);

  const handleDialogClose = useCallback(() => {
    setIsOpen(false);
    unlockBackgroundScroll();
    triggerRef.current?.focus({ preventScroll: true });
  }, [unlockBackgroundScroll]);

  useEffect(() => unlockBackgroundScroll, [unlockBackgroundScroll]);

  useEffect(() => {
    if (isOpen) {
      closeButtonRef.current?.focus();
    }
  }, [isOpen]);

  if (!project.details) {
    return null;
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openModal}
        aria-label={t("viewDetailsAria", { title })}
        className="group relative block aspect-video w-full cursor-pointer overflow-hidden rounded-lg border border-(--surface-border) bg-(--surface) text-left focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--accent)"
      >
        <Image
          src={project.image}
          className="block h-full w-full object-cover transition-[transform,filter] duration-300 ease-out group-hover:scale-[1.015] group-hover:brightness-90 group-focus-visible:scale-[1.015] group-focus-visible:brightness-90 motion-reduce:transform-none motion-reduce:transition-none"
          alt={t("previewAlt", { title })}
          loading={project.featured ? "eager" : "lazy"}
          priority={project.featured}
          width={640}
          height={360}
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className="pointer-events-none absolute right-3 bottom-3 inline-flex translate-y-1 items-center gap-2 rounded-full border border-white/20 bg-[color-mix(in_srgb,var(--background)_86%,transparent)] px-3! py-1.5! text-sm! font-medium text-white opacity-0 shadow-lg backdrop-blur-sm transition-[opacity,transform] duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-visible:translate-y-0 group-focus-visible:opacity-100 motion-reduce:transition-none">
          <FiMaximize2 aria-hidden="true" />
          {t("viewDetails")}
        </span>
      </button>

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-modal="true"
        className="project-details-dialog"
        onCancel={(event) => {
          event.preventDefault();
          closeModal();
        }}
        onClose={handleDialogClose}
        onClick={(event) => {
          if (event.target === event.currentTarget) {
            closeModal();
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            closeModal();
          }
        }}
      >
        <div className="max-h-[90dvh] overflow-y-auto overscroll-contain">
          <div className="sticky top-3 z-10 mb-[-3rem]! flex h-12 justify-end px-3!">
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeModal}
              aria-label={t("modal.closeAria")}
              className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-[color-mix(in_srgb,var(--background)_88%,transparent)] text-xl text-white shadow-lg backdrop-blur-sm transition-[background-color,border-color,transform] duration-200 hover:scale-105 hover:border-(--accent) hover:bg-(--surface) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) motion-reduce:transform-none motion-reduce:transition-none"
            >
              <FiX aria-hidden="true" />
            </button>
          </div>

          <div className="aspect-video overflow-hidden border-b border-(--surface-border) bg-(--background)">
            {isOpen ? (
              <Image
                src={project.image}
                className="block h-full w-full object-cover"
                alt={t("previewAlt", { title })}
                loading="eager"
                width={1280}
                height={720}
                sizes="(max-width: 640px) calc(100vw - 1rem), 896px"
              />
            ) : null}
          </div>

          <div className="p-5! sm:p-7! md:p-9!">
            <h2
              id={titleId}
              className="max-w-[44rem] text-2xl! leading-tight! font-bold text-(--foreground)! sm:text-3xl!"
            >
              {title}
            </h2>

            <div className="mt-7! flex flex-col gap-7 md:mt-8! md:gap-8">
              {overview.length > 0 ? (
                <DetailSection title={t("modal.sections.overview")}>
                  <div className="flex flex-col gap-3">
                    {overview.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </DetailSection>
              ) : null}

              {keyFeatures.length > 0 ? (
                <DetailSection title={t("modal.sections.keyFeatures")}>
                  <ul className="flex list-disc flex-col gap-2 pl-5! marker:text-(--accent)">
                    {keyFeatures.map((feature) => (
                      <li key={feature} className="pl-1!">
                        {feature}
                      </li>
                    ))}
                  </ul>
                </DetailSection>
              ) : null}

              {testing.length > 0 ? (
                <DetailSection title={t("modal.sections.testing")}>
                  <div className="flex flex-col gap-3">
                    {testing.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </DetailSection>
              ) : null}

              {deployment.length > 0 ? (
                <DetailSection title={t("modal.sections.deployment")}>
                  <div className="flex flex-col gap-3">
                    {deployment.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                </DetailSection>
              ) : null}

              {project.modalTags && project.modalTags.length > 0 ? (
                <DetailSection title={t("modal.sections.technologies")}>
                  <ul
                    className="flex flex-wrap gap-2"
                    aria-label={t("techStackAria", { title })}
                  >
                    {project.modalTags.map((tag) => (
                      <li
                        key={tag}
                        className="rounded-full border border-(--surface-border) bg-[#1a2340] px-3! py-1.5! text-sm! leading-tight! text-[#c9d8ff]"
                      >
                        {tag}
                      </li>
                    ))}
                  </ul>
                </DetailSection>
              ) : null}
            </div>

            <div className="mt-8! grid grid-cols-1 gap-3 border-t border-(--surface-border) pt-6! sm:grid-cols-2">
              {project.repoUrl ? (
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[0.85rem] border border-[color-mix(in_srgb,var(--accent)_60%,var(--surface-border))] bg-[color-mix(in_srgb,var(--accent)_16%,var(--surface))] px-4! py-3! font-semibold text-(--foreground) transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-(--accent) hover:bg-[color-mix(in_srgb,var(--accent)_24%,var(--surface))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <FiGithub aria-hidden="true" />
                  {t("repository")}
                </a>
              ) : null}
              {project.liveUrl ? (
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-[0.85rem] border border-(--surface-border) bg-(--surface) px-4! py-3! font-semibold text-(--foreground) transition-[background-color,border-color,transform] duration-200 hover:-translate-y-0.5 hover:border-(--accent) hover:bg-[color-mix(in_srgb,var(--accent)_10%,var(--surface))] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--accent) motion-reduce:transform-none motion-reduce:transition-none"
                >
                  <FiArrowUpRight aria-hidden="true" />
                  {t("live")}
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </dialog>
    </>
  );
}
