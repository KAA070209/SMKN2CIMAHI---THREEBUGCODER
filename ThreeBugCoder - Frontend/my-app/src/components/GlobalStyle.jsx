import React from "react";

export function GlobalStyle() {
  return (
    <style>{`
      :root {
        --header-h: 78px;
        --pink: #f875b0;
        --pink-deep: #ef5f9e;
        --cream: #fdeee2;
        --maroon: #590d26;
        --maroon-2: #a82a59;
        --gold: #e7c438;
        --ink: #2f1e1a;
      }

      * { box-sizing: border-box; }

      @keyframes bk-float {
        0%, 100% { transform: translateY(0) translateX(0); opacity: 0.55; }
        50% { transform: translateY(-18px) translateX(6px); opacity: 0.9; }
      }
      .bk-float-dot { animation-name: bk-float; animation-timing-function: ease-in-out; animation-iteration-count: infinite; }

      @keyframes bk-toast-in {
        from { opacity: 0; transform: translate(-50%, 12px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      .bk-toast-in { animation: bk-toast-in 0.35s cubic-bezier(.22,.61,.36,1); }

      @keyframes bk-badge-pop {
        0% { transform: scale(0.4); }
        60% { transform: scale(1.25); }
        100% { transform: scale(1); }
      }
      .bk-badge-pop { animation: bk-badge-pop 0.35s cubic-bezier(.34,1.56,.64,1); }

      @keyframes bk-dropdown-in {
        from { opacity: 0; transform: translateY(-6px) scaleY(0.96); }
        to { opacity: 1; transform: translateY(0) scaleY(1); }
      }
      .bk-dropdown-in { animation: bk-dropdown-in 0.18s ease-out; transform-origin: top; }

      @keyframes bk-auth-art-in {
        from { opacity: 0; transform: scale(1.03); }
        to { opacity: 1; transform: scale(1); }
      }
      .bk-auth-art-panel {
        animation: bk-auth-art-in 0.7s cubic-bezier(.16,1,.3,1);
      }

      @keyframes bk-auth-form-in {
        from { opacity: 0; transform: translateY(18px); filter: blur(4px); }
        to { opacity: 1; transform: translateY(0); filter: blur(0); }
      }
      .bk-auth-form-content {
        animation: bk-auth-form-in 0.42s cubic-bezier(.16,1,.3,1);
        will-change: opacity, transform;
      }

      @keyframes bk-auth-modal-fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes bk-auth-modal-in {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .bk-auth-modal-overlay { animation: bk-auth-modal-fade 0.18s ease-out; }
      .bk-auth-modal { animation: bk-auth-modal-in 0.24s cubic-bezier(.16,1,.3,1); }

      @keyframes bk-voucher-fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes bk-voucher-in {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .bk-voucher-overlay { animation: bk-voucher-fade 0.18s ease-out; }
      .bk-voucher-modal { animation: bk-voucher-in 0.24s cubic-bezier(.16,1,.3,1); }

      .bk-voucher-field,
      .bk-voucher-apply,
      .bk-voucher-close,
      .bk-voucher-chip,
      .bk-voucher-remove {
        transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease, border-color 0.2s ease, background 0.2s ease;
      }
      .bk-voucher-field:hover {
        transform: translateY(-1px);
        border-color: #f875b0 !important;
        box-shadow: 0 0 0 4px rgba(248,117,176,0.12);
      }
      .bk-voucher-apply:hover { transform: translateY(-2px); filter: brightness(1.05); box-shadow: 0 14px 26px -15px rgba(168,42,89,0.75); }
      .bk-voucher-apply:active { transform: translateY(0) scale(0.99); }
      .bk-voucher-apply:disabled { cursor: not-allowed; opacity: 0.6; transform: none !important; box-shadow: none !important; filter: none !important; }
      .bk-voucher-close:hover { transform: rotate(90deg); color: #9a174c !important; background: #fff1f6 !important; }
      .bk-voucher-chip:hover { transform: translateY(-2px); border-color: #f875b0 !important; background: #fff8fb !important; }
      .bk-voucher-remove:hover { transform: scale(1.08); background: #ffd2e1 !important; }

      @keyframes bk-review-marquee {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
      .bk-review-track {
        animation: bk-review-marquee 24s linear infinite;
        will-change: transform;
      }
      .bk-review-viewport:hover .bk-review-track {
        animation-play-state: paused;
      }

      .bk-icon-btn { transition: transform 0.2s ease, background 0.2s ease; }
      .bk-icon-btn:hover { transform: translateY(-2px) scale(1.06); background: rgba(255,255,255,0.22); }
      .bk-icon-btn:active { transform: translateY(0) scale(0.96); }

      .bk-signin { transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease; }
      .bk-signin:hover { transform: translateY(-2px); box-shadow: 0 10px 22px -8px rgba(89,13,38,0.55); filter: brightness(1.04); }
      .bk-signin:active { transform: translateY(0) scale(0.98); }

      .bk-cari-btn { transition: transform 0.18s ease, box-shadow 0.25s ease, filter 0.2s ease; }
      .bk-cari-btn:hover { transform: translateY(-2px); filter: brightness(1.06); box-shadow: 0 10px 20px -8px rgba(89,13,38,0.5); }
      .bk-cari-btn:active { transform: translateY(0) scale(0.97); }

      .bk-pill { transition: transform 0.2s ease, box-shadow 0.25s ease, background 0.2s ease, color 0.2s ease; }
      .bk-pill:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -10px rgba(47,30,26,0.35); }
      .bk-pill:active { transform: translateY(0) scale(0.97); }

      .bk-faq-button { transition: background 0.2s ease, color 0.2s ease; }
      .bk-faq-button:hover { background: #fff6fa; }
      .bk-contact-input,
      .bk-contact-textarea {
        transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      }
      .bk-contact-input:focus,
      .bk-contact-textarea:focus {
        border-color: #b42b61 !important;
        box-shadow: 0 0 0 4px rgba(248,117,176,0.14);
        background: #fff;
      }

      .bk-cat-card { transition: transform 0.35s cubic-bezier(.22,.61,.36,1), box-shadow 0.35s ease; }
      .bk-cat-card:hover { transform: translateY(-6px); box-shadow: 0 18px 34px -16px rgba(47,30,26,0.4); }
      .bk-cat-card:hover .bk-cat-img { transform: scale(1.08); }
      .bk-cat-img { transition: transform 0.5s cubic-bezier(.22,.61,.36,1); }

      .bk-category-card { transition: transform 0.35s cubic-bezier(.22,.61,.36,1), box-shadow 0.35s ease; }
      .bk-category-card:hover { transform: translateY(-6px); box-shadow: 0 18px 34px -16px rgba(47,30,26,0.4); }
      .bk-category-card:hover .bk-cat-img { transform: scale(1.08); }

      .bk-product-card { transition: transform 0.42s cubic-bezier(.16,1,.3,1); }
      .bk-product-card:hover { transform: translateY(-5px); }
      .bk-product-grid > div:nth-child(odd) .bk-product-img-wrap { transform: rotate(-2.5deg); }
      .bk-product-grid > div:nth-child(even) .bk-product-img-wrap { transform: rotate(2deg); }
      .bk-product-grid > div:nth-child(4n) .bk-product-img-wrap { transform: rotate(1.2deg); }
      .bk-product-img-wrap { transition: transform 0.3s ease, background 0.25s ease, box-shadow 0.25s ease; }
      .bk-product-card:hover .bk-product-img-wrap {
        background: transparent !important;
        box-shadow: none !important;
      }
      .bk-product-card:hover .bk-product-img-wrap img {
        transform: scale(1.08);
        clip-path: none !important;
        inset: 0 !important;
        width: 100% !important;
        height: 100% !important;
        border-radius: 16px;
      }
      .bk-product-img-wrap img { transition: transform 0.5s cubic-bezier(.22,.61,.36,1), inset 0.3s ease, width 0.3s ease, height 0.3s ease, clip-path 0.2s ease; }

      .bk-heart-btn { transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), box-shadow 0.2s ease; }
      .bk-heart-btn:hover { transform: scale(1.14); }
      .bk-heart-btn:active { transform: scale(0.9); }

      .bk-tambah-btn { transition: transform 0.18s ease, box-shadow 0.22s ease, filter 0.2s ease; }
      .bk-tambah-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 22px -10px rgba(168,42,89,0.55); filter: brightness(1.08); }
      .bk-tambah-btn:active { transform: translateY(0) scale(0.97); }

      .bk-review-card { transition: transform 0.42s cubic-bezier(.16,1,.3,1), box-shadow 0.42s ease; }
      .bk-review-card:hover { transform: translateY(-6px); box-shadow: 0 18px 30px -16px rgba(47,30,26,0.18); }

      @keyframes bk-review-detail-fade {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes bk-review-detail-in {
        from { opacity: 0; transform: translateY(16px) scale(0.97); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }
      .bk-review-detail-overlay { animation: bk-review-detail-fade 0.18s ease-out; }
      .bk-review-detail-modal { animation: bk-review-detail-in 0.24s cubic-bezier(.16,1,.3,1); }
      .bk-review-item {
        transition: transform 0.2s ease, box-shadow 0.25s ease, border-color 0.2s ease, background 0.2s ease;
      }
      .bk-review-item:hover {
        transform: translateY(-3px);
        border-color: #c53b73 !important;
        box-shadow: 0 12px 22px -18px rgba(168,42,89,0.42);
      }
      .bk-review-item:active { transform: translateY(0) scale(0.99); }
      .bk-review-detail-helpful {
        transition: transform 0.2s ease, background 0.2s ease, box-shadow 0.2s ease;
      }
      .bk-review-detail-helpful:hover {
        transform: translateY(-2px);
        background: #fff1f7 !important;
        box-shadow: 0 8px 16px -12px rgba(47,30,26,0.36);
      }

      .bk-tilt { transition: transform 0.5s cubic-bezier(.22,.61,.36,1); }
      .bk-tilt:hover { transform: perspective(800px) rotateX(1deg) rotateY(-2deg) scale(1.015); }

      .bk-discount-ticket::before,
      .bk-discount-ticket::after {
        content: "";
        position: absolute;
        right: 126px;
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #fdeee2;
        border: 2.5px solid #17110f;
        z-index: 3;
        pointer-events: none;
      }
      .bk-discount-ticket::before {
        top: 0;
        transform: translate(50%, -54%);
      }
      .bk-discount-ticket::after {
        bottom: 0;
        transform: translate(50%, 54%);
      }
      .bk-ticket-main::before {
        content: none;
      }
      .bk-ticket-stub::after {
        content: none;
      }

      .bk-social-btn { transition: transform 0.2s cubic-bezier(.34,1.56,.64,1), background 0.2s ease; }
      .bk-social-btn:hover { transform: translateY(-3px) scale(1.08); background: #fff; }

      .bk-footer-link { transition: color 0.2s ease, transform 0.2s ease; display: inline-block; }
      .bk-footer-link:hover { color: #ffb7d6 !important; transform: translateX(2px); }
      .bk-footer-col-title { cursor: default; }
      .bk-footer-col-caret { display: none !important; }

      .bk-dropdown-item { transition: background 0.15s ease, color 0.15s ease, padding-left 0.15s ease; }
      .bk-dropdown-item:hover { background: #fdeee2; padding-left: 20px; }
      .bk-user-menu-item {
        transition: background 0.15s ease, color 0.15s ease, padding-left 0.15s ease;
      }
      .bk-user-menu-item:hover {
        background: rgba(248,117,176,0.12) !important;
        padding-left: 20px !important;
      }

      .bk-wishlist-back,
      .bk-wishlist-remove,
      .bk-wishlist-add {
        transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease, background 0.2s ease;
      }
      .bk-wishlist-back:hover { transform: translateX(-4px); }
      .bk-wishlist-card { transition: transform 0.35s cubic-bezier(.16,1,.3,1); }
      .bk-wishlist-card:hover { transform: translateY(-5px); }
      .bk-wishlist-card img { transition: transform 0.48s cubic-bezier(.22,.61,.36,1); }
      .bk-wishlist-card:hover img { transform: scale(1.035); }
      .bk-wishlist-remove:hover {
        transform: translateY(-2px) scale(1.04);
        box-shadow: 0 8px 18px -12px rgba(197,59,115,0.8);
      }
      .bk-wishlist-add:hover {
        transform: translateY(-2px);
        filter: brightness(1.06);
        box-shadow: 0 12px 22px -14px rgba(168,42,89,0.75);
      }
      .bk-wishlist-add:active,
      .bk-wishlist-remove:active { transform: translateY(0) scale(0.97); }

      .bk-search-image-frame,
      .bk-search-project-card,
      .bk-search-store-card,
      .bk-search-recipe-card,
      .bk-related-card,
      .bk-related-add,
      .bk-trending-item {
        transition: transform 0.25s ease, box-shadow 0.28s ease, filter 0.2s ease;
      }
      .bk-search-image-frame:hover { transform: translateY(-4px); }
      .bk-search-project-card:hover { transform: translateY(-3px); }
      .bk-search-store-card:hover,
      .bk-search-recipe-card:hover { transform: translateY(-4px); }
      .bk-search-material-item span {
        min-width: 0;
        overflow-wrap: anywhere;
      }
      .bk-related-card:hover { transform: translateY(-5px); }
      .bk-related-card img { transition: transform 0.48s cubic-bezier(.22,.61,.36,1); }
      .bk-related-card:hover img { transform: scale(1.035); }
      .bk-trending-item:hover { transform: translateY(-1px); background: #fff0f6 !important; }
      .bk-related-add:hover {
        transform: translateY(-2px);
        filter: brightness(1.06);
        box-shadow: 0 12px 22px -14px rgba(168,42,89,0.75);
      }
      .bk-related-add:active { transform: translateY(0) scale(0.97); }

      .bk-product-detail-back,
      .bk-product-detail-thumb,
      .bk-product-detail-add,
      .bk-product-detail-more-image,
      .bk-product-detail-more-add {
        transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease, border-color 0.2s ease;
      }
      .bk-product-detail-back:hover { transform: translateX(-4px); }
      .bk-product-detail-thumb:hover,
      .bk-product-detail-more-image:hover {
        transform: translateY(-3px);
        filter: brightness(1.03);
      }
      .bk-product-detail-add:hover,
      .bk-product-detail-more-add:hover {
        transform: translateY(-2px);
        filter: brightness(1.05);
        box-shadow: 0 14px 26px -16px rgba(168,42,89,0.8);
      }
      .bk-product-detail-add:active,
      .bk-product-detail-more-add:active,
      .bk-product-detail-thumb:active { transform: translateY(0) scale(0.98); }

      .bk-store-detail-back,
      .bk-store-follow,
      .bk-store-products-grid .bk-product-detail-more-image,
      .bk-store-products-grid .bk-product-detail-more-add {
        transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease, opacity 0.2s ease;
      }
      .bk-store-detail-back:hover { transform: translateX(-4px); }
      .bk-store-follow:hover:not(:disabled) {
        transform: translateY(-2px);
        filter: brightness(1.05);
        box-shadow: 5px 7px 0 #8f214d;
      }
      .bk-store-follow:active:not(:disabled) { transform: translateY(0) scale(0.98); }
      .bk-store-follow:disabled { cursor: wait; }

      .bk-cart-back,
      .bk-cart-item,
      .bk-cart-qty,
      .bk-cart-remove,
      .bk-cart-checkout {
        transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease, background 0.2s ease;
      }
      .bk-cart-back:hover { transform: translateX(-4px); }
      .bk-cart-item:hover {
        transform: translateY(-3px);
        box-shadow: 0 18px 34px -26px rgba(89,13,38,0.36);
      }
      .bk-cart-qty:hover,
      .bk-cart-remove:hover {
        background: rgba(215,59,117,0.08);
        transform: scale(1.04);
      }
      .bk-cart-qty:active,
      .bk-cart-remove:active { transform: scale(0.94); }
      .bk-cart-checkout:hover {
        transform: translateY(-2px);
        filter: brightness(1.04);
        box-shadow: 0 9px 18px -12px rgba(47,30,26,0.5), 0 3px 0 #caa80d;
      }
      .bk-cart-checkout:active { transform: translateY(0) scale(0.99); }

      .bk-payment-back,
      .bk-payment-panel,
      .bk-payment-select,
      .bk-payment-method,
      .bk-payment-pay {
        transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease, border-color 0.2s ease, background 0.2s ease;
      }
      .bk-payment-back:hover { transform: translateX(-4px); }
      .bk-payment-panel:hover {
        box-shadow: 9px 10px 20px rgba(183, 45, 100, 0.2);
      }
      .bk-payment-select:hover,
      .bk-payment-method:hover {
        transform: translateY(-2px);
        border-color: #e8bed1 !important;
      }
      .bk-payment-select:active,
      .bk-payment-method:active { transform: translateY(0) scale(0.99); }
      .bk-payment-pay:hover {
        transform: translateY(-2px);
        filter: brightness(1.05);
        box-shadow: 0 16px 28px -17px rgba(168, 42, 89, 0.9);
      }
      .bk-payment-pay:active { transform: translateY(0) scale(0.99); }
      .bk-payment-field input,
      .bk-payment-field textarea {
        transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
      }
      .bk-payment-field input:focus,
      .bk-payment-field textarea:focus {
        border-color: #b42b61 !important;
        box-shadow: 0 0 0 4px rgba(248,117,176,0.14);
        background: #fff;
      }

      .bk-profile-card,
      .bk-profile-nav-button,
      .bk-profile-order-card,
      .bk-profile-save {
        transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease, background 0.2s ease, border-color 0.2s ease;
      }
      .bk-profile-card:hover {
        box-shadow: 0 16px 34px -28px rgba(183,45,100,0.42);
      }
      .bk-profile-nav-button:hover {
        background: rgba(245,95,163,0.18) !important;
      }
      .bk-profile-order-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 16px 32px -26px rgba(183,45,100,0.38);
      }
      .bk-profile-field:focus-within {
        border-color: #b72d64 !important;
        box-shadow: 0 0 0 4px rgba(248,117,176,0.14);
        background: #fff !important;
      }
      .bk-profile-field input:disabled {
        color: #221815;
        opacity: 1;
        -webkit-text-fill-color: #221815;
      }
      .bk-profile-save:hover {
        transform: translateY(-2px);
        filter: brightness(1.05);
        box-shadow: 0 14px 26px -16px rgba(168,42,89,0.8);
      }
      .bk-profile-save:disabled {
        cursor: not-allowed;
        opacity: 0.72;
        transform: none !important;
        filter: none !important;
        box-shadow: none !important;
      }
      .bk-order-card,
      .bk-orders-action,
      .bk-orders-page,
      .bk-orders-tab {
        transition: transform 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease, background 0.2s ease, border-color 0.2s ease;
      }
      .bk-order-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 18px 34px -26px rgba(183,45,100,0.38);
      }
      .bk-orders-action:hover {
        transform: translateY(-2px);
        filter: brightness(1.05);
        box-shadow: 0 12px 22px -16px rgba(168,42,89,0.72);
      }
      .bk-orders-action:active,
      .bk-orders-page:active { transform: translateY(0) scale(0.97); }
      .bk-orders-page:hover:not(:disabled) {
        border-color: #b72d64 !important;
        color: #b72d64 !important;
      }
      .bk-orders-page:disabled {
        cursor: not-allowed;
        opacity: 0.45;
      }
      .bk-orders-tab:hover {
        color: #b72d64 !important;
        background: rgba(248,117,176,0.08) !important;
      }
      .bk-order-detail-grid span,
      .bk-order-detail-copy span,
      .bk-order-detail-copy small,
      .bk-order-shipping-box p {
        color: #6f5850;
      }

      .bk-auth-logo,
      .bk-auth-back,
      .bk-auth-link,
      .bk-auth-social,
      .bk-auth-submit,
      .bk-auth-modal-primary,
      .bk-auth-modal-close,
      .bk-auth-otp-input {
        transition: transform 0.2s ease, color 0.2s ease, border-color 0.2s ease, box-shadow 0.25s ease, filter 0.2s ease;
      }
      .bk-auth-logo:hover,
      .bk-auth-link:hover { color: #f875b0 !important; }
      .bk-auth-back:hover {
        transform: translateX(-2px);
        border-color: #d89bb7 !important;
        background: #fff !important;
      }
      .bk-auth-social:hover {
        transform: translateY(-2px);
        border-color: #d89bb7 !important;
        box-shadow: 0 12px 24px -18px rgba(89,13,38,0.42);
      }
      .bk-auth-submit:hover {
        transform: translateY(-2px);
        filter: brightness(1.04);
        box-shadow: 0 14px 26px -15px rgba(168,42,89,0.75);
      }
      .bk-auth-modal-primary:hover {
        transform: translateY(-2px);
        filter: brightness(1.04);
        box-shadow: 0 14px 26px -15px rgba(148,27,78,0.82);
      }
      .bk-auth-modal-close:hover {
        transform: rotate(90deg);
        color: #9a174c !important;
        background: #fff1f6 !important;
      }
      .bk-auth-submit:disabled,
      .bk-auth-modal-primary:disabled {
        cursor: not-allowed;
        opacity: 0.72;
        transform: none !important;
        filter: none !important;
        box-shadow: none !important;
      }
      .bk-auth-submit:active,
      .bk-auth-social:active,
      .bk-auth-modal-primary:active { transform: translateY(0) scale(0.99); }
      .bk-auth-input-wrap { transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease; }
      .bk-auth-input-wrap:focus-within {
        border-color: #b42b61 !important;
        box-shadow: 0 0 0 4px rgba(248,117,176,0.14);
        background: #fff;
      }
      .bk-auth-otp-input:focus {
        border-color: #9a174c !important;
        box-shadow: 0 0 0 4px rgba(154,23,76,0.12);
        background: #fff !important;
      }

      .bk-terms-checkbox {
        appearance: none;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        border: 1.5px solid #e8bed1;
        background: transparent;
        flex-shrink: 0;
        cursor: pointer;
        display: inline-grid;
        place-items: center;
        transition: border-color 0.2s ease, background 0.2s ease;
      }
      .bk-terms-checkbox:hover { border-color: #d89bb7; }
      .bk-terms-checkbox:checked {
        border-color: #b72d64;
        background: #b72d64;
      }
      .bk-terms-checkbox:checked::after {
        content: "";
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #fff;
      }

      a, button { -webkit-tap-highlight-color: transparent; }
      button { font-family: inherit; cursor: pointer; }
      input:focus, button:focus-visible, a:focus-visible {
        outline: 2px solid #a82a59;
        outline-offset: 2px;
      }

      @keyframes bk-caret-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0; }
      }
      .bk-caret {
        display: inline-block;
        width: 3px;
        height: 0.92em;
        margin-left: 4px;
        border-radius: 2px;
        background: #ffb7d6;
        vertical-align: -0.12em;
        animation: bk-caret-blink 1s steps(1) infinite;
        box-shadow: 0 0 10px rgba(255,183,214,0.8);
      }
      .bk-header-search {
        animation: bk-header-search-in 0.22s ease both;
      }
      @keyframes bk-header-search-in {
        from {
          opacity: 0;
          transform: translateY(-6px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .bk-float-dot, .bk-toast-in, .bk-badge-pop, .bk-dropdown-in, .bk-auth-art-panel, .bk-auth-form-content, .bk-auth-modal-overlay, .bk-auth-modal, .bk-voucher-overlay, .bk-voucher-modal, .bk-review-track, .bk-review-detail-overlay, .bk-review-detail-modal, .bk-caret, .bk-header-search { animation: none !important; }
        * { transition-duration: 0.001ms !important; }
      }

      @media (max-width: 980px) {
        .bk-section-header { flex-direction: column; align-items: flex-start !important; gap: 14px; }
        .bk-auth-signin { grid-template-columns: 1fr !important; }
        .bk-auth-art-panel { min-height: 420px !important; }
        .bk-auth-form-panel { padding: 64px clamp(24px, 8vw, 72px) !important; }
        .bk-header-search { width: 190px !important; }
      }

      @media (max-width: 1100px) {
        .bk-category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .bk-categories-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        .bk-categories-main { padding-top: 56px !important; }
        .bk-product-detail-grid { grid-template-columns: 1fr !important; gap: 58px !important; }
        .bk-product-detail-copy { padding-top: 0 !important; }
        .bk-product-detail-more-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .bk-store-stats { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .bk-store-story-grid { grid-template-columns: 1fr !important; gap: 54px !important; }
        .bk-store-rules-card { max-width: 500px !important; justify-self: center !important; }
        .bk-store-products-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .bk-search-product-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; }
        .bk-search-recipe-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .bk-product-grid {
          grid-template-columns: repeat(4, minmax(0, 184px)) !important;
          justify-content: space-between !important;
          gap: 68px 30px !important;
        }
        .bk-product-card { width: 184px !important; }
        .bk-wishlist-grid { grid-template-columns: repeat(3, minmax(0, 1fr)) !important; gap: 86px 32px !important; }
        .bk-cart-layout { grid-template-columns: 1fr !important; }
        .bk-cart-summary { position: static !important; max-width: 520px; width: 100%; justify-self: end; }
        .bk-payment-layout { grid-template-columns: 1fr !important; }
        .bk-payment-summary { position: static !important; max-width: 560px; width: 100%; justify-self: end; }
        .bk-profile-shell { grid-template-columns: 220px minmax(0, 1fr) !important; }
        .bk-profile-member-grid { grid-template-columns: 1fr !important; gap: 26px !important; }
        .bk-search-feature { grid-template-columns: 1fr !important; gap: 58px !important; }
        .bk-discount-inner { grid-template-columns: 1fr !important; gap: 34px !important; }
        .bk-discount-ticket { max-width: 680px !important; justify-self: center !important; }
        .bk-search-project-card {
          width: min(640px, 100%) !important;
          margin: 0 auto !important;
          min-height: 520px !important;
          padding: 88px 70px 72px !important;
        }
      }

      @media (max-width: 900px) {
        .bk-product-grid {
          grid-template-columns: repeat(3, minmax(0, 184px)) !important;
          justify-content: space-around !important;
          gap: 64px 28px !important;
        }
      }

      @media (max-width: 720px) {
        :root { --header-h: 70px; }
        .bk-category-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
        .bk-categories-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 20px !important; }
        .bk-categories-main { padding: 44px 0 90px !important; }
        .bk-categories-title { font-size: clamp(30px, 9vw, 38px) !important; }
        .bk-categories-sub { margin-bottom: 42px !important; }
        .bk-category-card { height: 186px !important; }
        .bk-product-grid {
          grid-template-columns: repeat(2, minmax(0, 176px)) !important;
          justify-content: space-around !important;
          gap: 60px 24px !important;
        }
        .bk-product-card { width: 176px !important; }
        .bk-wishlist-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 72px 24px !important; }
        .bk-related-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; gap: 72px 28px !important; }
        .bk-search-store-grid,
        .bk-search-product-grid,
        .bk-search-recipe-grid { grid-template-columns: 1fr !important; }
        .bk-search-store-card {
          grid-template-columns: 72px minmax(0, 1fr) !important;
          min-height: 0 !important;
          padding: 18px !important;
        }
        .bk-search-store-card > span:last-child {
          grid-column: 1 / -1 !important;
          justify-self: start !important;
        }
        .bk-search-store-card > span:first-child {
          width: 72px !important;
          height: 72px !important;
        }
        .bk-product-detail-inner { padding-top: 48px !important; }
        .bk-product-detail-back { padding-bottom: 54px !important; }
        .bk-product-detail-actions { grid-template-columns: 1fr !important; gap: 18px !important; }
        .bk-product-detail-seller { margin-top: 42px !important; }
        .bk-product-detail-reviews-list { padding-left: 44px !important; }
        .bk-review-detail-modal {
          grid-template-columns: 1fr !important;
          gap: 18px !important;
          width: min(560px, 100%) !important;
        }
        .bk-review-detail-photo-frame,
        .bk-review-detail-photo-frame img {
          min-height: 240px !important;
          max-height: 320px !important;
        }
        .bk-store-detail-inner { padding-top: 44px !important; }
        .bk-store-detail-hero { min-height: 430px !important; margin-bottom: 92px !important; }
        .bk-store-detail-avatar {
          left: 28px !important;
          bottom: 128px !important;
          width: 112px !important;
          height: 112px !important;
        }
        .bk-store-detail-identity {
          left: 28px !important;
          right: 28px !important;
          bottom: 28px !important;
          max-width: none !important;
        }
        .bk-store-follow {
          right: 28px !important;
          bottom: -30px !important;
        }
        .bk-search-project-card {
          border-radius: 32px !important;
          min-height: auto !important;
          padding: 42px 28px !important;
        }
        .bk-search-project-title {
          font-size: 30px !important;
          margin-bottom: 18px !important;
        }
        .bk-search-project-text {
          font-size: 14px !important;
          margin-bottom: 20px !important;
        }
        .bk-search-materials-title {
          font-size: 22px !important;
        }
        .bk-search-material-item {
          font-size: 13px !important;
        }
        .bk-cart-layout { gap: 28px !important; }
        .bk-cart-item {
          grid-template-columns: 86px minmax(0, 1fr) 34px !important;
          column-gap: 14px !important;
          min-height: 164px !important;
          padding: 22px 16px 22px !important;
        }
        .bk-cart-item img {
          width: 78px !important;
          height: 78px !important;
        }
        .bk-auth-art-panel { min-height: 360px !important; padding: 26px !important; }
        .bk-auth-form-panel { padding: 48px 22px !important; }
        .bk-register-wrap { padding: 22px !important; }
        .bk-header-search { display: none !important; }
        .bk-payment-field-grid,
        .bk-payment-method-grid { grid-template-columns: 1fr !important; }
        .bk-payment-panel { padding: 28px 20px !important; }
        .bk-payment-select { grid-template-columns: 18px minmax(0, 1fr) !important; border-radius: 28px !important; }
        .bk-payment-select > span:last-child { grid-column: 2 !important; justify-self: start !important; }
        .bk-profile-shell { grid-template-columns: 1fr !important; }
        .bk-profile-sidebar {
          position: static !important;
          min-height: 0 !important;
        }
        .bk-profile-content { gap: 24px !important; }
        .bk-address-header { flex-direction: column !important; align-items: flex-start !important; }
        .bk-address-grid { grid-template-columns: 1fr !important; }
        .bk-profile-form-grid,
        .bk-profile-benefit-grid,
        .bk-address-modal-grid { grid-template-columns: 1fr !important; }
        .bk-address-modal { padding: 28px 20px 24px !important; }
        .bk-profile-order-card {
          grid-template-columns: 92px minmax(0, 1fr) !important;
          min-height: 0 !important;
        }
        .bk-profile-order-card img {
          width: 92px !important;
          height: 78px !important;
        }
        .bk-profile-order-card > span:first-child {
          width: 92px !important;
          height: 78px !important;
        }
        .bk-profile-order-card > div:last-child {
          grid-column: 1 / -1 !important;
          flex-direction: row !important;
          align-items: center !important;
        }
        .bk-orders-tabs { padding-bottom: 2px !important; }
        .bk-order-main-row { grid-template-columns: 1fr !important; }
        .bk-order-total-block { align-items: flex-start !important; text-align: left !important; }
        .bk-order-actions { justify-content: flex-start !important; }
        .bk-order-card-header { align-items: flex-start !important; flex-direction: column !important; }
        .bk-order-detail-grid { grid-template-columns: 1fr !important; }
        .bk-discount-ticket {
          grid-template-columns: 1fr !important;
          min-height: 0 !important;
        }
        .bk-discount-ticket::before,
        .bk-discount-ticket::after {
          right: 50% !important;
          background: #fdeee2;
        }
        .bk-discount-ticket::before {
          top: auto !important;
          bottom: 111px !important;
          transform: translate(-50%, 50%) !important;
        }
        .bk-discount-ticket::after {
          bottom: 111px !important;
          transform: translate(50%, 50%) !important;
        }
        .bk-ticket-stub {
          min-height: 112px !important;
          flex-direction: row !important;
          border-left: 0 !important;
          border-top: 2px dashed #17110f !important;
        }
      }

      @media (max-width: 520px) {
        .bk-category-grid { grid-template-columns: 1fr !important; }
        .bk-categories-grid { grid-template-columns: 1fr !important; gap: 18px !important; }
        .bk-categories-inner { padding-left: 18px !important; padding-right: 18px !important; }
        .bk-category-card { height: 190px !important; }
        .bk-product-grid {
          grid-template-columns: minmax(0, 220px) !important;
          justify-content: center !important;
          gap: 58px !important;
        }
        .bk-product-card { width: min(220px, 100%) !important; }
        .bk-product-detail-thumbs { gap: 10px !important; }
        .bk-product-detail-thumb { width: 64px !important; height: 64px !important; }
        .bk-product-detail-seller { grid-template-columns: 58px minmax(0, 1fr) !important; gap: 12px !important; }
        .bk-product-detail-seller > span:first-child { width: 58px !important; height: 58px !important; }
        .bk-product-detail-seller > div:nth-child(2) {
          min-height: 56px !important;
          font-size: 15px !important;
          padding: 0 14px !important;
        }
        .bk-review-detail-overlay {
          padding: 14px !important;
          align-items: center !important;
        }
        .bk-review-detail-modal {
          padding: 18px 16px 20px !important;
          box-shadow: 6px 6px 0 rgba(183,45,100,0.78), 0 22px 48px -26px rgba(0,0,0,0.48) !important;
        }
        .bk-review-detail-modal blockquote {
          font-size: 15.5px !important;
          line-height: 1.65 !important;
          padding-left: 16px !important;
        }
        .bk-review-item {
          grid-template-columns: minmax(0, 1fr) !important;
          padding: 18px 16px 16px 24px !important;
        }
        .bk-review-item [data-review-photo] {
          width: 82px !important;
          height: 62px !important;
          justify-self: start !important;
        }
        .bk-product-detail-more-grid { grid-template-columns: 1fr !important; gap: 62px !important; }
        .bk-store-stats { grid-template-columns: 1fr !important; gap: 18px !important; }
        .bk-store-story-card {
          border-radius: 42px !important;
          padding: 38px 22px !important;
          min-height: 0 !important;
        }
        .bk-store-rules-card {
          padding: 42px 22px 28px !important;
          transform: none !important;
        }
        .bk-store-products-grid { grid-template-columns: 1fr !important; gap: 62px !important; }
        .bk-wishlist-grid { grid-template-columns: 1fr !important; gap: 64px !important; }
        .bk-related-grid { grid-template-columns: 1fr !important; gap: 64px !important; }
        .bk-search-product-grid { gap: 62px !important; }
        .bk-cart-item {
          grid-template-columns: 44px minmax(0, 1fr) 36px !important;
          grid-template-rows: auto auto auto !important;
          column-gap: 12px !important;
          row-gap: 14px !important;
          align-items: start !important;
          min-height: 0 !important;
          padding: 18px 14px 20px !important;
          border-radius: 12px !important;
        }
        .bk-cart-item img {
          grid-column: 1 / -1 !important;
          grid-row: 1 !important;
          justify-self: center !important;
          width: 96px !important;
          height: 96px !important;
        }
        .bk-cart-item-check {
          grid-column: 1 !important;
          grid-row: 1 !important;
          align-self: start !important;
          justify-self: center !important;
          padding-top: 24px !important;
        }
        .bk-cart-remove {
          grid-column: 3 !important;
          grid-row: 1 !important;
          align-self: start !important;
          justify-self: center !important;
          width: 34px !important;
          height: 34px !important;
        }
        .bk-cart-item-info {
          grid-column: 1 / -1 !important;
          grid-row: 2 !important;
          width: 100% !important;
          justify-self: center !important;
          padding-top: 0 !important;
          margin-left: 0 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          text-align: left !important;
        }
        .bk-cart-item-title {
          max-width: min(260px, 100%) !important;
          display: -webkit-box !important;
          -webkit-box-orient: vertical !important;
          -webkit-line-clamp: 2 !important;
          overflow: hidden !important;
          margin: 0 0 10px !important;
          font-size: 17px !important;
          line-height: 1.25 !important;
          font-weight: 800 !important;
          text-align: left !important;
        }
        .bk-cart-tags {
          justify-content: flex-start !important;
          margin-bottom: 14px !important;
          gap: 8px !important;
        }
        .bk-cart-tags span {
          min-height: 30px !important;
          padding: 0 12px !important;
          font-size: 13.5px !important;
        }
        .bk-cart-qty-control {
          width: min(220px, 100%) !important;
          min-height: 40px !important;
          grid-template-columns: 54px minmax(0, 1fr) 54px !important;
        }
        .bk-cart-qty-control .bk-cart-qty {
          width: 54px !important;
        }
        .bk-cart-item-price {
          grid-column: 1 / -1 !important;
          grid-row: 3 !important;
          justify-self: start !important;
          padding-top: 0 !important;
          margin-left: 0 !important;
          font-size: 16px !important;
          text-align: left !important;
        }
        .bk-cart-summary { padding: 22px 16px 20px !important; }
        .bk-cart-summary > div {
          gap: 0 !important;
        }
        .bk-cart-summary > div > div {
          gap: 12px !important;
          font-size: 14.5px !important;
        }
        .bk-cart-summary > div > div strong {
          text-align: right !important;
          overflow-wrap: anywhere !important;
        }
        .bk-cart-summary > div > div:nth-child(3) {
          align-items: flex-start !important;
        }
        .bk-cart-summary > div > div:nth-child(3) strong {
          max-width: 176px !important;
          line-height: 1.25 !important;
        }
        .bk-cart-summary > p {
          font-size: 12.5px !important;
          margin-top: 16px !important;
        }
        .bk-auth-art-panel { min-height: 310px !important; }
        .bk-auth-social { width: 100% !important; }
        .bk-auth-modal-overlay { padding: 16px !important; align-items: center !important; }
        .bk-auth-modal { padding: 44px 20px 34px !important; border-radius: 10px !important; }
        .bk-auth-otp-input { min-height: 46px !important; font-size: 20px !important; }
        .bk-register-page { align-items: flex-start !important; }
        .bk-payment-summary { padding: 28px 20px 26px !important; }
        .bk-profile-main { padding: 26px 0 34px !important; }
        .bk-profile-shell { padding-left: 18px !important; padding-right: 18px !important; }
        .bk-profile-card { padding: 24px 18px !important; }
        .bk-profile-order-card { padding: 16px !important; }
        .bk-order-card { padding: 18px !important; }
        .bk-order-product-block { grid-template-columns: 78px minmax(0, 1fr) !important; gap: 12px !important; }
        .bk-order-product-block img,
        .bk-order-product-block > span:first-child {
          width: 78px !important;
          height: 78px !important;
        }
        .bk-order-product-title { font-size: 20px !important; }
        .bk-order-modal { padding: 26px 18px 22px !important; }
        .bk-order-detail-product {
          grid-template-columns: 52px minmax(0, 1fr) !important;
        }
        .bk-order-detail-product > strong:last-child {
          grid-column: 2 !important;
          justify-self: start !important;
        }
        .bk-discount-inner { padding: 0 18px !important; }
        .bk-discount-ticket { border-radius: 0 !important; }
        .bk-ticket-main { padding: 20px 18px 22px !important; }
        .bk-ticket-main > div:first-child { gap: 9px !important; flex-wrap: wrap !important; }
        .bk-ticket-value { font-size: 54px !important; }
        .bk-ticket-stub { padding: 18px !important; }
      }

      /* ---- Storefront header / hero / sections / footer / toast ---- */
      @media (max-width: 1100px) {
        .bk-seller-btn > span { display: none !important; }
        .bk-seller-btn { padding: 10px 12px !important; }
        .bk-header-right { gap: 12px !important; }
        .bk-hero { padding-top: 132px !important; }
      }

      @media (max-width: 860px) {
        .bk-seller-btn { display: none !important; }
        .bk-header-right { display: none !important; }
        .bk-nav-toggle { display: flex !important; }
        .bk-mobile-nav {
          position: absolute;
          top: calc(100% + 10px);
          left: 16px;
          right: 16px;
          background: #fffaf5;
          border: 1px solid #f4d199;
          border-radius: 18px;
          box-shadow: 0 18px 40px -18px rgba(89, 13, 38, 0.45);
          padding: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 120;
        }
        .bk-mobile-nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 13px 14px;
          background: transparent;
          border: none;
          border-radius: 12px;
          color: #3a231d;
          font-size: 15px;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
        }
        .bk-mobile-nav-item:hover { background: #ffe9d6 !important; }
        .bk-mobile-nav-cta {
          color: #590d26;
          background: linear-gradient(180deg, #fff8f2 0%, #ffe9d6 100%);
          border: 1px solid #f4d199;
        }
        .bk-mobile-nav-head {
          display: flex;
          flex-direction: column;
          gap: 2px;
          padding: 6px 14px 12px;
          border-bottom: 1px dashed #f4d199;
          margin-bottom: 6px;
        }
        .bk-mobile-nav-head strong { color: #590d26; font-size: 15px; }
        .bk-mobile-nav-head span { color: #8a6f66; font-size: 12.5px; }
        .bk-mobile-nav-count {
          margin-left: auto;
          background: #590d26;
          color: #fdeee2;
          font-size: 11px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
        }
        .bk-mobile-nav-danger { color: #a1315a !important; }
        .bk-hero { padding-bottom: 210px !important; }
        .bk-section { padding: 56px 0 !important; }
        .bk-footer-top { grid-template-columns: 1fr !important; gap: 34px !important; }
        .bk-footer-links { grid-template-columns: 1fr !important; row-gap: 6px !important; }
        .bk-footer-col { gap: 2px !important; }
        .bk-footer-col + .bk-footer-col {
          border-top: 1px solid rgba(253,238,226,0.12);
          margin-top: 12px !important;
          padding-top: 12px !important;
        }
        .bk-footer-col-title {
          display: flex !important;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          cursor: pointer;
          padding: 10px 0 !important;
          margin-bottom: 0 !important;
        }
        .bk-footer-col-caret { display: block !important; }
        .bk-footer-col-links { display: none !important; }
        .bk-footer-col-links.is-open {
          display: flex !important;
          flex-direction: column;
          gap: 12px;
          padding-bottom: 16px !important;
        }
        .bk-footer-bottom {
          flex-direction: column !important;
          align-items: flex-start !important;
          gap: 14px !important;
          padding: 28px 0 !important;
        }
        .bk-contact-grid { grid-template-columns: 1fr !important; }
        .bk-toast { max-width: calc(100vw - 36px) !important; white-space: normal !important; text-align: center; }
        .bk-cart-summary,
        .bk-payment-summary { max-width: 100% !important; }
        .bk-search-hero { padding-top: 64px !important; padding-bottom: 48px !important; }
        .bk-search-title-row { margin-bottom: 56px !important; }
        .bk-wishlist-main { padding: 48px 0 84px !important; }
        .bk-cart-main { padding: 36px 0 80px !important; }
        .bk-payment-main { padding: 40px 20px 80px !important; }
        .bk-payment-layout {
          grid-template-columns: 1fr !important;
          gap: 28px !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .bk-payment-layout > *,
        .bk-payment-form-stack {
          min-width: 0 !important;
          width: 100% !important;
        }
        .bk-payment-summary {
          position: static !important;
          margin-top: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .bk-payment-inner {
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .bk-payment-panel {
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          overflow-wrap: anywhere !important;
        }
        .bk-payment-title-block {
          margin-bottom: 24px !important;
        }
      }

      @media (max-width: 600px) {
        .bk-site-header { padding-left: 0 !important; padding-right: 0 !important; }
        .bk-header-inner { padding: 0 16px !important; }
        .bk-header-right { gap: 8px !important; }
        .bk-logo { font-size: 20px !important; }
        .bk-hero { padding-top: 116px !important; padding-bottom: 150px !important; }
        .bk-hero-inner,
        .bk-section-inner,
        .bk-product-section-inner,
        .bk-search-section-inner { padding-left: 20px !important; padding-right: 20px !important; }
        .bk-section { padding: 48px 0 !important; }
        .bk-product-section { padding: 10px 0 64px !important; }
        .bk-footer-inner { padding-left: 20px !important; padding-right: 20px !important; }
        .bk-footer-links { grid-template-columns: 1fr !important; gap: 26px !important; }
        .bk-footer-links > div + div { padding-top: 0 !important; }
        .bk-footer-top { padding-bottom: 30px !important; }
        .bk-cart-main { padding: 24px 0 72px !important; }
        .bk-cart-inner { padding-left: 16px !important; padding-right: 16px !important; }
        .bk-cart-back {
          font-size: 16px !important;
          padding-bottom: 14px !important;
        }
        .bk-cart-back svg {
          width: 21px !important;
          height: 21px !important;
        }
        .bk-cart-title-row {
          justify-content: flex-start !important;
          margin-bottom: 18px !important;
        }
        .bk-cart-clear {
          min-height: 38px !important;
          padding: 0 18px !important;
          font-size: 13.5px !important;
        }
        .bk-cart-select-all {
          padding: 0 2px 6px !important;
          min-height: 38px !important;
        }
        .bk-cart-select-all-toggle {
          font-size: 14px !important;
          line-height: 1.25 !important;
        }
        .bk-cart-checkbox {
          width: 22px !important;
          height: 22px !important;
        }
        .bk-cart-layout {
          gap: 22px !important;
          width: 100% !important;
        }
        .bk-cart-summary {
          width: 100% !important;
          max-width: 100% !important;
          min-height: 0 !important;
          border-radius: 12px !important;
          border-width: 3px !important;
          padding: 24px 18px 22px !important;
          box-sizing: border-box !important;
        }
        .bk-cart-summary h2 {
          margin-bottom: 22px !important;
        }
        .bk-cart-summary > span:last-child {
          top: 24px !important;
          right: 18px !important;
        }
        .bk-cart-checkout {
          min-height: 52px !important;
          margin-top: 24px !important;
          padding: 0 16px !important;
          font-size: 14px !important;
          gap: 8px !important;
        }
        .bk-search-title { font-size: 38px !important; line-height: 1.1 !important; }
        .bk-search-query-box { padding: 0 14px 8px !important; }
        .bk-auth-art-panel { min-height: 340px !important; }
        .bk-auth-art-copy { margin-top: 0 !important; }
        .bk-auth-art-title { font-size: 32px !important; line-height: 1.15 !important; }
        .bk-auth-art-text { font-size: 13px !important; }
        .bk-auth-form-panel { padding-top: 48px !important; padding-bottom: 48px !important; }
        .bk-contact-form-row { grid-template-columns: 1fr !important; }
        .bk-payment-main {
          padding: 22px 12px 72px !important;
        }
        .bk-payment-inner {
          padding: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
        }
        .bk-payment-layout {
          width: 100% !important;
          max-width: 100% !important;
          gap: 24px !important;
          box-sizing: border-box !important;
        }
        .bk-payment-form-stack {
          gap: 24px !important;
        }
        .bk-payment-back {
          font-size: 14px !important;
          padding-bottom: 14px !important;
        }
        .bk-payment-back svg {
          width: 20px !important;
          height: 20px !important;
        }
        .bk-payment-panel {
          padding: 18px 14px !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          border-radius: 8px !important;
          box-shadow: 0 12px 24px -20px rgba(183, 45, 100, 0.45) !important;
        }
        .bk-payment-panel h2 {
          align-items: flex-start !important;
          gap: 9px !important;
          font-size: 20px !important;
          line-height: 1.2 !important;
          margin-bottom: 16px !important;
        }
        .bk-payment-panel h2 svg {
          width: 18px !important;
          height: 18px !important;
          margin-top: 3px !important;
          flex-shrink: 0 !important;
        }
        .bk-payment-address-state,
        .bk-payment-address-empty {
          width: 100% !important;
          min-height: 112px !important;
          padding: 18px 12px !important;
          border-radius: 8px !important;
          gap: 10px !important;
        }
        .bk-payment-address-empty p {
          margin: 0 !important;
          font-size: 14px !important;
          line-height: 1.45 !important;
        }
        .bk-address-add {
          width: min(100%, 220px) !important;
          min-height: 46px !important;
          justify-content: center !important;
          padding: 0 16px !important;
          font-size: 13.5px !important;
          white-space: normal !important;
        }
        .bk-payment-address-preview {
          padding: 16px 14px !important;
        }
        .bk-payment-select {
          grid-template-columns: 16px minmax(0, 1fr) !important;
          gap: 12px !important;
          min-height: 0 !important;
          padding: 14px !important;
          border-radius: 22px !important;
        }
        .bk-payment-select > span:last-child {
          grid-column: 2 !important;
          justify-self: start !important;
          white-space: normal !important;
        }
        .bk-payment-select-title,
        .bk-payment-select strong {
          font-size: 13.5px !important;
          line-height: 1.2 !important;
        }
        .bk-payment-select-detail {
          font-size: 12px !important;
          line-height: 1.35 !important;
        }
        .bk-payment-select-price {
          font-size: 13px !important;
        }
        .bk-voucher-field {
          min-height: 54px !important;
          padding: 8px 14px 8px 10px !important;
          border-radius: 18px !important;
        }
        .bk-voucher-field > span:first-child {
          width: 34px !important;
          height: 34px !important;
        }
        .bk-payment-summary {
          padding: 22px 14px 20px !important;
          border-radius: 8px !important;
          box-shadow: 0 12px 24px -20px rgba(183, 45, 100, 0.42) !important;
        }
        .bk-payment-summary-item {
          grid-template-columns: 56px minmax(0, 1fr) !important;
          gap: 12px !important;
        }
        .bk-payment-summary-item img {
          width: 56px !important;
          height: 56px !important;
        }
        .bk-payment-summary-row,
        .bk-payment-total-row {
          align-items: flex-start !important;
          gap: 12px !important;
        }
        .bk-payment-summary-row strong,
        .bk-payment-total-row strong {
          text-align: right !important;
          overflow-wrap: normal !important;
        }
        .bk-payment-title {
          font-size: 29px !important;
          line-height: 1.1 !important;
        }
        .bk-payment-lead {
          font-size: 14px !important;
          line-height: 1.55 !important;
        }
        .bk-voucher-modal {
          padding: 24px 16px 20px !important;
        }
        .bk-discount-ticket {
          grid-template-columns: 1fr !important;
          grid-template-rows: auto auto !important;
          min-height: auto !important;
        }
        .bk-discount-ticket::before,
        .bk-discount-ticket::after {
          right: auto !important;
          top: auto !important;
          bottom: 74px !important;
        }
        .bk-discount-ticket::before {
          left: 0 !important;
          transform: translate(-50%, 50%) !important;
        }
        .bk-discount-ticket::after {
          right: 0 !important;
          transform: translate(50%, 50%) !important;
        }
        .bk-ticket-main {
          padding: 16px 14px !important;
        }
        .bk-ticket-main > div {
          padding: 14px 16px !important;
          border-radius: 16px !important;
          min-height: auto !important;
        }
        .bk-ticket-value {
          font-size: 42px !important;
          line-height: 1.0 !important;
        }
        .bk-ticket-label {
          font-size: 15px !important;
        }
        .bk-ticket-code {
          font-size: 15px !important;
        }
        .bk-ticket-decor-row {
          font-size: 11.5px !important;
        }
        .bk-ticket-stub {
          flex-direction: row !important;
          border-left: none !important;
          border-top: 2px dashed #17110f !important;
          padding: 12px 16px !important;
          height: 74px !important;
          align-items: center !important;
          justify-content: space-between !important;
          gap: 12px !important;
        }
        .bk-ticket-barcode {
          height: 38px !important;
          padding: 4px 6px !important;
          align-items: center !important;
        }
        .bk-ticket-barcode-bar {
          height: 24px !important;
        }
        .bk-ticket-stub > div:last-child {
          width: 54px !important;
          min-height: 38px !important;
          font-size: 18px !important;
        }
      }
    `}</style>
  );
}
