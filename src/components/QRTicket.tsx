"use client";

import { QRCodeSVG } from "qrcode.react";

interface QRTicketProps {
  ticketId: string;
  experienceId: string;
  className?: string;
}

export function QRTicket({
  ticketId,
  experienceId,
  className = "",
}: QRTicketProps) {
  const payload = JSON.stringify({ ticketId, experienceId });
  return (
    <div
      className={`inline-flex flex-col items-center rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900 ${className}`}
    >
      <QRCodeSVG value={payload} size={200} level="M" />
      <p className="mt-3 text-xs text-zinc-500">Ticket: {ticketId}</p>
    </div>
  );
}
