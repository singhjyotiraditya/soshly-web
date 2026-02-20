"use client";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, children }: BottomSheetProps) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close"
        className="fixed inset-0 z-40 bg-black/80"
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 bottom-0 z-50 rounded-t-3xl border border-white/40 bg-transparent p-6 backdrop-blur-xl"
        style={{
          boxShadow:
            "0 -4px 24px rgba(0,0,0,0.1), inset 0 0 20px 10px rgba(255,255,255,0.2)",
        }}
      >
        {children}
      </div>
    </>
  );
}
