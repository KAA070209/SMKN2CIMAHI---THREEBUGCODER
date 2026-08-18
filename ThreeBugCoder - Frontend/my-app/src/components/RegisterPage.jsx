import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, Mail, LockKeyhole, EyeOff, MailCheck, UserRound } from "lucide-react";
import { styles } from "../styles.js";
import { AuthProviderButton, AuthDivider, AuthField } from "./AuthHelpers.jsx";
import { register, googleLogin } from "../lib/authApi.js";

const GMAIL_WEB_URL = "https://mail.google.com/mail/u/0/#inbox";
const GMAIL_ANDROID_INTENT =
  "intent://mail.google.com/#Intent;scheme=https;package=com.google.android.gm;S.browser_fallback_url=https%3A%2F%2Fmail.google.com%2Fmail%2Fu%2F0%2F%23inbox;end";

function openGmailInbox() {
  const userAgent = window.navigator.userAgent.toLowerCase();

  if (userAgent.includes("android")) {
    window.location.href = GMAIL_ANDROID_INTENT;
    return;
  }

  if (/iphone|ipad|ipod/.test(userAgent)) {
    window.location.href = "googlegmail://";
    window.setTimeout(() => {
      window.location.href = GMAIL_WEB_URL;
    }, 700);
    return;
  }

  window.open(GMAIL_WEB_URL, "_blank", "noopener,noreferrer");
}

function VerificationEmailModal({ status, isResending, onOpenEmail, onResend }) {
  return createPortal(
    <div style={styles.authModalOverlay} className="bk-auth-modal-overlay">
      <section
        style={styles.authModal}
        className="bk-auth-modal bk-register-verification-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="register-verification-title"
      >
        <div style={styles.authSuccessPanel}>
          <span style={styles.authModalSuccessBubble}>
            <MailCheck size={30} strokeWidth={2.6} />
          </span>
          <h2 id="register-verification-title" style={styles.authModalTitle}>Verifikasi Email Anda</h2>
          <p style={styles.authModalLead}>
            Kami telah mengirimkan tautan verifikasi ke alamat email Anda. Silakan periksa kotak masuk (atau folder spam) dan klik tautan tersebut untuk mengaktifkan akun BumiKriya Anda.
          </p>
          {status.message && (
            <p style={status.type === "error" ? styles.authResetErrorText : styles.authResetSuccessText}>
              {status.message}
            </p>
          )}
          <button type="button" style={styles.authModalPrimaryButton} className="bk-auth-modal-primary" onClick={onOpenEmail}>
            <ExternalLink size={17} strokeWidth={2.4} />
            <span>Buka Email Saya</span>
          </button>
          <p style={styles.authResendText}>
            Belum menerima email?{" "}
            <button type="button" style={styles.authModalInlineButton} className="bk-auth-link" onClick={onResend} disabled={isResending}>
              {isResending ? "Mengirim..." : "Kirim ulang"}
            </button>
          </p>
        </div>
      </section>
    </div>,
    document.body
  );
}

export function RegisterPage({ onSwitch }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", acceptedTerms: false });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [resendStatus, setResendStatus] = useState({ type: "", message: "" });
  const [isResending, setIsResending] = useState(false);
  const resendGuard = useRef(false);

  const updateField = (field) => (e) => {
    const value = field === "acceptedTerms" ? e.target.checked : e.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleGoogleLogin = () => {
    if (!form.acceptedTerms) {
      setStatus({
        type: "error",
        message: "Anda harus menyetujui Syarat & Ketentuan dan Kebijakan Privasi terlebih dahulu.",
      });
      return;
    }
    setIsGoogleLoading(true);
    setStatus({ type: "", message: "" });
    googleLogin().finally(() => setIsGoogleLoading(false));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    const nextEmail = form.email.trim();
    setRegisteredEmail(nextEmail);
    setResendStatus({ type: "", message: "" });

    register({
      name: form.name.trim(),
      email: nextEmail,
      password: form.password,
    })
      .then(() => {
        setStatus({ type: "success", message: "Registrasi berhasil. Silakan cek email untuk verifikasi akun." });
        setIsVerificationOpen(true);
      })
      .catch((error) => {
        setStatus({
          type: "error",
          message: error instanceof Error ? error.message : "Registrasi gagal. Silakan coba lagi.",
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  const handleResendVerification = () => {
    if (resendGuard.current) return;
    resendGuard.current = true;
    setIsResending(true);

    setResendStatus({ type: "", message: "" });

    register({
      name: form.name.trim(),
      email: registeredEmail || form.email.trim(),
      password: form.password,
    })
      .then(() => {
        setResendStatus({ type: "success", message: "Email verifikasi berhasil dikirim ulang." });
      })
      .catch(() => {
        setResendStatus({
          type: "error",
          message: "Email verifikasi gagal dikirim ulang. Silakan coba lagi.",
        });
      })
      .finally(() => {
        setIsResending(false);
        resendGuard.current = false;
      });
  };

  return (
    <>
      <h1 style={styles.authTitle}>Buat Akun Baru</h1>
      <p style={styles.authLead}>
        Sudah punya akun?{" "}
        <button type="button" style={styles.authInlineLink} className="bk-auth-link" onClick={() => onSwitch("login")}>
          masuk
        </button>
      </p>

      <div style={styles.authSocialGrid}>
        <AuthProviderButton label="Google" icon={<span style={styles.googleMark}>G</span>} onClick={handleGoogleLogin} loading={isGoogleLoading} />
      </div>

      <AuthDivider label="ATAU DAFTAR DENGAN EMAIL" />

      <form style={styles.registerForm} onSubmit={handleSubmit}>
        <AuthField
          label="NAMA LENGKAP"
          type="text"
          name="name"
          placeholder="Masukkan nama lengkap Anda"
          icon={<UserRound size={19} strokeWidth={1.9} />}
          value={form.name}
          onChange={updateField("name")}
          autoComplete="name"
          required
        />
        <AuthField
          label="ALAMAT EMAIL"
          type="email"
          name="email"
          placeholder="nama@email.com"
          icon={<Mail size={19} strokeWidth={1.9} />}
          value={form.email}
          onChange={updateField("email")}
          autoComplete="email"
          required
        />
        <AuthField
          label="KATA SANDI"
          type="password"
          name="password"
          placeholder="Buat kata sandi yang kuat"
          icon={<LockKeyhole size={19} strokeWidth={1.9} />}
          trailing={<EyeOff size={19} strokeWidth={1.9} />}
          value={form.password}
          onChange={updateField("password")}
          autoComplete="new-password"
          minLength={8}
          required
        />

        <label style={styles.termsRow}>
  <input
    type="checkbox"
    className="bk-terms-checkbox"
    checked={form.acceptedTerms}
    onChange={(e) =>
      setForm((current) => ({
        ...current,
        acceptedTerms: e.target.checked,
      }))
    }
    required
  />

  <span>
    Saya setuju dengan{" "}
    <button
      type="button"
      style={styles.authInlineLink}
      className="bk-auth-link"
      onClick={() => onSwitch("terms")}
    >
      Syarat &amp; Ketentuan
    </button>
    {" "}dan{" "}
    <button
      type="button"
      style={styles.authInlineLink}
      className="bk-auth-link"
      onClick={() => onSwitch("privacy")}
    >
      Kebijakan Privasi
    </button>
  </span>
</label>

        {status.message && (
          <p style={status.type === "error" ? styles.authErrorText : styles.authSuccessText}>
            {status.message}
          </p>
        )}
        <button type="submit" style={styles.authSubmit} className="bk-auth-submit" disabled={isSubmitting}>
          {isSubmitting ? "Memproses..." : "Buat Akun BumiKriya"}
        </button>
      </form>

      {isVerificationOpen && (
        <VerificationEmailModal
          status={resendStatus}
          isResending={isResending}
          onOpenEmail={openGmailInbox}
          onResend={handleResendVerification}
        />
      )}
    </>
  );
}
