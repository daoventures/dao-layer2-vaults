// require('dotenv').config()
const { ethers } = require("hardhat")
const axios = require("axios")


const beltAddress = "0xE0e514c71282b6f4e823703a39374Cf58dc3eA4f"
const chessAddress = "0x20de22029ab63cf9A7Cf5fEB2b737Ca1eE4c82A6"
const alpacaAddress = "0x8F0528cE5eF7B51152A59745bEfDD91D97091d2F"
const xvsAddress = "0xcF6BB5389c92Bdda8a3747Ddb454cB7a64626C63"
const busdAddr = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
const wbnbAddr = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
const usdcAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"

const vaultAddress = "0x5E5d75c2d1eEC055e8c824c6C4763b59d5c7f065"

const getPrice = async () => {
    try {
        let { data: pricesRaw } = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=alpaca-finance%2Cvenus%2Cbinancecoin%2Cbelt%2Ctranchess%2Cusd-coin&vs_currencies=usd")

        /*         return {
                    eth: ethers.utils.parseUnits(String(pricesRaw.ethereum.usd), "18"),
                    btc: ethers.utils.parseUnits(String(pricesRaw.bitcoin.usd), "18"),
                    cake: ethers.utils.parseUnits(String(pricesRaw["pancakeswap-token"].usd), "18"),
                    bnb: ethers.utils.parseUnits(String(pricesRaw.binancecoin.usd), "18"),
                    // usd: 1 / pricesRaw.binancecoin.usd,
                }
         */

        return {
            belt: pricesRaw.binancecoin.usd / pricesRaw.belt.usd,
            chess: pricesRaw.binancecoin.usd / pricesRaw.tranchess.usd,
            alpaca: pricesRaw.binancecoin.usd / pricesRaw["alpaca-finance"].usd,
            xvs: pricesRaw.binancecoin.usd / pricesRaw.venus.usd,
            bnb: pricesRaw.binancecoin.usd,
            usdc: pricesRaw["usd-coin"].usd
        }
    } catch (error) {
        console.log(error)
    }
}

const getRouterPrice = async (deployer) => {
    // const router = new ethers.Contract(routerAddr, router_ABI)
    const router = new ethers.Contract("0x10ED43C718714eb63d5aA57B78B54704E256024E",
        ["function getAmountsOut(uint, address[] memory) external view returns (uint[] memory)"], deployer)
    const belt = (await router.getAmountsOut(ethers.utils.parseUnits("1", 18), [wbnbAddr, beltAddress]))[1]
    const chess = (await router.getAmountsOut(ethers.utils.parseUnits("1", 18), [wbnbAddr, chessAddress]))[1]
    const alpaca = (await router.getAmountsOut(ethers.utils.parseUnits("1", 18), [wbnbAddr, alpacaAddress]))[1]
    const xvs = (await router.getAmountsOut(ethers.utils.parseUnits("1", 18), [wbnbAddr, xvsAddress]))[1]
    const bnb = (await router.getAmountsOut(ethers.utils.parseUnits("1", 18), [wbnbAddr, busdAddr]))[1]
    const bnbusdc = (await router.getAmountsOut(ethers.utils.parseUnits("1", 18), [wbnbAddr, usdcAddress]))[1]

    return {
        belt, chess, alpaca, xvs, bnbusdc, bnb
    }

}

const comparePrices = (coingeckoPrice, routerPrice) => {
    let percent = coingeckoPrice * 0.95

    if (coingeckoPrice > routerPrice) {
        if ((coingeckoPrice - routerPrice) > percent) {
            throw { status: false, message: "insufficient liquidity" }
        } else {
            return { status: true }
        }
    } else {
        return { status: true }
    }
}

const main = async () => {
    const [deployer] = await ethers.getSigners()

    let { belt, chess, alpaca, xvs, bnb, usdc } = await getPrice()
    let {belt: beltRouterPrice, chess: chessRouterPrice, alpaca: alpacaRouterPrice, xvs: xvsRouterPrice, bnbusdc: bnbusdcRouterPrice, bnb: bnbRouterPrice} = await getRouterPrice(deployer)
    // let { eth: ethRouterPrice, btc: btcRouterPrice, cake: cakeRouterPrice, bnb: bnbRouterPrice } = await getRouterPrice(deployer)


    comparePrices(belt, ethers.utils.formatEther(beltRouterPrice))
    comparePrices(chess, ethers.utils.formatEther(chessRouterPrice))
    comparePrices(alpaca, ethers.utils.formatEther(alpacaRouterPrice))
    comparePrices(xvs, ethers.utils.formatEther(xvsRouterPrice))
    comparePrices(bnb, ethers.utils.formatEther(bnbRouterPrice))
    comparePrices(bnb, ethers.utils.formatEther(bnbusdcRouterPrice))

    let beltMin = beltRouterPrice.mul(ethers.BigNumber.from("95")).div(ethers.BigNumber.from("100"))
    let chessMin = chessRouterPrice.mul(ethers.BigNumber.from("95")).div(ethers.BigNumber.from("100"))
    let alpacaMin = alpacaRouterPrice.mul(ethers.BigNumber.from("95")).div(ethers.BigNumber.from("100"))
    let xvsMin = xvsRouterPrice.mul(ethers.BigNumber.from("95")).div(ethers.BigNumber.from("100"))

    // let ethMin = ethRouterPrice.mul(ethers.BigNumber.from("95")).div(ethers.BigNumber.from("100"))
    // let btcMin = btcRouterPrice.mul(ethers.BigNumber.from("95")).div(ethers.BigNumber.from("100"))
    // let cakeMin = cakeRouterPrice.mul(ethers.BigNumber.from("95")).div(ethers.BigNumber.from("100"))

    let bUsdMin = bnbRouterPrice.mul(ethers.BigNumber.from("99")).div(ethers.BigNumber.from("100"))

    let bnbMin = (ethers.utils.parseUnits("1", "36").div(bnbRouterPrice)).mul("95").div("100")
    let usdcMin = (ethers.utils.parseUnits("1", "36").div(bnbusdcRouterPrice)).mul("95").div("100")

    let minAmount = [bUsdMin, alpacaMin, xvsMin, beltMin, chessMin, usdcMin, bnbMin]

    let vault = new ethers.Contract(vaultAddress,
        ["function invest(uint[] calldata tokenPrice) external"], deployer)

    await vault.invest(minAmount)
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });