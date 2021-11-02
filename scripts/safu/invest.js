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
const BTCBAddr = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c"
const WETHAddr = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"
const CAKEAddr = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"

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
    let BTCBETHTargetPool = pools.mul("5000").div("10000")
    let BTCBBNBTargetPool = pools.mul("2000").div("10000");
    let CAKEBNBTargetPool = pools.mul("2000").div("10000");
    let BTCBBUSDTargetPool = pools.mul("1000").div("10000")

    let minAmtBTCB_BNB
    let minAmtETH_BNB

    let minAmtbtcb_BNB
    let minAmtCAKE_BNB

    let minAmtbtc_BNB
    let minAmtbusd_BNB

    if (BTCBETHTargetPool.gt(AllPools[0]) && BTCBBNBTargetPool.gt(AllPools[1]) && CAKEBNBTargetPool.gt(AllPools[2]) && BTCBBUSDTargetPool.gt(AllPools[3])) {
        let btcbEth_amt = BTCBETHTargetPool.sub(AllPools[0])
        let btcbBnb_amt = BTCBBNBTargetPool.sub(AllPools[1])
        let cakeBnb_amt = CAKEBNBTargetPool.sub(AllPools[2])
        let btcbbusd_amt = BTCBBUSDTargetPool.sub(AllPools[3])

        minAmtBTCB_BNB = (await pnckRouter.getAmountsOut(btcbEth_amt.div(2), [WBNBAddr, BTCBAddr]))[1] //export -3
        minAmtETH_BNB = (await pnckRouter.getAmountsOut(btcbEth_amt.div(2), [WBNBAddr, WETHAddr]))[1] //export - 4

        minAmtbtcb_BNB = (await pnckRouter.getAmountsOut(btcbbusd_amt.div(2), [WBNBAddr, BTCBAddr]))[1] //export - 5  
        minAmtCAKE_BNB = (await pnckRouter.getAmountsOut(btcbBnb_amt.div(2), [WBNBAddr, CAKEAddr]))[1] //export - 6
        
        minAmtbtc_BNB = (await pnckRouter.getAmountsOut(cakeBnb_amt.div(2), [WBNBAddr, BTCBAddr]))[1] //export - 7
        minAmtbusd_BNB = (await pnckRouter.getAmountsOut(btcbbusd_amt.div(2), [WBNBAddr, BUSDAddr]))[1] //export - 8
        
    } else {

        minAmtBTCB_BNB = (await pnckRouter.getAmountsOut(wbnbAmt.div(2), [WBNBAddr, BTCBAddr]))[1] //export -3
        minAmtETH_BNB = (await pnckRouter.getAmountsOut(wbnbAmt.div(2), [WBNBAddr, WETHAddr]))[1] //export - 4

        minAmtbtcb_BNB = (await pnckRouter.getAmountsOut(wbnbAmt.div(2), [WBNBAddr, BTCBAddr]))[1] //export - 5  
        minAmtCAKE_BNB = (await pnckRouter.getAmountsOut(wbnbAmt.div(2), [WBNBAddr, CAKEAddr]))[1] //export - 6
        
        minAmtbtc_BNB = (await pnckRouter.getAmountsOut(wbnbAmt.div(2), [WBNBAddr, BTCBAddr]))[1] //export - 7
        minAmtbusd_BNB = (await pnckRouter.getAmountsOut(wbnbAmt.div(2), [WBNBAddr, BUSDAddr]))[1] //export - 8
        

    }
    let minAmounts = [minBNB_USDT, minBNB_USDC, minBNB_BUSD, minAmtBTCB_BNB, minAmtETH_BNB, minAmtbtcb_BNB, minAmtCAKE_BNB, minAmtbtc_BNB, 
        minAmtbusd_BNB]

    await vault.invest(minAmounts)
}

invest().then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });