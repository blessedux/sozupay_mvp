# E-commerce integration

Same wallet and transaction list as payment walls. Integrate via widget or REST API.

## Checkout widget

Load the script from your SozuPay dashboard origin (e.g. `https://dashboard.sozupay.com/sozupay-widget.js`).

### Option 1: Data attributes

Add a button with attributes; the script will bind click and open checkout:

```html
<button
  data-sozupay-amount="10.50"
  data-sozupay-reference="order-123"
  data-sozupay-store="shopify-my-store"
>
  Pay with SozuPay
</button>
<script src="https://your-dashboard-url/sozupay-widget.js"></script>
```

### Option 2: JavaScript API

```javascript
SozuPay.checkout({
  amount: "10.50",
  reference: "order-123",
  storeId: "shopify-my-store",
  successUrl: "https://yoursite.com/thank-you",
  cancelUrl: "https://yoursite.com/cart",
});
```

## REST API

### Create checkout session

`POST /api/checkout/create` (authenticated with session cookie)

Request body:

```json
{
  "amount": "10.50",
  "reference": "order-123",
  "storeId": "shopify-my-store",
  "successUrl": "https://yoursite.com/thank-you",
  "cancelUrl": "https://yoursite.com/cart"
}
```

Response:

```json
{
  "id": "checkout-...",
  "checkoutUrl": "https://dashboard.sozupay.com/checkout/...",
  "amount": "10.50",
  "reference": "order-123",
  "storeId": "shopify-my-store"
}
```

Redirect the customer to `checkoutUrl`. After payment, funds credit the same SozuPay wallet; transactions appear in the dashboard with source tagged (e.g. store).

## Webhook contract

SozuPay can send webhooks to your store (e.g. payment confirmed) and you can send events to SozuPay.

### Incoming (SozuPay → your store)

Configure webhook URL in dashboard (Settings → Stores). We send:

- `payment.completed` – payment credited to merchant wallet
- `payout.completed` – payout sent (if applicable)

Payload shape (example):

```json
{
  "event": "payment.completed",
  "payload": {
    "id": "...",
    "amount": "10.50",
    "reference": "order-123",
    "storeId": "shopify-my-store",
    "stellarTxHash": "..."
  }
}
```

### Outgoing (your store → SozuPay)

`POST /api/webhooks/sozupay` – receive notifications from your payment provider or store. In production we verify signature and tag transactions with source (store).

## Shopify / WooCommerce

1. Install the widget script in your theme or plugin.
2. On checkout, set `amount` to order total and `reference` to order id.
3. Set `storeId` to a unique store identifier (e.g. `shopify-{shop}` or `woo-{site}`).
4. Configure webhook URL in SozuPay dashboard when available.

Same balance and transaction list as payment walls; filter by source in the dashboard.
