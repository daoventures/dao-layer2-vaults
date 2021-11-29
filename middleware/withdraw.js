const ethers = require("ethers")
const sushi_ABI = require("../abis/sushi_ABI.json")
const ILVETH_ABI = require("../abis/ILVETH_ABI.json")
const pair_ABI = require("../abis/pair_ABI.json")
const mvfVault_ABI = require("../abis/mvfVault_ABI.json")
const mvfStrategy_ABI = require("../abis/mvfStrategy_ABI.json")

const mvfVaultAddr = ""
const mvfStrategyAddr = ""
const AXSETHVaultAddr = "0xcE097910Fc2DB329683353dcebF881A48cbA181e"
const ILVETHVaultAddr = "0x42Dd4b36eAD524f88cBf7f7702bAe3234d8eA46e"
const MANAETHVaultAddr = ""
const USDTAddr = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const USDCAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAIAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const WETHAddr = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const AXSAddr = "0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b"
const MANAAddr = "0x0F5D2fB29fb7d3CFeE444a200298f468908cC942"
const ILVAddr = "0x767FE9EDC9E0dF98E07454847909b5E959D7ca0E"
const AXSETHAddr = "0x0C365789DbBb94A29F8720dc465554c587e897dB"
const ILVETHAddr = "0x6a091a3406E0073C3CD6340122143009aDac0EDa"
const ilvEthPoolAddr = "0x8B4d8443a0229349A9892D4F7CbE89eF5f843F72"
const MANAETHAddr = "0x1bEC4db6c3Bc499F3DbF289F5499C30d541FEc97"
const WILDAddr = "0x2a3bFF78B79A009976EeA096a51A948a3dC00e34"
const MVIAddr = "0x72e364F2ABdC788b7E918bc238B21f109Cd634D7"

const getAmountsOutMin = async (amountWithdrawInLP, stablecoinAddr, _provider) => {
    const provider = new ethers.providers.Web3Provider(_provider)
    const mvfVault = new ethers.Contract(mvfVaultAddr, mvfVault_ABI, provider)
    const mvfStrategy = new ethers.Contract(mvfStrategyAddr, mvfStrategy_ABI, provider)
    const sRouter = new ethers.Contract(sRouterAddr, router_ABI, provider)
    const uRouter = new ethers.Contract(uniRouterAddr, router_ABI, provider)
    
    const share = new ethers.BigNumber.from(amountWithdrawInLP)
    const allPoolInUSD = await mvfVault["getAllPoolInUSD(bool)"](false)
    const amtWithdrawInUSD = (allPoolInUSD.sub(await mvfVault.totalPendingDepositAmt())).mul(share).div(await mvfVault.totalSupply())
    
    const USDTContract = new ethers.Contract(USDTAddr, IERC20_ABI, provider)
    const USDCContract = new ethers.Contract(USDCAddr, IERC20_ABI, provider)
    const DAIContract = new ethers.Contract(DAIAddr, IERC20_ABI, provider)

    const USDTAmtInVault = (await USDTContract.balanceOf(mvfVault.address)).mul(ethers.utils.parseUnits("1", 12))
    const USDCAmtInVault = (await USDCContract.balanceOf(mvfVault.address)).mul(ethers.utils.parseUnits("1", 12))
    const DAIAmtInVault = await DAIContract.balanceOf(mvfVault.address)
    const totalAmtInVault = (USDTAmtInVault).add(USDCAmtInVault).add(DAIAmtInVault).sub(await mvfVault.fees())

    let amountsOutMin
    if (amtWithdrawInUSD.gt(totalAmtInVault)) {
        const oneEther = ethers.utils.parseEther("1")

        let stablecoinAmtInVault
        if (stablecoinAddr == USDTAddr) stablecoinAmtInVault = USDTAmtInVault
        else if (stablecoinAddr == USDCAddr) stablecoinAmtInVault = USDCAmtInVault
        else stablecoinAmtInVault = DAIAmtInVault
        const amtToWithdrawFromStrategy = amtWithdrawInUSD.sub(stablecoinAmtInVault)
        // Strategy contract
        const strategyAllPoolInUSD = await mvfStrategy.getAllPoolInUSD(false)
        const sharePerc = amtToWithdrawFromStrategy.mul(oneEther).div(strategyAllPoolInUSD)

        let totalWithdrawWETH = ethers.constants.Zero
        let WETHAmt, _WETHAmt

        const AXSETHVault = new ethers.Contract(AXSETHVaultAddr, sushi_ABI, provider)
        const AXSETHVaultAmt = (await AXSETHVault.balanceOf(mvfStrategy.address)).mul(sharePerc).div(oneEther) // Calculate AXSETHVault LP
        const AXSETHAmt = (await AXSETHVault.getAllPool()).mul(AXSETHVaultAmt).div(await AXSETHVault.totalSupply()) // L1 contract
        const AXSETH = new ethers.Contract(AXSETHAddr, pair_ABI, provider)
        const [AXSReserve, WETHReserveAXS] = await AXSETH.getReserves()
        const AXSAmt = AXSReserve.mul(AXSETHAmt).div(await AXSETH.totalSupply())
        WETHAmt = WETHReserveAXS.mul(AXSETHAmt).div(await AXSETH.totalSupply())
        totalWithdrawWETH = totalWithdrawWETH.add(WETHAmt)
        _WETHAmt = (await sRouter.getAmountsOut(AXSAmt, [AXSAddr, WETHAddr]))[1]
        const _WETHAmtMinAXS = _WETHAmt.mul(995).div(1000)
        totalWithdrawWETH = totalWithdrawWETH.add(_WETHAmt)

        const ILVETHVault = new ethers.Contract(ILVETHVaultAddr, ILVETH_ABI, provider)
        const ILVETHVaultAmt = (await ILVETHVault.balanceOf(mvfStrategy.address)).mul(sharePerc).div(oneEther)
        const ILVETH = new ethers.Contract(ILVETHAddr, pair_ABI, provider)
        const ILVETHPool = new ethers.Contract(ilvEthPoolAddr, IERC20_ABI, provider)
        const ILVETHAmt = ((await ILVETH.balanceOf(ILVETHVaultAddr)).add(await ILVETHPool.balanceOf(ILVETHVaultAddr))).mul(ILVETHVaultAmt).div(await ILVETHVault.totalSupply())
        const [ILVReserve, WETHReserveILV] = await ILVETH.getReserves()
        const ILVAmt = ILVReserve.mul(ILVETHAmt).div(await ILVETH.totalSupply())
        WETHAmt = WETHReserveILV.mul(ILVETHAmt).div(await ILVETH.totalSupply())
        totalWithdrawWETH = totalWithdrawWETH.add(WETHAmt)
        _WETHAmt = (await sRouter.getAmountsOut(ILVAmt, [ILVAddr, WETHAddr]))[1]
        const _WETHAmtMinILV = _WETHAmt.mul(995).div(1000)
        totalWithdrawWETH = totalWithdrawWETH.add(_WETHAmt)

        const MANAETHVault = new ethers.Contract(MANAETHVaultAddr, sushi_ABI, provider)
        const MANAETHVaultAmt = (await MANAETHVault.balanceOf(mvfStrategy.address)).mul(sharePerc).div(oneEther)
        const MANAETHAmt = (await MANAETHVault.getAllPool()).mul(MANAETHVaultAmt).div(await MANAETHVault.totalSupply())
        const MANAETH = new ethers.Contract(MANAETHAddr, pair_ABI, provider)
        const [MANAReserve, WETHReserveMANA] = await MANAETH.getReserves()
        const MANAAmt = MANAReserve.mul(MANAETHAmt).div(await MANAETH.totalSupply())
        WETHAmt = WETHReserveMANA.mul(MANAETHAmt).div(await MANAETH.totalSupply())
        totalWithdrawWETH = totalWithdrawWETH.add(WETHAmt)
        _WETHAmt = (await sRouter.getAmountsOut(MANAAmt, [MANAAddr, WETHAddr]))[1]
        const _WETHAmtMinMANA = _WETHAmt.mul(995).div(1000)
        totalWithdrawWETH = totalWithdrawWETH.add(_WETHAmt)

        const WILD = new ethers.Contract(WILDAddr, IERC20_ABI, provider)
        const WILDAmt = (await WILD.balanceOf(mvfStrategy.address)).mul(sharePerc).div(oneEther)
        _WETHAmt = (await uRouter.getAmountsOut(WILDAmt, [WILDAddr, WETHAddr]))[1]
        const _WETHAmtMinWILD = _WETHAmt.mul(995).div(1000)
        totalWithdrawWETH = totalWithdrawWETH.add(_WETHAmt)

        const MVI = new ethers.Contract(MVIAddr, IERC20_ABI, provider)
        const MVIAmt = (await MVI.balanceOf(mvfStrategy.address)).mul(sharePerc).div(oneEther)
        _WETHAmt = (await uRouter.getAmountsOut(MVIAmt, [MVIAddr, WETHAddr]))[1]
        const _WETHAmtMinMVI = _WETHAmt.mul(995).div(1000)
        totalWithdrawWETH = totalWithdrawWETH.add(_WETHAmt)

        const withdrawAmtInStablecoin = (await sRouter.getAmountsOut(totalWithdrawWETH, [WETHAddr, stablecoinAddr]))[1]
        const withdrawAmtInStablecoinMin = withdrawAmtInStablecoin.mul(995).div(1000)

        // console.log(_WETHAmtMinAXS.toString())
        // console.log(_WETHAmtMinILV.toString())
        // console.log(_WETHAmtMinMANA.toString())
        // console.log(_WETHAmtMinWILD.toString())
        // console.log(_WETHAmtMinMVI.toString())
        // console.log(withdrawAmtInStablecoinMin.toString())
        
        amountsOutMin = [
            withdrawAmtInStablecoinMin,
            _WETHAmtMinAXS,
            _WETHAmtMinILV,
            _WETHAmtMinMANA,
            _WETHAmtMinWILD,
            _WETHAmtMinMVI
        ]

    } else {
        amountsOutMin = []
    }

    return amountsOutMin
}

module.exports = {
    getAmountsOutMin
}