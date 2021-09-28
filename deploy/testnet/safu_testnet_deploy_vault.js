const { ethers, upgrades } = require("hardhat");
const { testnet: addresses } = require("../../addresses/citadelBSC")


module.exports = async () => {

  const [deployer] = await ethers.getSigners();

  let Strategy = await ethers.getContractFactory("DaoSafuStrategyTestnet", deployer)
  let strategy = await upgrades.deployProxy(Strategy, [addresses.BTCBWETHVault, addresses.BTCBBNBVault,
  addresses.CAKEBNBVault, addresses.BTCBBUSDVault])

  console.log("Strategy Proxy: ", strategy.address)

  let Vault = await ethers.getContractFactory("DaoSafuVaultTestnet", deployer)
  let vault = await upgrades.deployProxy(Vault, [
    "DAO L2 safu", "daosafu",
    addresses.treasury, addresses.communityWallet, addresses.strategist, addresses.admin,
    addresses.biconomy, strategy.address])

  await strategy.setVault(vault.address)

  console.log("Vault Proxy: ", vault.address)

  return { vault, strategy }

};



module.exports.tags = ["safu_testnet_verify_vault"]

// Strategy Proxy:  0x7436297148faCE594f1b2f04a2901c3bB65Eb771
// Vault Proxy:  0x81390703430015A751F967694d5CCb8745FdA254