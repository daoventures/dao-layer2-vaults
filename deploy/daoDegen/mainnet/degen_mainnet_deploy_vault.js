const { ethers, upgrades } = require("hardhat");
const { mainnet: addresses } = require("../../../addresses/daoDegen")


module.exports = async () => {

  const [deployer] = await ethers.getSigners();

  let Strategy = await ethers.getContractFactory("DaoDegenStrategy", deployer)
  let strategy = await upgrades.deployProxy(Strategy, [addresses.BUSDALPACAVault, addresses.BTCBXVSVault,
  addresses.BNBBELTVault, addresses.BUSDCHESSVault])

  console.log("Strategy Proxy: ", strategy.address)

  let Vault = await ethers.getContractFactory("DaoDegenVault", deployer)
  let vault = await upgrades.deployProxy(Vault, [
    "DAO L2 degen", "daoDegen",
    addresses.treasury, addresses.communityWallet, addresses.strategist, addresses.admin,
    addresses.biconomy, strategy.address])

  await strategy.setVault(vault.address)

  console.log("Vault Proxy: ", vault.address)

  return { vault, strategy }

};



module.exports.tags = ["degen_mainnet_deploy_vault"]

