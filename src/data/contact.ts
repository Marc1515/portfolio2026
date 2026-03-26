import { MdEmail } from "react-icons/md";
import { FaLinkedinIn, FaPhone, FaWhatsapp } from "react-icons/fa6";
import { SiGithub, SiInstagram } from "react-icons/si";

import type { ContactMethod } from "@/types/contact";

export const contactMethods = [
  {
    id: "phone",
    label: "+34 628 24 63 63",
    href: "tel:+34628246363",
    type: "phone",
    icon: FaPhone,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    href: "https://wa.me/+34628246363",
    type: "whatsapp",
    icon: FaWhatsapp,
  },
  {
    id: "email",
    label: "Email",
    href: "mailto:meq.1515@gmail.com",
    type: "email",
    icon: MdEmail,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/marc-espa%C3%B1a-833924141/",
    type: "linkedin",
    icon: FaLinkedinIn,
  },
  {
    id: "github",
    label: "GitHub",
    href: "https://github.com/Marc1515",
    type: "github",
    icon: SiGithub,
  },
  {
    id: "instagram",
    label: "Instagram",
    href: "https://www.instagram.com/marc_espp/",
    type: "instagram",
    icon: SiInstagram,
  },
] satisfies ContactMethod[];
