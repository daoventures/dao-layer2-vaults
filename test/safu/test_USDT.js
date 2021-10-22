const { expect } = require("chai")
const { ethers, deployments, network, artifacts } = require('hardhat')
const { mainnet: addresses } = require('../../addresses/citadelBSC')
const { mainnet: network_ } = require("../../addresses/bsc");
const IERC20_ABI = require("../../abis/IERC20_ABI.json")
const { isCallTrace } = require("hardhat/internal/hardhat-network/stack-traces/message-trace")

const unlockedAddress = "0xefdca55e4bce6c1d535cb2d0687b5567eef2ae83"
const unlockedAddress2 = "0xefdca55e4bce6c1d535cb2d0687b5567eef2ae83"

const DAIAddress = "0x1AF3F329e8BE154074D8769D1FFa4eE058B1DBc3"
const USDCAddress = "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d"
const USDTAddress = "0x55d398326f99059fF775485246999027B3197955"

const deployDeps = async () => {
    const { deploy } = deployments;
    const [deployer] = await ethers.getSigners();

    let impl = await deploy("BscVault", {
        from: deployer.address,
    })

    // let impl = await ethers.getContract("BscVault")

    let factory = await deploy("BscVaultFactory", {
        from: deployer.address,
        args: [impl.address]
    })

    let implArtifacts = await artifacts.readArtifact("BscVault")

    let implABI = implArtifacts.abi


    let implInterfacec = new ethers.utils.Interface(implABI)
    let data = implInterfacec.encodeFunctionData("initialize", ["DAO L1 pnck btcb-bnb", "daopnckBTCB_BNB",
        network_.PID.BTCB_BNB,
        network_.ADDRESSES.treasuryWallet, network_.ADDRESSES.communityWallet, network_.ADDRESSES.strategist, network_.ADDRESSES.adminAddress])

    let Factory = await ethers.getContract("BscVaultFactory")

    await Factory.connect(deployer).createVault(data)
    const btcbbnb = await Factory.getVault((await Factory.totalVaults()).toNumber() - 1)

    data = implInterfacec.encodeFunctionData("initialize", ["DAO L1 pnck btcb-busd", "daopnckBTCB_BUSD",
        network_.PID.BTCB_BUSD,
        network_.ADDRESSES.treasuryWallet, network_.ADDRESSES.communityWallet, network_.ADDRESSES.strategist, network_.ADDRESSES.adminAddress])

    await Factory.connect(deployer).createVault(data)
    const btcbbusd = await Factory.getVault((await Factory.totalVaults()).toNumber() - 1)

    data = implInterfacec.encodeFunctionData("initialize", ["DAO L1 pnck btcb-eth", "daopnckBTCB_ETH",
        network_.PID.BTCB_ETH,
        network_.ADDRESSES.treasuryWallet, network_.ADDRESSES.communityWallet, network_.ADDRESSES.strategist, network_.ADDRESSES.adminAddress])

    await Factory.connect(deployer).createVault(data)
    const btcbeth = await Factory.getVault((await Factory.totalVaults()).toNumber() - 1)

    data = implInterfacec.encodeFunctionData("initialize", ["DAO L1 pnck cake-bnb", "daopnckCAKE_BNB",
        network_.PID.CAKE_BNB,
        network_.ADDRESSES.treasuryWallet, network_.ADDRESSES.communityWallet, network_.ADDRESSES.strategist, network_.ADDRESSES.adminAddress])

    await Factory.connect(deployer).createVault(data)
    const cakebnb = await Factory.getVault((await Factory.totalVaults()).toNumber() - 1)


    console.log('Factory deployed to ', factory.address)
    console.log('Implementation address', impl.address)

    return { btcbbnb, btcbbusd, btcbeth, cakebnb }
}

const deploy = async (btcbbnb, btcbbusd, btcbeth, cakebnb) => {
    const [deployer] = await ethers.getSigners();

    let Strategy = await ethers.getContractFactory("DaoSafuStrategy", deployer)
    let strategy = await upgrades.deployProxy(Strategy, [btcbeth, btcbbnb,
        cakebnb, btcbbusd])

    console.log("Strategy Proxy: ", strategy.address)

    let Vault = await ethers.getContractFactory("DaoSafuVault", deployer)
    let vault = await upgrades.deployProxy(Vault, [
        "DAO L2 Citadel V2", "daoCDV2",
        addresses.treasury, addresses.communityWallet, addresses.strategist, addresses.admin,
        addresses.biconomy, strategy.address])

    await strategy.setVault(vault.address)

    console.log("Vault Proxy: ", vault.address)

    return { vault, strategy }
}

const setup = async () => {
    const [deployer, user1, user2, user3, topup] = await ethers.getSigners()

    const DAI = new ethers.Contract(DAIAddress, IERC20_ABI, deployer)
    const USDC = new ethers.Contract(USDCAddress, IERC20_ABI, deployer)
    const USDT = new ethers.Contract(USDTAddress, IERC20_ABI, deployer)

    await topup.sendTransaction({ to: addresses.admin, value: ethers.utils.parseEther("2") })
    await topup.sendTransaction({ to: unlockedAddress, value: ethers.utils.parseEther("2") })
    await topup.sendTransaction({ to: unlockedAddress2, value: ethers.utils.parseEther("2") })

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [unlockedAddress]
    })


    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [unlockedAddress2]
    })

    await network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [addresses.admin]
    })

    // const vault = await ethers.getContract("DaoSafuVault", deployer)
    // const strategy = await ethers.getContract("DaoSafuStrategy", deployer)

    let { btcbbnb, btcbbusd, btcbeth, cakebnb } = await deployDeps()

    let { vault, strategy } = await deploy(btcbbnb, btcbbusd, btcbeth, cakebnb)

    const unlockedUser = await ethers.getSigner(unlockedAddress)
    const unlockedUser2 = await ethers.getSigner(unlockedAddress2)
    const adminSigner = await ethers.getSigner(addresses.admin)

    await USDT.connect(unlockedUser).transfer(user1.address, ethers.utils.parseUnits("10", "18"))

    // await USDC.connect(unlockedUser).transfer(user1.address, ethers.utils.parseUnits("3", "18"))
    // await USDT.connect(unlockedUser).transfer(user1.address, ethers.utils.parseUnits("3", "18"))

    await USDT.connect(unlockedUser).transfer(user2.address, ethers.utils.parseUnits("15000", "18"))
    await USDT.connect(unlockedUser).transfer(user3.address, ethers.utils.parseUnits("25000", "18"))

    // await USDC.connect(unlockedUser).transfer(user2.address, ethers.utils.parseUnits("3", "18"))
    // await USDT.connect(unlockedUser).transfer(user2.address, ethers.utils.parseUnits("3", "18"))

    await USDT.connect(user1).approve(vault.address, ethers.utils.parseUnits("1000000000", 18))
    // await USDC.connect(user1).approve(vault.address, ethers.utils.parseUnits("1000000000", 18))
    // await USDT.connect(user1).approve(vault.address, ethers.utils.parseUnits("1000000000", 18))

    await USDT.connect(user2).approve(vault.address, ethers.utils.parseUnits("1000000000", 18))
    await USDT.connect(user3).approve(vault.address, ethers.utils.parseUnits("1000000000", 18))
    // await USDC.connect(user2).approve(vault.address, ethers.utils.parseUnits("1000000000", 18))
    // await USDT.connect(user2).approve(vault.address, ethers.utils.parseUnits("1000000000", 18))

    let btcbbnbContract = await ethers.getContractAt("BscVault", btcbbnb) 
    let btcbusdContract = await ethers.getContractAt("BscVault", btcbbusd)
    let btcbethContract = await ethers.getContractAt("BscVault", btcbeth)
    let cakebnbContract = await ethers.getContractAt("BscVault", cakebnb)

    await btcbbnbContract.connect(deployer).setWhitelist(strategy.address, true)
    await btcbusdContract.connect(deployer).setWhitelist(strategy.address, true)
    await btcbethContract.connect(deployer).setWhitelist(strategy.address, true)
    await cakebnbContract.connect(deployer).setWhitelist(strategy.address, true)


    return { vault, strategy, user1, user2, user3, adminSigner, deployer, DAI, USDC, USDT }
}

describe("Citadel - USDT", async () => {

    it("Should work", async () => {
        const { vault, strategy, USDT, DAI, adminSigner, deployer, user1, user2, user3 } = await setup()

        //check initial values
        expect(await vault.communityWallet()).to.be.equal(addresses.communityWallet)
        expect(await vault.treasuryWallet()).to.be.equal(addresses.treasury)
        expect(await vault.strategist()).to.be.equal(addresses.strategist)
        expect(await vault.admin()).to.be.equal(addresses.admin)

        // console.log("L1FEE", (await strategy.getL1FeeAverage()).toString())

        //check normal flow
        let user1Balance = await USDT.balanceOf(user1.address)
        let user2Balance = await USDT.balanceOf(user2.address)
        let user3Balance = await USDT.balanceOf(user3.address)
        console.log("User1 Deposited: ", ethers.utils.formatEther(user1Balance))
        console.log("User2 Deposited: ", ethers.utils.formatEther(user2Balance))
        console.log("User3 Deposited: ", ethers.utils.formatEther(user3Balance))

        await vault.connect(user1).deposit(user1Balance, USDT.address)
        await vault.connect(adminSigner).invest([0,0,0,0,0])
        await vault.connect(user2).deposit(user2Balance, USDT.address)
        await vault.connect(adminSigner).invest([0,0,0,0,0])
        console.log("value in pool ", (await vault.getAllPoolInUSD()).toString())

        await vault.connect(user3).deposit(user3Balance, USDT.address)
        await vault.connect(adminSigner).invest([0,0,0,0,0])
        console.log("USER 1 LP Tokens", (await vault.balanceOf(user1.address)).toString())

        console.log("USER 2 LP Tokens", (await vault.balanceOf(user2.address)).toString())
        console.log("USER 3 LP Tokens", (await vault.balanceOf(user3.address)).toString())


        await vault.connect(user1).withdraw(await vault.balanceOf(user1.address), USDT.address, [0,0,0,0,0])
        await vault.connect(user2).withdraw(await vault.balanceOf(user2.address), USDT.address, [0,0,0,0,0])
        await vault.connect(user3).withdraw(await vault.balanceOf(user3.address), USDT.address, [0,0,0,0,0])

        console.log("User1 Withdrawn: ", ethers.utils.formatEther(await USDT.balanceOf(user1.address)))
        console.log("User2 Withdrawn: ", ethers.utils.formatEther(await USDT.balanceOf(user2.address)))
        console.log("User3 Withdrawn: ", ethers.utils.formatEther(await USDT.balanceOf(user3.address)))

        //EMERGENCY WITHDRAW
        console.log("=======EMERGENCY WITHDRAW=====")
        // user1Balance = await USDT.balanceOf(user1.address)
        user2Balance = await USDT.balanceOf(user2.address)
        user3Balance = await USDT.balanceOf(user3.address)
        // console.log("User1 Deposited: ", ethers.utils.formatEther(user1Balance))
        console.log("User2 Deposited: ", ethers.utils.formatEther(user2Balance))
        console.log("User3 Deposited: ", ethers.utils.formatEther(user3Balance))

        // await vault.connect(user1).deposit(user1Balance, USDT.address)
        // await vault.connect(adminSigner).invest([0,0,0,0,0])
        await vault.connect(user2).deposit(user2Balance, USDT.address)
        await vault.connect(adminSigner).invest([0,0,0,0,0])
        await vault.connect(user3).deposit(user3Balance, USDT.address)
        await vault.connect(adminSigner).invest([0,0,0,0,0])
        console.log("USER 3 LP Tokens", (await vault.balanceOf(user3.address)).toString())
        console.log("value in pool ", (await vault.getAllPoolInUSD()).toString())
        await vault.connect(adminSigner).emergencyWithdraw()
        console.log("value in pool ", (await vault.getAllPoolInUSD()).toString())
        expect(vault.connect(user3).deposit(user3Balance, USDT.address)).to.be.revertedWith('Pausable: paused')
        expect(vault.connect(adminSigner).invest([0,0,0,0,0])).to.be.revertedWith('Pausable: paused')

        await vault.connect(user3).withdraw(await vault.balanceOf(user3.address), USDT.address, [0,0,0,0,0])
        console.log("User3 Withdrawn: ", ethers.utils.formatEther(await USDT.balanceOf(user3.address)))
        
        console.log("value in pool -reinvest ", (await vault.getAllPoolInUSD()).toString())
        await vault.connect(adminSigner).reinvest([0,0,0,0,0])
        console.log("value in pool -reinvest ", (await vault.getAllPoolInUSD()).toString())


    })

})
