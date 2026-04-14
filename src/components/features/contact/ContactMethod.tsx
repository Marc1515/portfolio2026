"use client";

import { useRef } from "react";
import { gsap } from "gsap";
import type { IconType } from "react-icons";
import { MdEmail } from "react-icons/md";
import { FaLinkedinIn, FaPhone, FaWhatsapp } from "react-icons/fa6";
import { SiGithub, SiInstagram } from "react-icons/si";

import type { ContactMethod as ContactMethodModel } from "@/types/contact";

interface ContactMethodProps {
  method: Pick<ContactMethodModel, "id" | "label" | "href" | "type">;
}

const iconHoverColorByType: Record<ContactMethodModel["type"], string> = {
  email: "#ef4444",
  linkedin: "#0A66C2",
  github: "#ffffff",
  instagram: "#E4405F",
  whatsapp: "#25D366",
  phone: "#38bdf8",
};

const iconByType: Record<ContactMethodModel["type"], IconType> = {
  email: MdEmail,
  linkedin: FaLinkedinIn,
  github: SiGithub,
  instagram: SiInstagram,
  whatsapp: FaWhatsapp,
  phone: FaPhone,
};

export function ContactMethod({ method }: ContactMethodProps) {
  const Icon = iconByType[method.type];
  const articleRef = useRef<HTMLElement | null>(null);
  const iconContainerRef = useRef<HTMLSpanElement | null>(null);

  const handleMouseEnter = () => {
    if (!articleRef.current || !iconContainerRef.current) return;
    const currentIconColor = getComputedStyle(iconContainerRef.current).color;

    gsap.to(articleRef.current, {
      scale: 1.02,
      borderColor:
        "color-mix(in srgb, var(--accent) 40%, var(--surface-border))",
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto",
    });

    gsap.fromTo(
      iconContainerRef.current,
      { color: currentIconColor },
      {
        color: iconHoverColorByType[method.type],
        duration: 0.22,
        ease: "none",
        overwrite: "auto",
      },
    );
  };

  const handleMouseLeave = () => {
    if (!articleRef.current || !iconContainerRef.current) return;
    const currentIconColor = getComputedStyle(iconContainerRef.current).color;

    gsap.to(articleRef.current, {
      scale: 1,
      borderColor: "var(--surface-border)",
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto",
    });

    gsap.fromTo(
      iconContainerRef.current,
      { color: currentIconColor },
      {
        color: "var(--muted)",
        duration: 0.22,
        ease: "none",
        overwrite: "auto",
      },
    );
  };

  return (
    <article
      ref={articleRef}
      className="bg-(--surface) border border-(--surface-border) rounded-(--radius) p-(--space-2)! cursor-pointer"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <a
        className="flex justify-between"
        href={method.href}
        target="_blank"
        rel="noreferrer"
      >
        <span
          ref={iconContainerRef}
          className="inline-flex items-center will-change-[color]"
          style={{ color: "var(--muted)" }}
        >
          <Icon className="w-5 h-5!" aria-hidden="true" />
        </span>
        <span>{method.label}</span>
      </a>
    </article>
  );
}
