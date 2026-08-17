import React from "react";
import { Mail, LockKeyhole, EyeOff, Leaf } from "lucide-react";
import { styles } from "../styles.js";
import { GlobalStyle } from "./GlobalStyle.jsx";
import { AuthProviderButton, AuthDivider, AuthField } from "./AuthHelpers.jsx";
import { Typewriter } from "./Typewriter.jsx";

export function SignInPage({ onSwitch, onBackHome }) {
  return (
    <main style={styles.authSignInPage} className="bk-auth-signin">
      <GlobalStyle />
      <section style={styles.authArtPanel} className="bk-auth-art-panel">
        <div style={styles.authArtShade} />
        <button type="button" onClick={onBackHome} style={styles.authArtLogo} className="bk-auth-logo">
          <Leaf size={22} strokeWidth={2.3} />
          <span>BumiKriya</span>
        </button>
        <div style={styles.authArtCopy}>
          <Typewriter
            text={"Karya seni dari\nalam, untuk\nkeseharian Anda."}
            style={{ ...styles.authArtTitle, minHeight: "3.4em" }}
          />
          <p style={styles.authArtText}>
            Koleksi BumiKriya
            <br />
            Eksklusif tersedia untuk member.
          </p>
        </div>
      </section>

      <section style={styles.authFormPanel} className="bk-auth-form-panel" aria-label="Form masuk">
        <div style={styles.authFormWrap}>
          <h1 style={styles.authTitle}>Selamat Datang Kembali</h1>
          <p style={styles.authLead}>
            Masukkan detail Anda di bawah atau{" "}
            <button type="button" style={styles.authInlineLink} className="bk-auth-link" onClick={() => onSwitch("register")}>
              daftar akun
            </button>
          </p>

          <div style={styles.authSocialGrid}>
            <AuthProviderButton label="Google" icon={<span style={styles.googleMark}>G</span>} />
          </div>

          <AuthDivider label="ATAU MASUK DENGAN EMAIL" />

          <form style={styles.authForm} onSubmit={(e) => e.preventDefault()}>
            <AuthField
              label="ALAMAT EMAIL"
              type="email"
              placeholder="nama@email.com"
              icon={<Mail size={19} strokeWidth={1.9} />}
            />
            <AuthField
              label="PASSWORD"
              type="password"
              placeholder="Masukkan password"
              icon={<LockKeyhole size={19} strokeWidth={1.9} />}
              trailing={<EyeOff size={19} strokeWidth={1.9} />}
            />
            <button type="button" style={styles.forgotLink} className="bk-auth-link">
              Lupa Password?
            </button>
            <button type="submit" style={styles.authSubmit} className="bk-auth-submit">
              Masuk
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
