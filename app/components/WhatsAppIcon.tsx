// WhatsApp glyph used on the per-build-contract §9 "Confirmar por
// WhatsApp" button. Stroke-less filled glyph in `currentColor` so it
// inherits the button's text color (white on the brand-green button).
export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M19.05 4.91A10 10 0 0 0 4.7 18.6L3.3 23.7a.5.5 0 0 0 .61.61l5.18-1.35A10 10 0 1 0 19.05 4.91Zm-7.04 16.5a8.32 8.32 0 0 1-4.24-1.17l-.31-.18-3.07.8.83-3-.2-.32a8.32 8.32 0 1 1 6.99 3.87Zm4.57-6.23c-.25-.13-1.49-.74-1.72-.82-.23-.08-.4-.13-.57.13-.17.25-.66.82-.81.99-.15.17-.3.19-.55.06-.25-.13-1.07-.4-2.04-1.27-.75-.67-1.26-1.49-1.41-1.74-.15-.25-.02-.39.11-.51.11-.11.25-.3.38-.45.13-.15.17-.25.25-.42.08-.17.04-.32-.02-.45-.06-.13-.57-1.37-.78-1.87-.21-.49-.42-.42-.57-.43h-.49c-.17 0-.45.06-.69.32-.23.26-.9.88-.9 2.15s.92 2.5 1.05 2.67c.13.17 1.81 2.77 4.39 3.89.61.27 1.09.42 1.46.54.61.2 1.17.17 1.61.1.49-.07 1.49-.61 1.7-1.2.21-.59.21-1.1.15-1.2-.06-.1-.23-.17-.49-.3Z" />
    </svg>
  );
}
