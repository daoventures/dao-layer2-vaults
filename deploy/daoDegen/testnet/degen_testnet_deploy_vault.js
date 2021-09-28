const { ethers, upgrades } = require("hardhat");
const { testnet: addresses } = require("../../../addresses/daoDegen")


module.exports = async () => {

  const [deployer] = await ethers.getSigners();

  let Strategy = await ethers.getContractFactory("DaoDegenStrategyTestnet", deployer)
  let strategy = await upgrades.deployProxy(Strategy, [addresses.BUSDALPACAVault, addresses.BTCBXVSVault,
  addresses.BNBBELTVault, addresses.BUSDCHESSVault])

  console.log("Strategy Proxy: ", strategy.address)

  let Vault = await ethers.getContractFactory("DaoDegenVaultTestnet", deployer)
  let vault = await upgrades.deployProxy(Vault, [
    "DAO L2 degen", "daoDegen",
    addresses.treasury, addresses.communityWallet, addresses.strategist, addresses.admin,
    addresses.biconomy, strategy.address])

  await strategy.setVault(vault.address)

  console.log("Vault Proxy: ", vault.address)

  return { vault, strategy }

};



module.exports.tags = ["degen_testnet_deploy_vault"]

