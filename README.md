# uniswap-liquidity-tests

This has benn made using truffle.

## Getting started

Rename the shellfile_example.sh to shellfile.sh. Replace "YOUR_INFURA_API_KEY" with your Infura key for the mainnet. Then from your terminal, run the following command -

```bash
source shellfile.sh
```

This will start a network locally. This network will be a fork of the Ethereum mainnet.

To install dependencies -

```bash
npm install
```

To test the contract, use the following -

```bash
truffle test --network mainnetFork
```
