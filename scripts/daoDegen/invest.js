const ethers = require("ethers")
const IERC20_ABI = require("../../middleware/IERC20_ABI.json")
const pair_ABI = require("../../middleware/pair_ABI.json")
const router_ABI = require("../../middleware/router_ABI.json")

const VaultABI = require("./L2Vault_ABI.json")
const StrategyABI = require("./L2_strategy_ABI.json")

const USDTAddr = "0x55d398326f99059fF775485246999027B3197955"
const USDCAddr = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
const BUSDAddr = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
const WBNBAddr = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
const ALPACAAddr = "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F"
const XVSAddr = "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63"
const BELTAddr = "0xE0e514c71282b6f4e823703a39374Cf58dc3eA4f"
const CHESSAddr = "0x20de22029ab63cf9A7Cf5fEB2b737Ca1eE4c82A6"

const pnckRouterAddr = "0x10ED43C718714eb63d5aA57B78B54704E256024E"

const BUSDALPACAVaultAddr = ""
const BNBXVSVaultAddr = ""
const BNBBELTVaultAddr = ""
const CHESSUSDCVaultAddr = ""

const VaultAddr = ""
const strategyAddr = ""

const invest = async () => {
    const [deployer] = await ethers.getSigner()
    if (!ethers.BigNumber.isBigNumber(shareToWithdraw)) shareToWithdraw = new ethers.BigNumber.from(shareToWithdraw)

    const vault = new ethers.Contract(VaultAddr, VaultABI, deployer)
    const strategy = new ethers.Contract(strategyAddr, StrategyABI, deployer)
    const pnckRouter = new ethers.Contract(pnckRouterAddr, router_ABI, deployer)

    const USDTContract = new ethers.Contract(USDTAddr, IERC20_ABI, deployer)
    const USDCContract = new ethers.Contract(USDCAddr, IERC20_ABI, deployer)
    const BUSDContract = new ethers.Contract(BUSDAddr, IERC20_ABI, deployer)
    const WBNBContract = new ethers.Contract(WBNBAddr, IERC20_ABI, deployer)

    const USDTAmtInVault = (await USDTContract.balanceOf(vault.address))
    const USDCAmtInVault = (await USDCContract.balanceOf(vault.address))
    const BUSDAmtInVault = await BUSDContract.balanceOf(vault.address)
    let fees = await vault.fees()

    //transferFee
    if (fees > 0) {
        USDTAmtInVault = USDTAmtInVault.gt(fees) ? USDTAmtInVault.sub(fees) : USDTAmtInVault
        USDCAmtInVault = USDCAmtInVault.gt(fees) ? USDCAmtInVault.sub(fees) : USDCAmtInVault
        BUSDAmtInVault = BUSDAmtInVault.gt(fees) ? BUSDAmtInVault.sub(fees) : BUSDAmtInVault
    }

    //swapTokenToWBNB
    let pool = await vault.getAllPoolInUSD()
    let percKeepInVault = await vault.percKeepInVault()
    let usdtKeepInVaultAmt = pool.mul(percKeepInVault[0]).div("10000")
    let usdcKeepInVaultAmt = pool.mul(percKeepInVault[1]).div("10000")
    let busdKeepInVaultAmt = pool.mul(percKeepInVault[2]).div("10000")

    let wbnbAmt = ethers.constants.Zero
    if (USDTAmtInVault.gt(usdtKeepInVaultAmt.add(ethers.constants.WeiPerEther))) {
        USDTAmtInVault = USDTAmtInVault.sub(usdtKeepInVaultAmt)
        let minBNB_USDT = (await pnckRouter.getAmountsOut(USDTAmtInVault, [USDTAddr, WBNBAddr]))[1] //export - 0
        minBNB_USDT = minBNB_USDT.mul("995").div("1000")
        wbnbAmt = wbnbAmt.add(minBNB_USDT)
    }

    if (USDCAmtInVault.gt(usdcKeepInVaultAmt.add(ethers.constants.WeiPerEther))) {
        USDCAmtInVault = USDCAmtInVault.sub(usdcKeepInVaultAmt)
        let minBNB_USDC = (await pnckRouter.getAmountsOut(USDCAmtInVault, [USDCAddr, WBNBAddr]))[1] //export - 1
        minBNB_USDC = minBNB_USDC.mul("995").div("1000")
        wbnbAmt = wbnbAmt.add(minBNB_USDC)
    }

    if (BUSDAmtInVault.gt(usdtKeepInVaultAmt.add(ethers.constants.WeiPerEther))) {
        BUSDAmtInVault = BUSDAmtInVault.sub(busdKeepInVaultAmt)
        let minBNB_BUSD = (await pnckRouter.getAmountsOut(BUSDAmtInVault, [BUSDAddr, WBNBAddr]))[1] //export - 2
        minBNB_BUSD = minBNB_BUSD.mul("995").div("1000")
        wbnbAmt = wbnbAmt.add(minBNB_BUSD)
    }

    wbnbAmt = wbnbAmt.add(await WBNBContract.balanceOf(strategyAddr))

    let AllPools = await strategy.getEachPool()
    let pools = AllPools[0].add(AllPools[1]).add(AllPools[2]).add(AllPools[3]).add(wbnbAmt)
    let targetPool = pools.mul("2500").div("10000")

    let minAmtBUSD_BNB
    let minAmtalpaca_BNB

    let minAmtxvs_BNB
    let minAmtbelt_BNB

    let minAmtchess_BNB
    let minAmtusdc_BNB

    if (targetPool.gt(AllPools[0]) && targetPool.gt(AllPools[1]) && targetPool.gt(AllPools[2]) && targetPool.gt(AllPools[3])) {
        let busdAlpaca_amt = targetPool.sub(AllPools[0])
        let bnbXVS_amt = targetPool.sub(AllPools[1])
        let bnbBelt_amt = targetPool.sub(AllPools[2])
        let chessusdc_amt = targetPool.sub(AllPools[3])

        minAmtBUSD_BNB = (await pnckRouter.getAmountsOut(busdAlpaca_amt.div(2), [WBNBAddr, BUSDAddr]))[1] //export -3
        minAmtalpaca_BNB = (await pnckRouter.getAmountsOut(busdAlpaca_amt.div(2), [WBNBAddr, ALPACAAddr]))[1] //export - 4

        minAmtxvs_BNB = (await pnckRouter.getAmountsOut(bnbXVS_amt.div(2), [WBNBAddr, XVSAddr]))[1] //export - 5
        minAmtbelt_BNB = (await pnckRouter.getAmountsOut(bnbBelt_amt.div(2), [WBNBAddr, BELTAddr]))[1] //export - 6

        minAmtchess_BNB = (await pnckRouter.getAmountsOut(chessusdc_amt.div(2), [WBNBAddr, CHESSAddr]))[1] //export - 6
        minAmtusdc_BNB = (await pnckRouter.getAmountsOut(chessusdc_amt.div(2), [WBNBAddr, USDCAddr]))[1] //export - 8   
    } else {

        minAmtBUSD_BNB = (await pnckRouter.getAmountsOut(wbnbAmt.div(2), [WBNBAddr, BUSDAddr]))[1] //export -3
        minAmtalpaca_BNB = (await pnckRouter.getAmountsOut(wbnbAmt.div(2), [WBNBAddr, ALPACAAddr]))[1] //export - 4

        minAmtxvs_BNB = (await pnckRouter.getAmountsOut(wbnbAmt.div(2), [WBNBAddr, XVSAddr]))[1] //export - 5
        minAmtbelt_BNB = (await pnckRouter.getAmountsOut(wbnbAmt.div(2), [WBNBAddr, BELTAddr]))[1] //export - 6

        minAmtchess_BNB = (await pnckRouter.getAmountsOut(wbnbAmt.div(2), [WBNBAddr, CHESSAddr]))[1] //export - 6
        minAmtusdc_BNB = (await pnckRouter.getAmountsOut(wbnbAmt.div(2), [WBNBAddr, USDCAddr]))[1] //export - 8  

    }
    let minAmounts = [minBNB_USDT, minBNB_USDC, minBNB_BUSD, minAmtBUSD_BNB, minAmtalpaca_BNB, minAmtxvs_BNB, minAmtbelt_BNB, minAmtchess_BNB,
        minAmtusdc_BNB]

    await vault.invest(minAmounts)
}

invest().then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });