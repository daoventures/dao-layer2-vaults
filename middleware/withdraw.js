const ethers = require("ethers")
const IERC20_ABI = require("./IERC20_ABI.json")
const pair_ABI = require("./pair_ABI.json")
const router_ABI = require("./router_ABI.json")

const BUSDALPACA_l1_ABI = require('./L1Vault_ABI.json')
const BNBXVS_l1_ABI = require('./L1Vault_ABI.json')
const BNBBELT_l1_ABI = require('./L1Vault_ABI.json')
const CHESSUSDC_l1_ABI = require('./L1Vault_ABI.json')
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

const BUSDALPACAAddr = "0x7752e1FA9F3a2e860856458517008558DEb989e3"
const BNBXVSAddr = "0x7EB5D86FD78f3852a3e0e064f2842d45a3dB6EA2"
const BNBBELTAddr = "0xF3Bc6FC080ffCC30d93dF48BFA2aA14b869554bb"
const CHESSUSDCAddr = "0x1472976E0B97F5B2fC93f1FFF14e2b5C4447b64F"

const BUSDALPACAVaultAddr = ""
const BNBXVSVaultAddr = ""
const BNBBELTVaultAddr = ""
const CHESSUSDCVaultAddr = ""

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

        const BUSDALPACAVault = new ethers.Contract(BUSDALPACAVaultAddr, BUSDALPACA_l1_ABI, provider)
        const BUSDALPACAVaultAmt = (await BUSDALPACAVault.balanceOf(strategyAddr)).mul(sharePerc).div(oneEther)
        const BUSDALPACAAmt = (await BUSDALPACAVault.getAllPool()).mul(BUSDALPACAVaultAmt).div(await BUSDALPACAVault.totalSupply())
        const BUSDALPACA = new ethers.Contract(BUSDALPACAAddr, pair_ABI, provider)
        const [ALPACAReserve, BUSDReserve] = await BUSDALPACA.getReserves()
        const BUSDAmt = BUSDReserve.mul(BUSDALPACAAmt).div(await BUSDALPACA.totalSupply())
        const ALPACAAmt = ALPACAReserve.mul(BUSDALPACAAmt).div(await BUSDALPACA.totalSupply())
        _WBNBAmt = (await pnckRouter.getAmountsOut(BUSDAmt, [BUSDAddr, WBNBAddr]))[1]
        const _WBNBAmtMinBUSD = _WBNBAmt.mul(995).div(1000)
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)
        _WBNBAmt = (await pnckRouter.getAmountsOut(ALPACAAmt, [ALPACAAddr, WBNBAddr]))[1]
        const _WBNBAmtMinALPACA = _WBNBAmt.mul(995).div(1000)
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)

        const BNBXVSVault = new ethers.Contract(BNBXVSVaultAddr, BNBXVS_l1_ABI, provider)
        const BNBXVSVaultAmt = (await BNBXVSVault.balanceOf(strategyAddr)).mul(sharePerc).div(oneEther)
        const BNBXVSAmt = (await BNBXVSVault.getAllPool()).mul(BNBXVSVaultAmt).div(await BNBXVSVault.totalSupply())
        const BNBXVS = new ethers.Contract(BNBXVSAddr, pair_ABI, provider)
        const [WBNBReserve, XVSReserve] = await BNBXVS.getReserves() //TODO CHECK ORDER
        const XVSAmt = XVSReserve.mul(BNBXVSAmt).div(await BNBXVS.totalSupply())
        WBNBAmt = WBNBReserve.mul(BNBXVSAmt).div(await BNBXVS.totalSupply())
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)
        _WBNBAmt = (await pnckRouter.getAmountsOut(XVSAmt, [XVSAddr, WBNBAddr]))[1]
        const _WBNBAmtMinXVS_BNB = _WBNBAmt.mul(995).div(1000)
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)

        const BNBBELTVault = new ethers.Contract(BNBBELTVaultAddr, BNBBELT_l1_ABI, provider)
        const BNBBELTVaultAmt = (await BNBBELTVault.balanceOf(strategyAddr)).mul(sharePerc).div(oneEther)
        const BNBBELTAmt = (await BNBBELTVault.getAllPool()).mul(BNBBELTVaultAmt).div(await BNBBELTVault.totalSupply())
        const BNBBELT = new ethers.Contract(BNBBELTAddr, pair_ABI, provider)
        const [WBNBReserve, BELTReserve] = await BNBBELT.getReserves() //TODO CHECK ORDER
        const BELTAmt = BELTReserve.mul(BNBBELTAmt).div(await BNBBELT.totalSupply())
        WBNBAmt = WBNBReserve.mul(BNBBELTAmt).div(await BNBBELT.totalSupply())
        totalWithdrawWBNB = totalWithdrawWBNB.add(WBNBAmt)
        _WBNBAmt = (await pnckRouter.getAmountsOut(BELTAmt, [BELTAddr, WBNBAddr]))[1]
        const _WBNBAmtMinBELT_BNB = _WBNBAmt.mul(995).div(1000)
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)

        const CHESSUSDCVault = new ethers.Contract(CHESSUSDCVaultAddr, CHESSUSDC_l1_ABI, provider)
        const CHESSUSDCVaultAmt = (await CHESSUSDCVault.balanceOf(strategyAddr)).mul(sharePerc).div(oneEther)
        const CHESSUSDCAmt = (await CHESSUSDCVault.getAllPool()).mul(CHESSUSDCVaultAmt).div(await CHESSUSDCVault.totalSupply())
        const CHESSUSDC = new ethers.Contract(CHESSUSDCAddr, pair_ABI, provider)
        const [CHESSReserve, USDCReserve] = await CHESSUSDC.getReserves()//TODO CHECK ORDER
        const CHESSAmt = CHESSReserve.mul(CHESSUSDCAmt).div(await CHESSUSDC.totalSupply())
        const USDCAmt = USDCReserve.mul(CHESSUSDCAmt).div(await CHESSUSDC.totalSupply())
        _WBNBAmt = (await pnckRouter.getAmountsOut(CHESSAmt, [CHESSAddr, WBNBAddr]))[1]
        const _WBNBAmtMinCHESS_USDC = _WBNBAmt.mul(995).div(1000)
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)
        _WBNBAmt = (await pnckRouter.getAmountsOut(USDCAmt, [USDCAddr, WBNBAddr]))[1]
        const _WBNBAmtMinUSDC = _WBNBAmt.mul(995).div(1000)
        totalWithdrawWBNB = totalWithdrawWBNB.add(_WBNBAmt)

        totalWithdrawWBNB = totalWithdrawWBNB.sub(WBNBAmtBefore)

        const withdrawAmtInStablecoin = (await pnckRouter.getAmountsOut(totalWithdrawWBNB, [WBNBAddr, stableCoinAddr]))[1]
        const withdrawAmtInStablecoinMin = withdrawAmtInStablecoin.mul(995).div(1000)
        
        amountsOutMin = [
            withdrawAmtInStablecoinMin,
            _WBNBAmtMinBUSD,
            _WBNBAmtMinALPACA,
            _WBNBAmtMinXVS_BNB,
            _WBNBAmtMinBELT_BNB,
            _WBNBAmtMinCHESS_USDC,
            _WBNBAmtMinUSDC,
        ]

    } else {
        amountsOutMin = []
    }

    return amountsOutMin

}

module.exports = {
    getAmountsOutMin
}