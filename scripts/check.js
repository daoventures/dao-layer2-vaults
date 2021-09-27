const { ethers } = require("hardhat")
const axios = require("axios")

const AXSETHVaultAddr = "0xcE097910Fc2DB329683353dcebF881A48cbA181e"
const SLPETHVaultAddr = "0x4aE61842Eb4E4634F533cb35B697a01319C457e2"
const ILVETHVaultAddr = "0x42Dd4b36eAD524f88cBf7f7702bAe3234d8eA46e"
const GHSTETHVaultAddr = "0xF9b0707dEE34d36088A093d85b300A3B910E00fC"

const mvfVaultAddr = "0x5b3ae8b672a753906b1592d44741f71fbd05ba8c"
const mvfStrategyAddr = "0xfa83CA66FDaCC4028DAB383de4adc8aB7DB21FF2"

const SUSHIAddr = "0x6b3595068778dd592e39a122f4f5a5cf09c90fe2"
const ILVAddr = "0x767fe9edc9e0df98e07454847909b5e959d7ca0e"
const GHSTAddr = "0x3f382dbd960e3a9bbceae22651e88158d2791550"
const WETHAddr = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"

const myAccAddr = "0x2C10aC0E6B6c1619F4976b2ba559135BFeF53c5E"

async function main() {
    let pendingRewardInUSD
    const [signer] = await ethers.getSigners()
    const res = await axios.get(`https://api.coingecko.com/api/v3/simple/token_price/ethereum?contract_addresses=${SUSHIAddr}%2C${ILVAddr}%2C${GHSTAddr}%2C${WETHAddr}&vs_currencies=usd`)
    const USDPerSUSHI = res.data[SUSHIAddr.toLowerCase()]["usd"]
    const USDPerILV = res.data[ILVAddr.toLowerCase()]["usd"]
    const USDPerGHST = res.data[GHSTAddr.toLowerCase()]["usd"]
    const USDPerWETH = res.data[WETHAddr.toLowerCase()]["usd"]

    // AXSETHVault
    const AXSETHVault = await ethers.getContractAt("Sushi", AXSETHVaultAddr, signer)
    const rewardInSUSHI_AXSETH = ethers.utils.formatEther(await AXSETHVault.getPendingRewards())
    pendingRewardInUSD = Math.round(parseFloat(rewardInSUSHI_AXSETH) * USDPerSUSHI * 100) / 100
    console.log("AXSETHVault pending reward:", pendingRewardInUSD)

    // SLPETHVault
    const SLPETHVault = await ethers.getContractAt("Sushi", SLPETHVaultAddr, signer)
    const rewardInSUSHI_SLPETH = ethers.utils.formatEther(await SLPETHVault.getPendingRewards())
    pendingRewardInUSD = Math.round(parseFloat(rewardInSUSHI_SLPETH) * USDPerSUSHI * 100) / 100
    console.log("SLPETHVault pending reward:", pendingRewardInUSD)

    // ILVETHVault
    const ILVETHVault = await ethers.getContractAt("ILVETHVault", ILVETHVaultAddr, signer)
    const rewardInVestedILV = ethers.utils.formatEther(await ILVETHVault.getPendingRewards())
    pendingRewardInUSD = Math.round(parseFloat(rewardInVestedILV) * USDPerILV * 100) / 100
    console.log("ILVETHVault pending reward:", pendingRewardInUSD)

    // GHSTETHVault
    const GHSTETHVault = await ethers.getContractAt("UniswapV3", GHSTETHVaultAddr, signer) // Token ID: 128992
    const [rewardInGHST, rewardInWETH] = await GHSTETHVault.getPendingRewards()
    console.log(rewardInGHST.toString(), rewardInWETH.toString())
    const GHSTpendingRewardInUSD = Math.round(parseFloat(ethers.utils.formatEther(rewardInGHST)) * USDPerGHST * 100) / 100
    const WETHpendingRewardInUSD = Math.round(parseFloat(ethers.utils.formatEther(rewardInWETH)) * USDPerWETH * 100) / 100
    console.log("GHSTETHVault pending reward: GHST:", GHSTpendingRewardInUSD, "WETH:", WETHpendingRewardInUSD)
    
    // My account
    const mvfVault = await ethers.getContractAt("MVFVault", mvfVaultAddr, signer)
    const pricePerFullShare = await mvfVault.getPricePerFullShare()
    const myLPTokenAmt = await mvfVault.balanceOf(myAccAddr)
    console.log("My LP token value in USD:", 
        ethers.utils.formatEther(myLPTokenAmt.mul(pricePerFullShare).div(ethers.constants.WeiPerEther))
    )
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
