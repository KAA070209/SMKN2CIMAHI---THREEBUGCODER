import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  EyeOff,
  Info,
  LockKeyhole,
  Mail,
  MailCheck,
  RotateCcw,
  X,
} from "lucide-react";
import { styles } from "../styles.js";
import { AuthProviderButton, AuthDivider, AuthField } from "./AuthHelpers.jsx";
import {
  forgotPassword,
  googleLogin,
  login,
  resetPassword,
  verifyResetCode,
} from "../lib/authApi.js";

const RESET_CODE_LENGTH = 6;
const RESET_CODE_SECONDS = 120;

const VERIFICATION_SUCCESS_STATUS = ["email_verified", "verified"];

function hasVerificationSuccess() {
  const status = new URLSearchParams(window.location.search).get("status");
  return VERIFICATION_SUCCESS_STATUS.some((value) => status?.toLowerCase() === value);
}

function clearVerificationQuery() {
  const url = new URL(window.location.href);
  url.searchParams.delete("status");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function VerificationSuccessModal({ onClose }) {
  return createPortal(
    <div style={styles.authModalOverlay} className="bk-auth-modal-overlay">
      <section
        style={styles.authModal}
        className="bk-auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-success-title"
      >
        <div style={styles.authSuccessPanel}>
          <span style={styles.authModalSuccessBubble}>
            <Check size={28} strokeWidth={3} />
          </span>
          <h2 id="verification-success-title" style={styles.authModalTitle}>Verifikasi Berhasil</h2>
          <p style={styles.authModalLead}>
            Email Anda telah berhasil diverifikasi. Akun BumiKriya Anda kini aktif — silakan masuk untuk melanjutkan.
          </p>
          <button type="button" style={styles.authModalPrimaryButton} className="bk-auth-modal-primary" onClick={onClose}>
            Lanjut ke Login
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

function formatTimer(seconds) {
  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainder = String(seconds % 60).padStart(2, "0");
  return `${minutes}:${remainder}`;
}

function getResetToken(data) {
  const candidates = [
    data?.token,
    data?.resetToken,
    data?.reset_token,
    data?.data?.token,
    data?.data?.resetToken,
    data?.data?.reset_token,
    data?.result?.token,
    data?.result?.reset_token,
  ];

  return candidates.find((candidate) => typeof candidate === "string" && candidate.trim()) || "";
}

function ForgotPasswordModal({ initialEmail = "", onClose }) {
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState(initialEmail.trim());
  const [codeDigits, setCodeDigits] = useState(Array(RESET_CODE_LENGTH).fill(""));
  const [passwords, setPasswords] = useState({ password: "", confirmPassword: "" });
  const [resetToken, setResetToken] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(RESET_CODE_SECONDS);
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const codeInputRefs = useRef([]);

  const code = codeDigits.join("");
  const isBusy = isSubmitting;

  useEffect(() => {
    if (step !== "verify") return undefined;

    const focusTimer = window.setTimeout(() => {
      codeInputRefs.current[0]?.focus();
    }, 80);

    return () => window.clearTimeout(focusTimer);
  }, [step]);

  useEffect(() => {
    if (step !== "verify" || secondsLeft <= 0) return undefined;

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [secondsLeft, step]);

  const closeModal = () => {
    if (isBusy) return;
    onClose();
  };

  const handleRequestCode = async (event) => {
    event.preventDefault();
    const trimmedEmail = email.trim();

    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      await forgotPassword({ email: trimmedEmail });
      setEmail(trimmedEmail);
      setCodeDigits(Array(RESET_CODE_LENGTH).fill(""));
      setSecondsLeft(RESET_CODE_SECONDS);
      setStep("verify");
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Kode verifikasi gagal dikirim.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (isBusy) return;

    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      await forgotPassword({ email: email.trim() });
      setCodeDigits(Array(RESET_CODE_LENGTH).fill(""));
      setSecondsLeft(RESET_CODE_SECONDS);
      codeInputRefs.current[0]?.focus();
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Kode verifikasi gagal dikirim ulang.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCodeChange = (index) => (event) => {
    const digits = event.target.value.replace(/\D/g, "");
    if (!digits) {
      setCodeDigits((current) => current.map((digit, digitIndex) => (digitIndex === index ? "" : digit)));
      return;
    }

    setCodeDigits((current) => {
      const next = [...current];
      digits
        .slice(0, RESET_CODE_LENGTH - index)
        .split("")
        .forEach((digit, offset) => {
          next[index + offset] = digit;
        });
      return next;
    });

    const nextIndex = Math.min(index + digits.length, RESET_CODE_LENGTH - 1);
    codeInputRefs.current[nextIndex]?.focus();
  };

  const handleCodePaste = (event) => {
    const pastedDigits = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, RESET_CODE_LENGTH);
    if (!pastedDigits) return;

    event.preventDefault();
    const next = Array(RESET_CODE_LENGTH).fill("");
    pastedDigits.split("").forEach((digit, index) => {
      next[index] = digit;
    });
    setCodeDigits(next);
    codeInputRefs.current[Math.min(pastedDigits.length, RESET_CODE_LENGTH - 1)]?.focus();
  };

  const handleCodeKeyDown = (index) => (event) => {
    if (event.key !== "Backspace" || codeDigits[index] || index === 0) return;
    codeInputRefs.current[index - 1]?.focus();
  };

  const handleVerifyCode = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (code.length < RESET_CODE_LENGTH) {
      setStatus({ type: "error", message: "Masukkan kode verifikasi lengkap." });
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await verifyResetCode({ email: email.trim(), code });
      setResetToken(getResetToken(data));
      setStep("reset");
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Kode verifikasi tidak valid.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordField = (field) => (event) => {
    setPasswords((current) => ({ ...current, [field]: event.target.value }));
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setStatus({ type: "", message: "" });

    if (passwords.password.length < 8) {
      setStatus({ type: "error", message: "Kata sandi minimal 8 karakter." });
      return;
    }

    if (passwords.password !== passwords.confirmPassword) {
      setStatus({ type: "error", message: "Konfirmasi kata sandi belum sama." });
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword({
        email: email.trim(),
        code,
        password: passwords.password,
        password_confirmation: passwords.confirmPassword,
        reset_token: resetToken || undefined,
      });
      setStep("success");
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Kata sandi gagal diubah.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStatus = () =>
    status.message ? (
      <p style={status.type === "error" ? styles.authResetErrorText : styles.authResetSuccessText}>
        {status.message}
      </p>
    ) : null;

  return createPortal(
    <div style={styles.authModalOverlay} className="bk-auth-modal-overlay" onMouseDown={(event) => {
      if (event.target === event.currentTarget) closeModal();
    }}>
      <section
        style={styles.authModal}
        className="bk-auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-title"
      >
        {step !== "success" && (
          <button type="button" style={styles.authModalClose} className="bk-auth-modal-close" onClick={closeModal} aria-label="Tutup popup">
            <X size={22} strokeWidth={2.1} />
          </button>
        )}

        {step === "email" && (
          <form style={styles.authModalForm} onSubmit={handleRequestCode}>
            <h2 id="forgot-password-title" style={styles.authModalTitle}>Lupa Password</h2>
            <p style={styles.authModalLead}>Masukkan email terdaftar Anda untuk menerima kode verifikasi</p>

            <AuthField
              label="ALAMAT EMAIL"
              type="email"
              name="reset-email"
              placeholder="nama@email.com"
              icon={<Mail size={20} strokeWidth={1.9} />}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />

            {renderStatus()}

            <button type="submit" style={styles.authModalPrimaryButton} className="bk-auth-modal-primary" disabled={isBusy}>
              {isBusy ? "Mengirim..." : "Kirim Kode"}
            </button>
            <button type="button" style={styles.authModalTextButton} className="bk-auth-link" onClick={closeModal}>
              Kembali ke halaman Masuk
            </button>
          </form>
        )}

        {step === "verify" && (
          <form style={styles.authModalForm} onSubmit={handleVerifyCode}>
            <span style={styles.authModalIconBubble}>
              <MailCheck size={25} strokeWidth={2.2} />
            </span>
            <h2 id="forgot-password-title" style={styles.authModalTitle}>Verifikasi Email</h2>
            <p style={styles.authModalLead}>Masukkan kode verifikasi yang telah kami kirimkan ke email Anda</p>

            <div style={styles.authOtpGrid} onPaste={handleCodePaste}>
              {codeDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(element) => {
                    codeInputRefs.current[index] = element;
                  }}
                  style={styles.authOtpInput}
                  className="bk-auth-otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  onChange={handleCodeChange(index)}
                  onKeyDown={handleCodeKeyDown(index)}
                  aria-label={`Digit kode ${index + 1}`}
                />
              ))}
            </div>

            <p style={styles.authTimerText}>
              <Clock3 size={17} strokeWidth={2} />
              <span>Kode berakhir dalam</span>
              <strong>{formatTimer(secondsLeft)}</strong>
            </p>

            {renderStatus()}

            <button type="submit" style={styles.authModalPrimaryButton} className="bk-auth-modal-primary" disabled={isBusy}>
              {isBusy ? "Memverifikasi..." : "Verifikasi"}
            </button>
            <p style={styles.authResendText}>
              Belum menerima kode?{" "}
              <button type="button" style={styles.authModalInlineButton} className="bk-auth-link" onClick={handleResendCode} disabled={isBusy}>
                Kirim ulang kode
              </button>
            </p>
          </form>
        )}

        {step === "reset" && (
          <form style={styles.authModalForm} onSubmit={handleResetPassword}>
            <span style={styles.authModalIconBubble}>
              <RotateCcw size={24} strokeWidth={2.2} />
            </span>
            <h2 id="forgot-password-title" style={styles.authModalTitle}>Buat Kata Sandi Baru</h2>
            <p style={styles.authModalLead}>Silakan masukkan kata sandi baru Anda. Pastikan kata sandi sulit ditebak namun mudah Anda ingat.</p>

            <AuthField
              label="Kata Sandi Baru"
              type="password"
              name="new-password"
              placeholder="Masukkan kata sandi baru"
              icon={<LockKeyhole size={19} strokeWidth={1.9} />}
              trailing={<EyeOff size={19} strokeWidth={1.9} />}
              value={passwords.password}
              onChange={handlePasswordField("password")}
              autoComplete="new-password"
              minLength={8}
              required
            />
            <p style={styles.authPasswordHint}>
              <Info size={14} strokeWidth={2} />
              <span>Minimal 8 karakter</span>
            </p>
            <AuthField
              label="Konfirmasi Kata Sandi Baru"
              type="password"
              name="confirm-new-password"
              placeholder="Ulangi kata sandi baru"
              icon={<LockKeyhole size={19} strokeWidth={1.9} />}
              trailing={<EyeOff size={19} strokeWidth={1.9} />}
              value={passwords.confirmPassword}
              onChange={handlePasswordField("confirmPassword")}
              autoComplete="new-password"
              minLength={8}
              required
            />

            {renderStatus()}

            <button type="submit" style={styles.authModalPrimaryButton} className="bk-auth-modal-primary" disabled={isBusy}>
              {isBusy ? "Menyimpan..." : (
                <>
                  <span>Simpan Kata Sandi</span>
                  <ArrowRight size={18} strokeWidth={2.3} />
                </>
              )}
            </button>
          </form>
        )}

        {step === "success" && (
          <div style={styles.authSuccessPanel}>
            <span style={styles.authModalSuccessBubble}>
              <Check size={28} strokeWidth={3} />
            </span>
            <h2 id="forgot-password-title" style={styles.authModalTitle}>Kata Sandi Berhasil Diubah</h2>
            <p style={styles.authModalLead}>Kata sandi Anda telah diperbarui. Silakan gunakan kata sandi baru Anda untuk masuk kembali ke akun BumiKriya.</p>
            <button type="button" style={styles.authModalPrimaryButton} className="bk-auth-modal-primary" onClick={onClose}>
              Kembali ke Login
            </button>
          </div>
        )}
      </section>
    </div>,
    document.body
  );
}

export function LoginPage({ onSwitch, onBack, onSuccess }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [isVerificationSuccess, setIsVerificationSuccess] = useState(false);

  useEffect(() => {
    if (hasVerificationSuccess()) {
      setIsVerificationSuccess(true);
      clearVerificationQuery();
    }
  }, []);

  const updateField = (field) => (e) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    setStatus({ type: "", message: "" });
    googleLogin().finally(() => setIsGoogleLoading(false));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", message: "" });
    setIsSubmitting(true);

    try {
      const data = await login({
        email: form.email.trim(),
        password: form.password,
      });

      setStatus({ type: "success", message: "Login berhasil. Mengarahkan ke beranda..." });
      onSuccess?.({ ...data, login_email: form.email.trim() }, "login");
    } catch (error) {
      setStatus({
        type: "error",
        message: error instanceof Error ? error.message : "Login gagal. Silakan coba lagi.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" style={styles.authBackButton} className="bk-auth-back" onClick={onBack}>
        <ArrowLeft size={17} strokeWidth={2.2} />
        <span>Kembali</span>
      </button>
      <h1 style={styles.authTitle}>Selamat Datang Kembali</h1>
      <p style={styles.authLead}>
        Masukkan detail Anda di bawah atau{" "}
        <button type="button" style={styles.authInlineLink} className="bk-auth-link" onClick={() => onSwitch("register")}>
          daftar akun
        </button>
      </p>

      <div style={styles.authSocialGrid}>
        <AuthProviderButton label="Google" icon={<span style={styles.googleMark}>G</span>} onClick={handleGoogleLogin} loading={isGoogleLoading} />
      </div>

      <AuthDivider label="ATAU MASUK DENGAN EMAIL" />

      <form style={styles.authForm} onSubmit={handleSubmit}>
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
          label="PASSWORD"
          type="password"
          name="password"
          placeholder="Masukkan password"
          icon={<LockKeyhole size={19} strokeWidth={1.9} />}
          trailing={<EyeOff size={19} strokeWidth={1.9} />}
          value={form.password}
          onChange={updateField("password")}
          autoComplete="current-password"
          required
        />
        <button type="button" style={styles.forgotLink} className="bk-auth-link" onClick={() => setIsForgotOpen(true)}>
          Lupa Password?
        </button>
        {status.message && (
          <p style={status.type === "error" ? styles.authErrorText : styles.authSuccessText}>
            {status.message}
          </p>
        )}
        <button type="submit" style={styles.authSubmit} className="bk-auth-submit" disabled={isSubmitting}>
          {isSubmitting ? "Memproses..." : "Masuk"}
        </button>
      </form>

      {isForgotOpen && (
        <ForgotPasswordModal initialEmail={form.email} onClose={() => setIsForgotOpen(false)} />
      )}

      {isVerificationSuccess && (
        <VerificationSuccessModal onClose={() => setIsVerificationSuccess(false)} />
      )}
    </>
  );
}
