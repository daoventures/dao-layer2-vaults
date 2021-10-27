const ethers = require("ethers")
const IERC20_ABI = require("./IERC20_ABI.json")
const router_ABI = require("./router_ABI.json")
const avaxVaultL1 = require("./AvaxVaultL1.json").abi
const avaxVaultABI = require("./AvaxVault.json").abi
const avaxStableVaultABI = require("./AvaxStableVault.json").abi
const deXAvaxStrategyABI = require("./DeXAvaxStrategy.json").abi
const deXStableStrategyABI = require("./DeXStableStrategy.json").abi
const stableAvaxStrategyABI = require("./StableAvaxStrategy.json").abi
const stableStableStrategyABI = require("./StableStableStrategy.json").abi

const USDTAddr = "0xc7198437980c041c805A1EDcbA50c1Ce5db95118"
const USDCAddr = "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664"
const DAIAddr = "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70"
const WAVAXAddr = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"

const JOEAddr = "0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd"
const PNGAddr = "0x60781C2586D68229fde47564546784ab3fACA982"
const LYDAddr = "0x4C9B4E1AC6F24CdE3660D5E4Ef1eBF77C710C084"

const JOEAVAXVaultAddr = ""
const PNGAVAXVaultAddr = ""
const LYDAVAXVaultAddr = ""

const jRouterAddr = "0x60aE616a2155Ee3d9A68541Ba4544862310933d4"
const pRouterAddr = "0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106"
const lRouterAddr = "0xA52aBE4676dbfd04Df42eF7755F01A3c41f28D27"

const getAmountsOutMinDeXAvax = async (
    avaxVaultAddr, dexAvaxStrategyAddr, shareToWithdraw, stablecoinAddr, provider
) => {
    // provider = new ethers.providers.Web3Provider(provider) // uncomment this to change Web3 provider to Ethers provider
    if (!ethers.BigNumber.isBigNumber(shareToWithdraw)) shareToWithdraw = new ethers.BigNumber.from(shareToWithdraw)

    const avaxVault = new ethers.Contract(avaxVaultAddr, avaxVaultABI, provider)
    const dexAvaxStrategy = new ethers.Contract(dexAvaxStrategyAddr, deXAvaxStrategyABI, provider)

    const amtWithdrawInUSD = (
        (await avaxVault.getAllPoolInUSD())
            .sub(await avaxVault.totalPendingDepositAmt()))
            .mul(shareToWithdraw)
            .div(await avaxVault.totalSupply()
    )

    const USDTContract = new ethers.Contract(USDTAddr, IERC20_ABI, provider)
    const USDCContract = new ethers.Contract(USDCAddr, IERC20_ABI, provider)
    const DAIContract = new ethers.Contract(DAIAddr, IERC20_ABI, provider)
    const USDTAmtInVault = (await USDTContract.balanceOf(avaxVault.address)).mul(ethers.utils.parseUnits("1", 12))
    const USDCAmtInVault = (await USDCContract.balanceOf(avaxVault.address)).mul(ethers.utils.parseUnits("1", 12))
    const DAIAmtInVault = await DAIContract.balanceOf(avaxVault.address)
    const totalAmtInVault = USDTAmtInVault.add(USDCAmtInVault).add(DAIAmtInVault).sub(await avaxVault.fees())

    let amountsOutMin
    if (amtWithdrawInUSD.gt(totalAmtInVault)) {
        const router = new ethers.Contract(routerAddr, router_ABI, provider)
        const oneEther = ethers.utils.parseEther("1")

        const amtToWithdrawFromStrategy = amtWithdrawInUSD.sub(USDTAmtInVault)
        const strategyAllPoolInUSD = await dexAvaxStrategy.getAllPoolInUSD()
        const sharePerc = amtToWithdrawFromStrategy.mul(oneEther).div(strategyAllPoolInUSD)

        const WAVAXContract = new ethers.Contract(WAVAXAddr, IERC20_ABI, provider)
        const WAVAXAmtBefore = await WAVAXContract.balanceOf(dexAvaxStrategyAddr)

        const JOEAVAXVault = new ethers.Contract(JOEAVAXVaultAddr, avaxVaultL1, provider)
        const JOEAmt = (await JOEAVAXVault.balanceOf(dexAvaxStrategyAddr)).mul(sharePerc).div(oneEther)


        // const RGTContract = new ethers.Contract(RGTAddr, IERC20_ABI, provider)
        // const RGTAmtToWithdraw = (await RGTContract.balanceOf(dexAvaxStrategy.address)).mul(sharePerc).div(oneEther)
        // const amountOutRGTWAVAX = (await router.getAmountsOut(RGTAmtToWithdraw, [RGTAddr, WAVAXAddr]))[1]
        // const amountOutMinRGTWAVAX = (amountOutRGTWAVAX).mul(995).div(1000)

        // const SPELLContract = new ethers.Contract(SPELLAddr, IERC20_ABI, provider)
        // const SPELLAmtToWithdraw = (await SPELLContract.balanceOf(dexAvaxStrategy.address)).mul(sharePerc).div(oneEther)
        // const amountOutSPELLWAVAX = (await router.getAmountsOut(SPELLAmtToWithdraw, [SPELLAddr, WAVAXAddr]))[1]
        // const amountOutMinSPELLWAVAX = (amountOutSPELLWAVAX).mul(995).div(1000)

        // const OHMContract = new ethers.Contract(OHMAddr, IERC20_ABI, provider)
        // const OHMAmtToWithdraw = (await OHMContract.balanceOf(dexAvaxStrategy.address)).mul(sharePerc).div(oneEther)
        // const amountOutOHMWAVAX = (await router.getAmountsOut(OHMAmtToWithdraw, [OHMAddr, DAIAddr, WAVAXAddr]))[2]
        // const amountOutMinOHMWAVAX = (amountOutOHMWAVAX).mul(995).div(1000)

        // const ALCXContract = new ethers.Contract(ALCXAddr, IERC20_ABI, provider)
        // const ALCXAmtToWithdraw = (await ALCXContract.balanceOf(dexAvaxStrategy.address)).mul(sharePerc).div(oneEther)
        // const amountOutALCXWAVAX = (await router.getAmountsOut(ALCXAmtToWithdraw, [ALCXAddr, WAVAXAddr]))[1]
        // const amountOutMinALCXWAVAX = (amountOutALCXWAVAX).mul(995).div(1000)

        // const ICEContract = new ethers.Contract(ICEAddr, IERC20_ABI, provider)
        // const ICEAmtToWithdraw = (await ICEContract.balanceOf(dexAvaxStrategy.address)).mul(sharePerc).div(oneEther)
        // const amountOutICEWAVAX = (await router.getAmountsOut(ICEAmtToWithdraw, [ICEAddr, WAVAXAddr]))[1]
        // const amountOutMinICEWAVAX = (amountOutICEWAVAX).mul(995).div(1000)

        // const INVContract = new ethers.Contract(INVAddr, IERC20_ABI, provider)
        // const INVAmtToWithdraw = (await INVContract.balanceOf(dexAvaxStrategy.address)).mul(sharePerc).div(oneEther)
        // const amountOutINVWAVAX = (await router.getAmountsOut(INVAmtToWithdraw, [INVAddr, WAVAXAddr]))[1]
        // const amountOutMinINVWAVAX = (amountOutINVWAVAX).mul(995).div(1000)

        // const TOKEContract = new ethers.Contract(TOKEAddr, IERC20_ABI, provider)
        // const TOKEAmtToWithdraw = (await TOKEContract.balanceOf(dexAvaxStrategy.address)).mul(sharePerc).div(oneEther)
        // const amountOutTOKEWAVAX = (await router.getAmountsOut(TOKEAmtToWithdraw, [TOKEAddr, WAVAXAddr]))[1]
        // const amountOutMinTOKEWAVAX = (amountOutTOKEWAVAX).mul(995).div(1000)

        const amountOutWAVAX = amountOutRGTWAVAX
            .add(amountOutSPELLWAVAX)
            .add(amountOutOHMWAVAX)
            .add(amountOutALCXWAVAX)
            .add(amountOutICEWAVAX)
            .add(amountOutINVWAVAX)
            .add(amountOutTOKEWAVAX)
        const amountOutMinWAVAXStablecoin = ((await router.getAmountsOut(amountOutWAVAX, [WAVAXAddr, stablecoinAddr]))[1]).mul(995).div(1000)
        
        amountsOutMin = [
            amountOutMinWAVAXStablecoin, 
            amountOutMinRGTWAVAX, 
            amountOutMinSPELLWAVAX, 
            amountOutMinOHMWAVAX, 
            amountOutMinALCXWAVAX, 
            amountOutMinICEWAVAX, 
            amountOutMinINVWAVAX, 
            amountOutMinTOKEWAVAX
        ]
    } else {
        amountsOutMin = []
    }

    return amountsOutMin
}

module.exports = {
    getAmountsOutMinDeXAvax
}