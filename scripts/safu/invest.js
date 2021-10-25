// require('dotenv').config()
const { ethers } = require("hardhat")
const axios = require("axios")


const wethAddr = "0x2170Ed0880ac9A755fd29B2688956BD959F933F8"
const btcbAddr = "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c"
const cakeAddr = "0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82"
const busdAddr = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
const wbnbAddr = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"

const vaultAddress = "0xB9E35635084B8B198f4bF4EE787D5949b46338f1"

const getPrice = async () => {
    try {
        let { data: pricesRaw } = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids=ethereum%2Cbitcoin%2Cpancakeswap-token%2Cbinancecoin&vs_currencies=usd")

        /*         return {
                    eth: ethers.utils.parseUnits(String(pricesRaw.ethereum.usd), "18"),
                    btc: ethers.utils.parseUnits(String(pricesRaw.bitcoin.usd), "18"),
                    cake: ethers.utils.parseUnits(String(pricesRaw["pancakeswap-token"].usd), "18"),
                    bnb: ethers.utils.parseUnits(String(pricesRaw.binancecoin.usd), "18"),
                    // usd: 1 / pricesRaw.binancecoin.usd,
                }
         */

        return {
            eth: pricesRaw.binancecoin.usd / pricesRaw.ethereum.usd,
            btc: pricesRaw.binancecoin.usd / pricesRaw.bitcoin.usd,
            cake: pricesRaw.binancecoin.usd / pricesRaw["pancakeswap-token"].usd,
            bnb: pricesRaw.binancecoin.usd
        }
    } catch (error) {
        console.log(error)
    }
}

const getRouterPrice = async (deployer) => {
    // const router = new ethers.Contract(routerAddr, router_ABI)
    const router = new ethers.Contract("0x10ED43C718714eb63d5aA57B78B54704E256024E",
        ["function getAmountsOut(uint, address[] memory) external view returns (uint[] memory)"], deployer)
    const eth = (await router.getAmountsOut(ethers.utils.parseUnits("1", 18), [wbnbAddr, wethAddr]))[1]
    const btc = (await router.getAmountsOut(ethers.utils.parseUnits("1", 18), [wbnbAddr, btcbAddr]))[1]
    const cake = (await router.getAmountsOut(ethers.utils.parseUnits("1", 18), [wbnbAddr, cakeAddr]))[1]
    const bnb = (await router.getAmountsOut(ethers.utils.parseUnits("1", 18), [wbnbAddr, busdAddr]))[1]

    return {
        eth, btc, cake, bnb
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

    let { eth, btc, cake, bnb } = await getPrice()
    let { eth: ethRouterPrice, btc: btcRouterPrice, cake: cakeRouterPrice, bnb: bnbRouterPrice } = await getRouterPrice(deployer)


    comparePrices(eth, ethers.utils.formatEther(ethRouterPrice))
    comparePrices(btc, ethers.utils.formatEther(btcRouterPrice))
    comparePrices(cake, ethers.utils.formatEther(cakeRouterPrice))
    comparePrices(bnb, ethers.utils.formatEther(bnbRouterPrice))

    let ethMin = ethRouterPrice.mul(ethers.BigNumber.from("95")).div(ethers.BigNumber.from("100"))
    let btcMin = btcRouterPrice.mul(ethers.BigNumber.from("95")).div(ethers.BigNumber.from("100"))
    let cakeMin = cakeRouterPrice.mul(ethers.BigNumber.from("95")).div(ethers.BigNumber.from("100"))

    let bUsdMin = bnbRouterPrice.mul(ethers.BigNumber.from("99")).div(ethers.BigNumber.from("100"))
    
    let bnbMin = (ethers.utils.parseUnits("1", "36") .div( bnbRouterPrice)).mul("95").div("100")

    let minAmount = [btcMin, ethMin, cakeMin, bUsdMin, bnbMin]

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