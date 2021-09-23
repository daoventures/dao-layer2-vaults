const { ethers } = require("hardhat")
const IERC20_ABI = require("../abis/IERC20_ABI.json")

async function main() {
    const [deployer] = await ethers.getSigners()

    const chainLinkBTC = new ethers.Contract(
        "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c",
        ["function latestAnswer() external view returns (int)"],
        deployer
    )
    console.log((await chainLinkBTC.latestAnswer()).toString())
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error)
        process.exit(1)
    })
