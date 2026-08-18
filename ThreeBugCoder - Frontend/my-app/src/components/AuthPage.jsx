import React from "react";
import { Leaf } from "lucide-react";
import { LoginPage } from "./LoginPage.jsx";
import { RegisterPage } from "./RegisterPage.jsx";
import { styles } from "../styles.js";
import { GlobalStyle } from "./GlobalStyle.jsx";
import { Typewriter } from "./Typewriter.jsx";

export function AuthPage({ view, onSwitch, onBackHome, onAuthSuccess }) {
  const isRegister = view === "register";

  return (
    <main style={styles.authSignInPage} className="bk-auth-page bk-auth-signin">
      <GlobalStyle />
      <section style={styles.authArtPanel} className="bk-auth-art-panel" aria-label="Ilustrasi keramik dan alat kriya">
        <div style={styles.authArtShade} />
        <button type="button" onClick={onBackHome} style={styles.authArtLogo} className="bk-auth-logo">
          <Leaf size={22} strokeWidth={2.3} />
          <span>BumiKriya</span>
        </button>
        <div style={styles.authArtCopy} className="bk-auth-art-copy">
          <Typewriter
            text={"Karya seni dari\nalam, untuk\nkeseharian Anda."}
            className="bk-auth-art-title"
            style={{ ...styles.authArtTitle, minHeight: "3.4em" }}
          />
          <p style={styles.authArtText} className="bk-auth-art-text">
            Koleksi BumiKriya
            <br />
            Eksklusif tersedia untuk member.
          </p>
        </div>
      </section>

      <section style={styles.authFormPanel} className="bk-auth-form-panel" aria-label={isRegister ? "Form daftar akun" : "Form masuk"}>
        <div key={view} style={styles.authFormWrap} className="bk-auth-form-content">
          {isRegister ? (
            <RegisterPage onSwitch={onSwitch} onSuccess={onAuthSuccess} />
          ) : (
            <LoginPage onSwitch={onSwitch} onBack={onBackHome} onSuccess={onAuthSuccess} />
          )}
        </div>
      </section>
    </main>
  );
}
