const { ethers, upgrades } = require("hardhat");
const { mainnet: addresses } = require("../../addresses/citadelBSC")


module.exports = async () => {

  const [deployer] = await ethers.getSigners();

  let Strategy = await ethers.getContractFactory("CitadelV2StrategyBSC", deployer)
  let strategy = await upgrades.deployProxy(Strategy, [addresses.BTCBWETHVault, addresses.BTCBBNBVault,
  addresses.CAKEBNBVault, addresses.BTCBBUSDVault])

  console.log("Strategy Proxy: ", strategy.address)

  let Vault = await ethers.getContractFactory("CitadelV2VaultBSC", deployer)
  let vault = await upgrades.deployProxy(Vault, [
    "DAO L2 safu", "daosafu",
    addresses.treasury, addresses.communityWallet, addresses.strategist, addresses.admin,
    addresses.biconomy, strategy.address])

  await strategy.setVault(vault.address)

  console.log("Vault Proxy: ", vault.address)

  return { vault, strategy }

};



module.exports.tags = ["safu_mainnet_deploy_vault"]

