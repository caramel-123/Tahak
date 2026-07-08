# Booking Escrow — Testnet Deployment

Deployed and invoked with the Stellar CLI (`stellar contract deploy` / `stellar contract invoke`), no browser wallet involved — every transaction below was signed and submitted from the CLI using a funded testnet identity.

## Contract

| Field | Value |
|-------|-------|
| Contract | `booking_escrow` |
| Network | Stellar Testnet |
| Contract address | `CCH6XF6GXFN2K3VHFX6RVTW7SF5U3ZU6QI6SWM3Z5JE5GUZ74FY4KBYD` |
| Wasm hash | `d5f9223041e15550368613e21809b6a3d3f9a36067495d97ae8ff3788a93a597` |
| Escrowed token | Native XLM SAC — `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` |

Verify on Stellar Explorer: [stellar.expert/explorer/testnet/contract/CCH6XF6GXFN2K3VHFX6RVTW7SF5U3ZU6QI6SWM3Z5JE5GUZ74FY4KBYD](https://stellar.expert/explorer/testnet/contract/CCH6XF6GXFN2K3VHFX6RVTW7SF5U3ZU6QI6SWM3Z5JE5GUZ74FY4KBYD)

## Test accounts used for the demo invocation

| Role | Address |
|------|---------|
| Deployer / tourist (`tahak-deployer`) | `GCTNPPIKSSFQTMSLOBISTJ7MOQRKI3RZ55IOC6FFP6JXYSQ7OKBCYOOM` |
| Guide (`tahak-guide-demo`) | `GAWSLLUJSOB6BVD2BJLERMEBYN5EEIXPUBJGMFXQ42O5RIQZILC6QH4Z` |

Both were created with `stellar keys generate --fund`, which funds them with 10,000 testnet XLM via Friendbot.

## Real transactions (verifiable on stellar.expert)

| Step | Tx hash | What happened |
|------|---------|----------------|
| Upload wasm | [`59d23671e32fc4191a92abf470fe79b721ee12aa44b0591e5ca4f58cb7eba49d`](https://stellar.expert/explorer/testnet/tx/59d23671e32fc4191a92abf470fe79b721ee12aa44b0591e5ca4f58cb7eba49d) | Contract wasm uploaded to testnet |
| Deploy | [`72ce92029f769791941b72abb454ed722d2fe0e609d6bab70c1b284f403409c1`](https://stellar.expert/explorer/testnet/tx/72ce92029f769791941b72abb454ed722d2fe0e609d6bab70c1b284f403409c1) | Contract instance created at the address above |
| `init(token)` | [`c824e5390e3df2c906a0600c0f527f102f9a6d09234e354917012fc35f5fc579`](https://stellar.expert/explorer/testnet/tx/c824e5390e3df2c906a0600c0f527f102f9a6d09234e354917012fc35f5fc579) | Contract configured to escrow native XLM |
| `create_booking("TH2847", tourist, guide, 28000000)` | [`327908a0d6764fa97fdf334a49e9d7fff7b735d9283a8c92a2c5d7c68cdc2934`](https://stellar.expert/explorer/testnet/tx/327908a0d6764fa97fdf334a49e9d7fff7b735d9283a8c92a2c5d7c68cdc2934) | Booking `TH2847` opened for 2.8 XLM (mirrors the ₱2,800 Banaue booking in the app's demo data) |
| `fund("TH2847")` | [`be826dfda8fec90ff0581ffa2d6e76ef60f156544217578aca5bda6f2d8106ce`](https://stellar.expert/explorer/testnet/tx/be826dfda8fec90ff0581ffa2d6e76ef60f156544217578aca5bda6f2d8106ce) | **Real transfer**: 2.8 XLM moved from the tourist's wallet into the contract's balance |
| `release("TH2847")` | [`ce9b7f9b94efc3a036e72c5eec45770bf88604ae220a8a73530c8b702298c951`](https://stellar.expert/explorer/testnet/tx/ce9b7f9b94efc3a036e72c5eec45770bf88604ae220a8a73530c8b702298c951) | **Real transfer**: 2.8 XLM moved from the contract to the guide's wallet |

After `release`, `get_booking("TH2847")` returns `status: Released`, and the guide's testnet XLM balance is verifiably higher by exactly 2.8 XLM (confirmed via Horizon: `10002.8000000 XLM`, up from the 10,000 XLM Friendbot funding).

## Reproducing this

```bash
cd contracts
cargo test                                    # 4 unit tests, run against an in-memory Soroban test host
stellar contract build                        # produces target/wasm32v1-none/release/booking_escrow.wasm

stellar keys generate my-deployer --network testnet --fund
stellar contract deploy \
  --wasm target/wasm32v1-none/release/booking_escrow.wasm \
  --source my-deployer --network testnet --alias my_booking_escrow

stellar contract id asset --asset native --network testnet   # native XLM SAC address
stellar contract invoke --id my_booking_escrow --source my-deployer --network testnet --send=yes \
  -- init --token <native-sac-address>
```

## Known simplifications (MVP scope)

- `release` and `refund` both currently require the **tourist's** signature (the tourist confirms milestone completion or requests a refund). A production version would gate `refund` behind guide agreement or Tourism Officer dispute resolution — that maps to the app's [Resolve Dispute](../README.md#features) screen, which is still UI-only.
- The frontend does not yet call this contract — bookings are still recorded in Supabase only. Wiring `fund`/`release` into the Booking and QR Check-In screens (with Freighter signing the calls) is the next step; see the README's Future Scope section.
