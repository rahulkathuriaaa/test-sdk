# @mizuwallet-sdk/aptos-wallet-adapter

A Mizu Wallet plugin to be used with [Aptos Wallet Adapter](https://github.com/aptos-labs/aptos-wallet-adapter).

## Installation

```base
$ pnpm add @mizuwallet-sdk/aptos-wallet-adapter
```

## Usage

Initialized by **APP_ID**

```ts
const wallets = [
  new MizuWallet({
    appId: MIZU_APP_ID,
    network: 'mainnet',
  }),
];
```

and follow the instruction [adapter for dapps](https://github.com/aptos-labs/aptos-wallet-adapter/tree/main/packages/wallet-adapter-react)
