# Dao Degen vault

## Required L1 vaults 
L1 BSC vault contracts are in [repo](https://github.com/daoventures/dao-layer1-vaults/tree/bsc). 

Deploy the required L1 vaults and replace the addresses in
`addresses/daoDegen/index.js`

```
BUSD-ALPACA Vault

BNB-XVS Vault

BNB-BELT Vault

CHESS-USDCVault
```

## Steps to deploy and verify
```
npx hardhat deploy --network [mainnet/bscTestnet] --tags degen_mainnet_deploy_vault
```

Replace the address of vault and strategy implementation in `deploy/daoDegen/mainnet/verify.js`

```
npx hardhat deploy --network [mainnet/bscTestnet] --tags degen_mainnet_verify
```

## L1 whitelist
Whitelist the address of strategy by calling `setWhitelist` function in all the L1 vaults used.


## Addresses - BSC testnet
Strategy Proxy - [0xD1Fc92873FcC59708CF26e2b8302188735cAf526](https://testnet.bscscan.com/address/0xD1Fc92873FcC59708CF26e2b8302188735cAf526#readProxyContract)

Vault Proxy - [0x56F2005C3Fec21DD3c21899FbCEb1aAE5B4bc5dA](https://testnet.bscscan.com/address/0x56F2005C3Fec21DD3c21899FbCEb1aAE5B4bc5dA#readProxyContract)