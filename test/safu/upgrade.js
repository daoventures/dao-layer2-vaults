const { expect } = require("chai")
const { ethers, deployments, network, artifacts } = require('hardhat')
const { mainnet: addresses } = require('../../addresses/citadelBSC')
const { mainnet: network_ } = require("../../addresses/bsc");
const IERC20_ABI = require("../../abis/IERC20_ABI.json")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")

const unlockedAddress = "0x8894e0a0c962cb723c1976a4421c95949be2d4e3"
const unlockedAddress2 = "0x8894e0a0c962cb723c1976a4421c95949be2d4e3"

const userAddress = "0xb41e620f88c54d91d8945c91cc31bd467c012696"
const adminAddress = "0x3f68a3c1023d736d8be867ca49cb18c543373b99"

const BUSDAddress = "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
const USDCAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
const USDTAddress = "0x55d398326f99059fF775485246999027B3197955"

const safuVaultProxy = "0xB9E35635084B8B198f4bF4EE787D5949b46338f1"


const upgrade = async () => {
    // const DaoSafuVault = await ethers.getContractFactory("DaoSafuVault")
    // const daoSafuVault = await DaoSafuVault.deploy()


    // console.log("New implementation contract for DaoSafuVault:", daoSafuVault.address)

    // const proxyAdmin = new ethers.Contract(proxyAdminAddr, [
    //     "function upgrade(address, address) external"
    //     // "function upgradeAndCall(address proxy, address implementation, bytes memory data) public payable"
    // ], deployer)

    // await proxyAdmin.upgrade(safuVaultProxy, daoSafuVault.address)
}

const setup = async () => {
    const [faucet] = await ethers.getSigners()

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [unlockedAddress]
    })

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [userAddress]
    })

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [adminAddress]
    })

    let admin = await ethers.getSigner(adminAddress)
    let user = await ethers.getSigner(userAddress)
    let unlockedUser = await ethers.getSigner(unlockedAddress)

    const BUSD = new ethers.Contract(BUSDAddress, IERC20_ABI, admin)
    const USDC = new ethers.Contract(USDCAddress, IERC20_ABI, admin)
    const USDT = new ethers.Contract(USDTAddress, IERC20_ABI, admin)

    await faucet.sendTransaction({ to: user.address, value: ethers.utils.parseEther("1") })

    // let { vault } = await upgrade()
    let vault = await ethers.getContractAt("DaoSafuVault", safuVaultProxy)

    return { admin, user, vault, BUSD, USDC, USDT }

}

describe("Upgrade tests", async () => {

    // beforeEach(async () => {
        // await deployments.fixture("safu_upgrade_vault")
    // })

    it("Should upgrade correctly", async () => {
        let vault = await ethers.getContractAt("DaoSafuVault", safuVaultProxy)

        let totalSupply = await vault.totalSupply()
        let userBalance = await vault.balanceOf(userAddress)

        await deployments.fixture("safu_upgrade_vault")

        let totalSupplyAfterUpgrade = await vault.totalSupply()
        let userBalanceAfterUpgrade = await vault.balanceOf(userAddress)

        expect(totalSupplyAfterUpgrade.toString()).to.be.equal(totalSupply.toString())
        expect(userBalance.toString()).to.be.equal(userBalanceAfterUpgrade.toString())

        // let { user, admin, vault } = setup()
    })

    it("Should withdraw correctly", async () => {
        await deployments.fixture("safu_upgrade_vault")

        let { user, admin, vault, BUSD } = await setup()

        let balanceBefore = await BUSD.balanceOf(user.address)
        await vault.connect(user).withdraw(vault.balanceOf(user.address), BUSDAddress, [0, 0, 0, 0, 0])
        let balanceAfter = await BUSD.balanceOf(user.address)

        console.log("User withdrawn", (balanceAfter.sub(balanceBefore) ).toString())

    })


})