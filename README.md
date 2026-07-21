# pdnSnap Vanilla

Plain JavaScript payment SDK (Midtrans Snap–style). Merchants load one script; checkout runs in a hosted iframe.

No bundler, no framework, no Tailwind.

## Architecture

```
merchant page
  └─ loader/snap.js  →  window.pdnSnap
       ├─ POST {SCRIPT_TOKEN_URL}/snap/transactions
       └─ iframe → checkout/
            └─ POST {SCRIPT_TOKEN_URL}/v1/snap/charge
```

| Path          | Role                               |
| ------------- | ---------------------------------- |
| `loader/`     | Merchant-facing SDK (`snap.js`)    |
| `checkout/`   | Hosted payment UI (popup or embed) |
| `protocol.js` | Shared `postMessage` contract      |
| `proxy.py`    | Local CORS proxy for development   |

Merchant demo: [`../merchant-pdn-snap-vanilla`](../merchant-pdn-snap-vanilla).

## Prerequisites

- Node.js (to build the loader)
- Python 3 (static servers + optional CORS proxy)

## Configuration

There is no `.env` inject. Edit config files directly.

| File                 | Variable           | Description                                               |
| -------------------- | ------------------ | --------------------------------------------------------- |
| `loader/config.js`   | `SCRIPT_TOKEN_URL` | API base URL (no trailing slash) for `/snap/transactions` |
| `loader/config.js`   | `CHECKOUT_URL`     | Checkout iframe URL (include trailing slash)              |
| `checkout/config.js` | `SCRIPT_TOKEN_URL` | Same base URL for charge + status                         |
| `checkout/config.js` | `POLL_INTERVAL_MS` | Status poll interval in milliseconds (default `2000`)     |

**Local (with CORS proxy):**

```js
SCRIPT_TOKEN_URL: 'http://localhost:8082',
CHECKOUT_URL: 'http://localhost:8081/checkout/',
```

**Direct API (requires CORS on the API):**

```js
SCRIPT_TOKEN_URL: 'https://api.arcane-magus.site',
```

After changing `loader/config.js`, rebuild the loader.

## Build

Concatenates loader modules into a single merchant file:

```bash
cd pdn-snap-vanilla
node loader/build.mjs
```

Output: `loader/snap.js`

Sources (in order):

1. `protocol.js`
2. `loader/config.js`
3. `loader/ui.js`
4. `loader/messaging.js`
5. `loader/bootstrap.js`
6. `loader/snap.core.js`

Rebuild whenever any of those files change.

Checkout is plain static JS — no build step.

## Run locally

Use three terminals (HTTP required; do not open `file://`).

**Terminal 1 — checkout + loader (8081)**

```bash
cd pdn-snap-vanilla
python3 -m http.server 8081
```

- Checkout: http://localhost:8081/checkout/
- Loader: http://localhost:8081/loader/snap.js

**Terminal 2 — CORS proxy (8082)**

```bash
cd pdn-snap-vanilla
python3 proxy.py
```

Forwards `http://localhost:8082/*` → `https://api.arcane-magus.site/*` and adds CORS headers.

**Terminal 3 — merchant demo (8080)**

```bash
cd merchant-pdn-snap-vanilla
python3 -m http.server 8080
```

Open http://localhost:8080

## Merchant integration

### Script tag

```html
<script
  src="https://your-cdn.example.com/snap.js"
  pdn-snap-key="YOUR_CLIENT_KEY"
></script>
```

Local demo:

```html
<script
  src="http://localhost:8081/loader/snap.js"
  pdn-snap-key="clox_ck_..."
></script>
```

### API

```js
pdnSnap.pay(params, callbacks);
pdnSnap.embed(params, callbacks); // returns { hide } or null
pdnSnap.show();
pdnSnap.hide();
```

#### Params

| Field            | Type   | Required   | Description                           |
| ---------------- | ------ | ---------- | ------------------------------------- |
| `orderId`        | string | yes        | Merchant order id (API `order_id`)    |
| `amount`         | number | yes        | Integer amount                        |
| `currency`       | string | no         | Default `IDR`                         |
| `payment_method` | string | no         | Skip list: `QRIS`, `VA_PERMATA`, etc. |
| `embedId`        | string | embed only | DOM id of container                   |

#### Callbacks

| Callback    | When                                               |
| ----------- | -------------------------------------------------- |
| `onPending` | Once after successful charge (`REQUEST` / pending) |
| `onSuccess` | Payment settled (`data.status === "SUCCESS"`)      |
| `onError`   | Bootstrap/charge failure, expire, deny             |
| `onClose`   | User closed Snap without completing                |

```js
pdnSnap.pay(
  { orderId: "ORD-1", amount: 10000, currency: "IDR" },
  {
    onPending: (r) => {},
    onSuccess: (r) => {},
    onError: (r) => {},
    onClose: () => {},
  },
);

// Direct channel
pdnSnap.pay(
  { orderId: "ORD-1", amount: 10000, payment_method: "QRIS" },
  callbacks,
);

// Embed
pdnSnap.embed(
  { orderId: "ORD-1", amount: 10000, embedId: "snap-container" },
  callbacks,
);
```

## Payment flow

1. **Bootstrap** — `POST {SCRIPT_TOKEN_URL}/snap/transactions`  
   Body: `{ client_key, order_id, amount, currency }`  
   → `{ token, payment_methods }`

2. **Checkout UI** — list from `payment_methods`, or direct via `payment_method`

3. **Charge** — `POST {SCRIPT_TOKEN_URL}/v1/snap/charge`

| Type | Body                                                        |
| ---- | ----------------------------------------------------------- |
| QRIS | `{ token, payment_type: "QRIS" }` (no `channel_code`)       |
| VA   | `{ token, payment_type: "VA", channel_code: "VA_PERMATA" }` |

4. **Status poll** — `GET {SCRIPT_TOKEN_URL}/v1/snap/transactions/{transaction_id}`  
   Uses `data.transaction_id` from charge. Interval: `POLL_INTERVAL_MS` in `checkout/config.js`.  
   `data.status`: `REQUEST` (keep polling) → `SUCCESS` | `FAILED` | `EXPIRED` (stop).  
   Poller is stopped on modal close, Change method, settle, or iframe `DESTROY`.

`order_id` is single-use. Reuse returns `DUPLICATE_ORDER_ID`. The loader reports this via `onError` **before** opening/replacing Snap (does not call `hide` / `onClose`).

## CORS

Browsers block `localhost` → production API unless the API sends `Access-Control-Allow-Origin`.

- **Dev:** use `proxy.py` and `SCRIPT_TOKEN_URL: 'http://localhost:8082'`
- **Prod:** enable CORS on the API for merchant and checkout origins

## Production notes

- Browser callbacks are UX only — confirm payment on your backend (webhook).
- CC is listed but disabled until a charge contract exists.
