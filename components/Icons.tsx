import type { ReactElement, SVGProps } from "react";

// Meaning without words: contact details and social links are conveyed by icon
// so the page injects no UI copy of its own (which would be wrong for a tenant
// whose language and text direction are their data, not ours).

type IconProps = SVGProps<SVGSVGElement>;

const base = (props: IconProps) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  "aria-hidden": true,
  focusable: false,
  ...props,
});

export function PhoneIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.6 3.5 4.3 4.7A2 2 0 0 0 3.3 7c.6 3 2.3 5.8 4.6 8.1s5.1 4 8.1 4.6a2 2 0 0 0 2.3-1l1.2-2.3a1.3 1.3 0 0 0-.5-1.7l-2.7-1.5a1.3 1.3 0 0 0-1.5.2l-1 .9a11 11 0 0 1-4.5-4.5l.9-1a1.3 1.3 0 0 0 .2-1.5L8.3 4a1.3 1.3 0 0 0-1.7-.5Z" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="m4 7 7.3 5.2a1.2 1.2 0 0 0 1.4 0L20 7" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21c4-4.4 6-7.8 6-10.5A6 6 0 0 0 6 10.5C6 13.2 8 16.6 12 21Z" />
      <circle cx="12" cy="10.5" r="2.2" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3Z" />
    </svg>
  );
}

function InstagramIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor">
      <path d="M13.5 21v-7h2.3l.4-2.8h-2.7V9.3c0-.8.3-1.4 1.5-1.4h1.3V5.4A20 20 0 0 0 13.9 5c-2 0-3.4 1.2-3.4 3.5v2.7H8v2.8h2.5V21Z" />
    </svg>
  );
}

function WhatsappIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor">
      <path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.2A9 9 0 1 0 12 3Zm0 1.8a7.2 7.2 0 0 1 6.1 11 7.2 7.2 0 0 1-9.3 2.4l-.3-.2-2.6.7.7-2.6-.2-.3A7.2 7.2 0 0 1 12 4.8Zm-2.7 3.4c-.2 0-.4 0-.6.3-.2.3-.8.8-.8 1.9s.8 2.2.9 2.4c.2.2 1.6 2.6 4 3.5 2 .8 2.4.6 2.9.6.5 0 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.6-.4l-1.5-.7c-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1-.7-.3-1.4-.6-2.2-1.5-.3-.4-.7-.9-.8-1.1-.1-.2 0-.3.1-.4l.4-.5c.1-.2.1-.3.2-.5v-.4l-.7-1.7c-.2-.4-.4-.4-.5-.4Z" />
    </svg>
  );
}

function TiktokIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor">
      <path d="M14 3c.3 1.9 1.4 3.4 3.3 3.8v2.4c-1.2 0-2.3-.3-3.3-.9v5.6a5.1 5.1 0 1 1-5.1-5.1c.3 0 .5 0 .8.1v2.5a2.7 2.7 0 1 0 1.9 2.5V3Z" />
    </svg>
  );
}

function XIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor">
      <path d="M17.5 3h3l-6.6 7.5L21.8 21h-6l-4.7-6.1L5.7 21H2.6l7-8L2.5 3h6.1l4.2 5.6ZM16.4 19.2h1.7L7.7 4.7H5.9Z" />
    </svg>
  );
}

function YoutubeIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor">
      <path d="M22 12a26 26 0 0 0-.4-4.6 2.5 2.5 0 0 0-1.8-1.8C18.2 5.2 12 5.2 12 5.2s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.4 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.6 2.5 2.5 0 0 0 1.8 1.8c1.6.4 7.8.4 7.8.4s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12Zm-12 3V9l5.2 3Z" />
    </svg>
  );
}

function LinkedinIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor">
      <path d="M6.9 8.8v10.3H3.6V8.8ZM5.2 3.9a1.9 1.9 0 1 1 0 3.8 1.9 1.9 0 0 1 0-3.8ZM9 8.8h3.2v1.4h.05a3.5 3.5 0 0 1 3.15-1.7c3.4 0 4 2.2 4 5.1v5.5h-3.3V14c0-1.2 0-2.8-1.7-2.8s-2 1.3-2 2.7v5.2H9Z" />
    </svg>
  );
}

function TelegramIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor">
      <path d="M21.9 4.4 18.6 20c-.2 1-.9 1.3-1.7.8l-4.6-3.4-2.2 2.1c-.3.3-.5.5-1 .5l.3-4.7 8.6-7.8c.4-.3-.1-.5-.6-.2L6.8 13.4l-4.6-1.4c-1-.3-1-1 .2-1.5l18-6.9c.8-.3 1.6.2 1.5 1.2Z" />
    </svg>
  );
}

function SnapchatIcon(props: IconProps) {
  return (
    <svg {...base(props)} fill="currentColor">
      <path d="M12 3c2.3 0 4 1.8 4.1 4.1 0 .6 0 1.2-.1 1.8.3.2.7.2 1 .1.6-.2 1.3.6.7 1.2-.4.4-1.1.6-1.6.8-.3.7.6 2.3 2.4 2.9.5.2.5.8 0 1-.6.3-1.4.3-1.8.9-.2.5.2 1-.4 1.2-.7.2-1.5-.4-2.5-.2-.9.2-1.6 1.3-3.3 1.3s-2.4-1.1-3.3-1.3c-1-.2-1.8.4-2.5.2-.6-.2-.2-.7-.4-1.2-.4-.6-1.2-.6-1.8-.9-.5-.2-.5-.8 0-1 1.8-.6 2.7-2.2 2.4-2.9-.5-.2-1.2-.4-1.6-.8-.6-.6.1-1.4.7-1.2.3.1.7.1 1-.1-.1-.6-.1-1.2-.1-1.8C8 4.8 9.7 3 12 3Z" />
    </svg>
  );
}

const SOCIALS: Record<string, (p: IconProps) => ReactElement> = {
  instagram: InstagramIcon,
  facebook: FacebookIcon,
  whatsapp: WhatsappIcon,
  tiktok: TiktokIcon,
  x: XIcon,
  twitter: XIcon,
  youtube: YoutubeIcon,
  linkedin: LinkedinIcon,
  telegram: TelegramIcon,
  snapchat: SnapchatIcon,
  website: GlobeIcon,
  web: GlobeIcon,
};

export function SocialIcon({ type, ...props }: IconProps & { type: string }) {
  const Cmp = SOCIALS[type] ?? GlobeIcon;
  return <Cmp {...props} />;
}
