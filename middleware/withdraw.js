const ethers = require("ethers")
const IERC20_ABI = require("./IERC20_ABI.json")
const pair_ABI = require("./pair_ABI.json")
const router_ABI = require("./router_ABI.json")

const BTCBWETH_l1_ABI = require('./L1Vault_ABI.json')
const BTCBBNB_l1_ABI = require('./L1Vault_ABI.json')
const CAKEBNB_l1_ABI = require('./L1Vault_ABI.json')
const BTCBBUSD_l1_ABI = require('./L1Vault_ABI.json')
const VaultABI = require("./L2Vault_ABI.json")
const StrategyABI = require("./L2_strategy_ABI.json")

const USDTAddr = "0xc7198437980c041c805A1EDcbA50c1Ce5db95118"
const USDCAddr = "0xA7D7079b0FEaD91F3e65f86E8915Cb59c1a4C664"
const BUSDAddr = "0xd586E7F844cEa2F87f50152665BCbc2C279D8d70"
const WBNBAddr = "0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7"
const BTCBAddr = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c"
const WETHAddr = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"
const CAKEAddr = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"

const pnckRouterAddr = "0x10ED43C718714eb63d5aA57B78B54704E256024E"

const BTCBWETHAddr = "0xD171B26E4484402de70e3Ea256bE5A2630d7e88D"
const BTCBBNBAddr = "0x61EB789d75A95CAa3fF50ed7E47b96c132fEc082"
const CAKEBNBAddr = "0x0eD7e52944161450477ee417DE9Cd3a859b14fD0"
const BTCBBUSDAddr = "0xF45cd219aEF8618A92BAa7aD848364a158a24F33"

const BTCBWETHVaultAddr = ""
const BTCBBNBVaultAddr = ""
const CAKEBNBVaultAddr = ""
const BTCBBUSDVaultAddr = ""

const VaultAddr = ""
const strategyAddr = ""

const getAmountsOutMin = async(shareToWithdraw, stableCoinAddr, provider) => {
    if (!ethers.BigNumber.isBigNumber(shareToWithdraw)) shareToWithdraw = new ethers.BigNumber.from(shareToWithdraw)

    const vault = new ethers.Contract(VaultAddr, VaultABI, provider)
    const strategy = new ethers.Contract(strategyAddr, StrategyABI, provider)
    const pnckRouter = new ethers.Contract(pnckRouterAddr, router_ABI, provider)

    const amtWithdrawInUSD = (
        (await vault.getAllPoolInUSD())
            .sub(await vault.totalPendingDepositAmt()))
            .mul(shareToWithdraw)
            .div(await vault.totalSupply()
    )

    const USDTContract = new ethers.Contract(USDTAddr, IERC20_ABI, provider)
    const USDCContract = new ethers.Contract(USDCAddr, IERC20_ABI, provider)
    const BUSDContract = new ethers.Contract(BUSDAddr, IERC20_ABI, provider)
    const USDTAmtInVault = (await USDTContract.balanceOf(vault.address))
    const USDCAmtInVault = (await USDCContract.balanceOf(vault.address))
    const BUSDAmtInVault = await BUSDContract.balanceOf(vault.address)
    const totalAmtInVault = USDTAmtInVault.add(USDCAmtInVault).add(BUSDAmtInVault).sub(await vault.fees())

    let amountsOutMin
    if (amtWithdrawInUSD.gt(totalAmtInVault)) {
        const oneEther = ethers.utils.parseEther("1")

        let stablecoinAmtInVault
        if (stablecoinAddr == USDTAddr) stablecoinAmtInVault = USDTAmtInVault
        else if (stablecoinAddr == USDCAddr) stablecoinAmtInVault = USDCAmtInVault
        else stablecoinAmtInVault = BUSDAmtInVault
        const amtToWithdrawFromStrategy = amtWithdrawInUSD.sub(stablecoinAmtInVault)
        const strategyAllPoolInUSD = await strategy.getAllPoolInUSD()
        const sharePerc = amtToWithdrawFromStrategy.mul(oneEther).div(strategyAllPoolInUSD)

        const WBNBContract = new ethers.Contract(WBNBAddr, IERC20_ABI, provider)
        const WBNBAmtBefore = await WBNBContract.balanceOf(strategyAddr)
        let totalWithdrawWBNB = WBNBAmtBefore
        let WBNBAmt, _WBNBAmt

        const BTCBWETHVault = new ethers.Contract(BTCBWETHVaultAddr, BTCBWETH_l1_ABI, provider)
        const BTCBWETHVaultAmt = (await BTCBWETHVault.balanceOf(strategyAddr)).mul(sharePerc).div(oneEther)
        const BTCBWETHAmt = (await BTCBWETHVault.getAllPool()).mul(BTCBWETHVaultAmt).div(await BTCBWETHVault.totalSupply())
        const BTCBWETH = new ethers.Contract(BTCBWETHAddr, pair_ABI, provider)
        const [WETHReserve, BTCBReserve] = await BTCBWETH.getReserves()
        const BTCBAmt = BTCBReserve.mul(BTCBWETHAmt).div(await BTCBWETH.totalSupply())
        const WETHAmt = WETHReserve.mul(BTCBWETHAmt).div(await BTCBWETH.totalSupply())
        _WBNBAmt = (await pnckRouter.getAmountsOut(BTCBAmt, [BTCBAddr, WBNBAddr]))[1]
        const _WBNBAmtMinBTCB = _WBNBAmt.mul(995).div(1000)
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)
        _WBNBAmt = (await pnckRouter.getAmountsOut(WETHAmt, [WETHAddr, WBNBAddr]))[1]
        const _WBNBAmtMinWETH = _WBNBAmt.mul(995).div(1000)
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)

        const BTCBBNBVault = new ethers.Contract(BTCBBNBVaultAddr, BTCBBNB_l1_ABI, provider)
        const BTCBBNBVaultAmt = (await BTCBBNBVault.balanceOf(strategyAddr)).mul(sharePerc).div(oneEther)
        const BTCBBNBAmt = (await BTCBBNBVault.getAllPool()).mul(BTCBBNBVaultAmt).div(await BTCBBNBVault.totalSupply())
        const BTCBBNB = new ethers.Contract(BTCBBNBAddr, pair_ABI, provider)
        const [BTCBReserve, WBNBReserve] = await BTCBBNB.getReserves() 
        const BTCBAmt = BTCBReserve.mul(BTCBBNBAmt).div(await BTCBBNB.totalSupply())
        WBNBAmt = WBNBReserve.mul(BTCBBNBAmt).div(await BTCBBNB.totalSupply())
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)
        _WBNBAmt = (await pnckRouter.getAmountsOut(BTCBAmt, [BTCBAddr, WBNBAddr]))[1]
        const _WBNBAmtMinBTCB_WETH = _WBNBAmt.mul(995).div(1000)
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)

        const CAKEBNBVault = new ethers.Contract(CAKEBNBVaultAddr, CAKEBNB_l1_ABI, provider)
        const CAKEBNBVaultAmt = (await CAKEBNBVault.balanceOf(strategyAddr)).mul(sharePerc).div(oneEther)
        const CAKEBNBAmt = (await CAKEBNBVault.getAllPool()).mul(CAKEBNBVaultAmt).div(await CAKEBNBVault.totalSupply())
        const CAKEBNB = new ethers.Contract(CAKEBNBAddr, pair_ABI, provider)
        const [CAKEReserve, WBNBReserve] = await CAKEBNB.getReserves() 
        const CAKEAmt = CAKEReserve.mul(CAKEBNBAmt).div(await CAKEBNB.totalSupply())
        WBNBAmt = WBNBReserve.mul(CAKEBNBAmt).div(await CAKEBNB.totalSupply())
        totalWithdrawWBNB = totalWithdrawWBNB.add(WBNBAmt)
        _WBNBAmt = (await pnckRouter.getAmountsOut(CAKEAmt, [CAKEAddr, WBNBAddr]))[1]
        const _WBNBAmtMinCAKE_BNB = _WBNBAmt.mul(995).div(1000)
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)

        const BTCBBUSDVault = new ethers.Contract(BTCBBUSDVaultAddr, BTCBBUSD_l1_ABI, provider)
        const BTCBBUSDVaultAmt = (await BTCBBUSDVault.balanceOf(strategyAddr)).mul(sharePerc).div(oneEther)
        const BTCBBUSDAmt = (await BTCBBUSDVault.getAllPool()).mul(BTCBBUSDVaultAmt).div(await BTCBBUSDVault.totalSupply())
        const BTCBBUSD = new ethers.Contract(BTCBBUSDAddr, pair_ABI, provider)
        const [BTCBReserve, BUSDReserve] = await BTCBBUSD.getReserves() 
        const BTCBAmt = BTCBReserve.mul(BTCBBUSDAmt).div(await BTCBBUSD.totalSupply())
        const BUSDAmt = BUSDReserve.mul(BTCBBUSDAmt).div(await BTCBBUSD.totalSupply())
        _WBNBAmt = (await pnckRouter.getAmountsOut(BTCBAmt, [BTCBAddr, WBNBAddr]))[1]
        const _WBNBAmtMinBTCB_BUSD = _WBNBAmt.mul(995).div(1000)
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)
        _WBNBAmt = (await pnckRouter.getAmountsOut(BUSDAmt, [BUSDAddr, WBNBAddr]))[1]
        const _WBNBAmtMinBUSD = _WBNBAmt.mul(995).div(1000)
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)

        totalWithdrawWBNB = totalWithdrawWBNB.sub(WBNBAmtBefore)

        const withdrawAmtInStablecoin = (await pnckRouter.getAmountsOut(totalWithdrawWBNB, [WBNBAddr, stableCoinAddr]))[1]
        const withdrawAmtInStablecoinMin = withdrawAmtInStablecoin.mul(995).div(1000)

        amountsOutMin = [
            withdrawAmtInStablecoinMin,
            _WBNBAmtMinBTCB,
            _WBNBAmtMinWETH,
            _WBNBAmtMinBTCB_WETH,
            _WBNBAmtMinCAKE_BNB,
            _WBNBAmtMinBTCB_BUSD,
            _WBNBAmtMinBUSD,
        ]

    } else {
        amountsOutMin = []
    }

    return amountsOutMin

}

module.exports = {
    getAmountsOutMin
}
