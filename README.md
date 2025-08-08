## BEP-20 USDT Wrapper (BSC)

Wrapped/mirrored BEP‑20 token for BSC USDT (`0x55d398326f99059fF775485246999027B3197955`).

- **deposit(amount)**: user transfers USDT to this contract and receives 1:1 wrapped USDT (wUSDT)
- **withdraw(amount)**: user burns wUSDT and receives USDT back 1:1
- **transfer**: standard ERC‑20 transfers for wUSDT

This updates balances on the real USDT contract on BscScan because deposits move the underlying USDT into the wrapper contract.

## Contracts

- `contracts/WrappedUSDTBSC.sol`: Main wrapper contract

## Prerequisites

- Node.js LTS and npm
- A BSC RPC endpoint (mainnet and/or testnet)
- A deployer wallet with BNB for gas on the chosen network

## Install

```bash
npm i
```

## Configure environment

Create `.env` in the repository root (you can copy from `.env.example` if present):

```
BSC_RPC_URL=https://bsc-dataseed.binance.org
BSC_TESTNET_RPC_URL=https://data-seed-prebsc-1-s1.binance.org:8545
DEPLOYER_PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE
BSCSCAN_API_KEY=your_bscscan_api_key
UNDERLYING_ADDRESS=0x55d398326f99059fF775485246999027B3197955
HARDHAT_FORK=0
```

## Build and test

```bash
npx hardhat compile
$env:HARDHAT_DISABLE_TELEMETRY='1'; npx hardhat test
```

To run a forked mainnet (optional), set `HARDHAT_FORK=1` in `.env` and relaunch Hardhat commands.

## Deploy

Mainnet BSC:

```bash
npm run deploy:bsc
```

Testnet BSC:

```bash
npm run deploy:testnet
```

The script deploys `WrappedUSDTBSC` with the underlying defaulting to BSC USDT. You can override with `UNDERLYING_ADDRESS` in `.env`.

## Verify (optional)

```bash
npx hardhat verify --network bsc <WRAPPER_ADDRESS> 0x55d398326f99059fF775485246999027B3197955
```

## Interact (BscScan)

1) Approve USDT to wrapper:
- Go to USDT on BscScan → Write Contract → `approve(spender=WRAPPER_ADDRESS, value=amount)`

2) Deposit/mint wUSDT:
- Go to wrapper contract on BscScan → Write → `deposit(amount)`
- Your USDT decreases; wrapper’s USDT balance increases; your wUSDT increases

3) Transfer wUSDT:
- Use `transfer(to, amount)` on the wrapper or add the token in your wallet to transfer

4) Redeem/burn wUSDT:
- Wrapper → `withdraw(amount)` → Receive USDT back 1:1

Add the deployed wrapper address as a custom token in your wallet to view wUSDT.

## Local fork demo (optional)

There is a script that demonstrates depositing and transferring on a forked BSC:

```bash
$env:HARDHAT_FORK='1'; npx hardhat run scripts/fork-demo.ts
```

## Swappability (PancakeSwap V2)

To demonstrate swapping, create a pool for `wUSDT/USDT` using PancakeSwap V2 Router (`0x10ED43C718714eb63d5aA57B78B54704E256024E`):

1) Add initial liquidity at 1:1 (e.g., 100 USDT + 100 wUSDT)
2) Use Router to swap between USDT and wUSDT to verify swappability

If you want, we can add a scripted example to deploy a local Pancake V2 pair and exercise swaps.

## Notes & Security

- The wrapper must hold sufficient USDT liquidity to satisfy withdrawals.
- This code is provided as-is. Consider audits and proper operational procedures for production use.


