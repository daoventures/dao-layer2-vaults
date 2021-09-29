# Dao Safu vault

## Required L1 vaults 
L1 BSC vault contracts are in [repo](https://github.com/daoventures/dao-layer1-vaults/tree/bsc). 

Deploy the required L1 vaults and replace the addresses in
`addresses/citadelBsc/index.js`

```
BTCB-WETH Vault
BTCB-BNB Vault
CAKE-BNB Vault
BTCB-BUSD Vault
```

## Steps to deploy and verify - mainnet
```
npx hardhat deploy --network mainnet --tags safu_mainnet_deploy_vault
```

Replace the address of vault and strategy implementation in `deploy/mainnet/verify.js`

```
npx hardhat deploy --network mainnet--tags safu_mainnet_verify
```

## Steps to deploy and verify - testnet

Replace the address of vault and strategy implementation in `deploy/testnet/verifyTestnet.js`
```
npx hardhat deploy --network bscTestnet --tags safu_testnet_verify
```


## Addresses - BSC testnet
Strategy Proxy - [0x7436297148faCE594f1b2f04a2901c3bB65Eb771](https://testnet.bscscan.com/address/0x7436297148faCE594f1b2f04a2901c3bB65Eb771#readProxyContract)

Vault Proxy - [0x81390703430015A751F967694d5CCb8745FdA254](https://testnet.bscscan.com/address/0x81390703430015A751F967694d5CCb8745FdA254#readProxyContract)