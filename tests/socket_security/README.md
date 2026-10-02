# Socket Security Attack Scenario Tests

Covers all 10 attack scenarios from the security spec (Tasks 13–18).

## Prerequisites

```bash
# From this directory
npm install
```

> `socket.io-client` and `jsonwebtoken` must be available.
> They are installed by the test's own package.json below.

## Running Tests

```bash
# 1. Make sure all three backends are running locally first:
#    conza_customers/conza_backend  → default port 5000
#    conza_bp/bp_backend            → default port 5001
#    conza_vendor/sellerb           → default port 5002

# 2. Copy .env.test.example → .env.test and fill real test credentials.

# 3. Run:
node run_all.js
```

## Test Matrix

| # | Actor            | Attempted Action                          | Expected |
|---|------------------|-------------------------------------------|----------|
| 1 | Customer A       | `join_customer` with Customer B's ID      | DENIED   |
| 2 | Worker A         | `join_worker` with Worker B's ID          | DENIED   |
| 3 | Seller A         | `join_seller` with Seller B's ID          | DENIED   |
| 4 | Customer A       | `join_booking` owned by Customer B        | DENIED   |
| 5 | Worker A         | `join_booking` assigned to Worker B       | DENIED   |
| 6 | Customer A       | `join_booking` for their OWN booking      | ALLOWED  |
| 7 | Assigned Worker  | `join_booking` for their assigned booking | ALLOWED  |
| 8 | No token         | Any private room event                    | DENIED   |
| 9 | Expired JWT      | Connect with expired token                | DENIED   |
|10 | Network loss     | Reconnect → auto-rejoin rooms             | ALLOWED  |
