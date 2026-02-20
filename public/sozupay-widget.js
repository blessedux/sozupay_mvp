/**
 * SozuPay checkout widget – embed on Shopify, WooCommerce, or custom sites.
 * Usage: load this script and call SozuPay.checkout({ amount, reference, storeId, successUrl, cancelUrl })
 * or use data-sozupay attributes on a button.
 */
(function () {
  var base = document.currentScript?.src?.replace(/\/sozupay-widget\.js.*$/, "") || "";
  window.SozuPay = {
    checkout: function (opts) {
      var amount = opts?.amount ?? "0";
      var reference = opts?.reference ?? "";
      var storeId = opts?.storeId ?? "";
      var successUrl = opts?.successUrl ?? window.location.href;
      var cancelUrl = opts?.cancelUrl ?? window.location.href;
      fetch(base + "/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: amount,
          reference: reference,
          storeId: storeId,
          successUrl: successUrl,
          cancelUrl: cancelUrl,
        }),
        credentials: "include",
      })
        .then(function (r) {
          return r.json();
        })
        .then(function (d) {
          if (d.checkoutUrl) window.location.href = d.checkoutUrl;
        })
        .catch(function () {});
    },
  };
  document.querySelectorAll("[data-sozupay-amount]").forEach(function (el) {
    el.addEventListener("click", function () {
      window.SozuPay.checkout({
        amount: el.getAttribute("data-sozupay-amount") || "0",
        reference: el.getAttribute("data-sozupay-reference") || "",
        storeId: el.getAttribute("data-sozupay-store") || "",
      });
    });
  });
})();
