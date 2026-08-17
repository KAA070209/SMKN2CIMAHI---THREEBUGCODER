import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { styles } from "../styles.js";

export function AuthProviderButton({ icon, label, onClick, loading = false }) {
  return (
    <button
      type="button"
      style={styles.authSocialButton}
      className="bk-auth-social"
      onClick={onClick}
      disabled={loading}
    >
      {icon}
      <span>{loading ? "Menghubungkan..." : label}</span>
    </button>
  );
}

export function AuthDivider({ label }) {
  return (
    <div style={styles.authDivider}>
      <span style={styles.authDividerLine} />
      <span style={styles.authDividerText}>{label}</span>
      <span style={styles.authDividerLine} />
    </div>
  );
}

export function AuthField({ label, icon, trailing, compact = false, ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = inputProps.type === "password";
  const resolvedType = isPassword && showPassword ? "text" : inputProps.type;

  return (
    <label style={styles.authField}>
      <span style={compact ? styles.authLabelCompact : styles.authLabel}>{label}</span>
      <span style={styles.authInputWrap} className="bk-auth-input-wrap">
        <span style={styles.authInputIcon}>{icon}</span>
        <input style={styles.authInput} className="bk-auth-input" {...inputProps} type={resolvedType} />
        {trailing &&
          (isPassword ? (
            <button
              type="button"
              style={styles.authTrailingButton}
              aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              onClick={() => setShowPassword((visible) => !visible)}
            >
              {showPassword ? <EyeOff size={19} strokeWidth={1.9} /> : <Eye size={19} strokeWidth={1.9} />}
            </button>
          ) : (
            <span style={styles.authTrailingIcon}>{trailing}</span>
          ))}
      </span>
    </label>
  );
}
