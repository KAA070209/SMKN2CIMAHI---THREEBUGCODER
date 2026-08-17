import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";

export function ConfirmDialog({
  open,
  title = "Anda yakin keluar?",
  message = "Sesi kamu akan berakhir dan kamu harus masuk kembali untuk melanjutkan.",
  confirmText = "Keluar Sesi",
  cancelText = "Batal",
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") onCancel?.();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      style={overlayStyle}
      className="bk-confirm-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.();
      }}
    >
      <section
        style={modalStyle}
        className="bk-confirm-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bk-confirm-title"
      >
        <span style={iconStyle} aria-hidden="true">
          <LogOut size={24} strokeWidth={2.2} />
        </span>
        <h2 id="bk-confirm-title" style={titleStyle}>
          {title}
        </h2>
        <p style={messageStyle}>{message}</p>
        <div style={actionsStyle}>
          <button type="button" style={cancelStyle} className="bk-confirm-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button type="button" style={confirmStyle} className="bk-confirm-primary" onClick={onConfirm} autoFocus>
            <LogOut size={16} strokeWidth={2.2} />
            {confirmText}
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 600,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 28,
  background: "rgba(28, 18, 16, 0.42)",
  backdropFilter: "blur(2px)",
};

const modalStyle = {
  position: "relative",
  width: "min(380px, 100%)",
  background: "#fff",
  color: "#211714",
  borderRadius: 14,
  padding: "34px 30px 28px",
  boxShadow: "0 28px 48px -22px rgba(0, 0, 0, 0.62)",
  textAlign: "center",
};

const iconStyle = {
  width: 52,
  height: 52,
  borderRadius: "50%",
  margin: "0 auto 16px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  background: "#ffd2e1",
  color: "#9a174c",
};

const titleStyle = {
  margin: 0,
  fontFamily: "'Fraunces', Georgia, serif",
  fontSize: 24,
  lineHeight: 1.25,
  fontWeight: 800,
  color: "#211714",
};

const messageStyle = {
  margin: "10px auto 0",
  maxWidth: 300,
  color: "#6f5850",
  fontSize: 14.5,
  lineHeight: 1.5,
};

const actionsStyle = {
  display: "flex",
  gap: 10,
  marginTop: 22,
};

const cancelStyle = {
  flex: 1,
  minHeight: 44,
  borderRadius: 8,
  border: "1.5px solid #eadcd7",
  background: "#fff",
  color: "#6f5850",
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
};

const confirmStyle = {
  flex: 1,
  minHeight: 44,
  borderRadius: 8,
  border: "none",
  background: "linear-gradient(180deg, #a52259 0%, #941b4e 100%)",
  color: "#fff",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  fontSize: 14,
  fontWeight: 800,
  cursor: "pointer",
  boxShadow: "0 10px 20px -15px rgba(148, 27, 78, 0.8)",
};