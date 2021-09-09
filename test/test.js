const { ethers, upgrades, network } = require("hardhat");
const IERC20_ABI = require("../abis/IERC20_ABI.json")

const USDTAddr = "0xdAC17F958D2ee523a2206206994597C13D831ec7"
const USDCAddr = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
const DAIAddr = "0x6B175474E89094C44Da98b954EedeAC495271d0F"
const HBTCWBTCLpAddr = "0xb19059ebb43466C323583928285a49f558E572Fd"
const HBTCWBTCHolderAddr = "0x7a7A599D2384ed203cFEA49721628aA851E0DA16"
const binanceAddr = "0x28C6c06298d514Db089934071355E5743bf21d60"
const CRVAddr = "0xD533a949740bb3306d119CC777fa900bA034cd52"

describe("Citadel V2", function () {
    it("Should work on Curve L1 HBTCWBTC vault", async function () {
        let tx, receipt
        const [deployer, client, client2, client3, treasury, community, strategist, biconomy, admin, multisig] = await ethers.getSigners()

        // Deploy Sushi
        const SushiVault = await ethers.getContractFactory("Sushi", deployer)
        const sushiVault = await SushiVault.deploy()
        const sushiVaultArtifact = await artifacts.readArtifact("Sushi")
        const sushiVaultInterface = new ethers.utils.Interface(sushiVaultArtifact.abi)

        const SushiFactory = await ethers.getContractFactory("SushiFactory", deployer)
        const sushiFactory = await SushiFactory.deploy(sushiVault.address)
        await sushiFactory.transferOwnership(multisig.address)
        
        // Deploy WBTC-ETH
        const dataWBTCETH = sushiVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Sushi WBTC-ETH", "daoSushiWBTC", 21,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        tx = await sushiFactory.connect(multisig).createVault(dataWBTCETH)
        await tx.wait()
        const WBTCETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))
        const WBTCETHVault = await ethers.getContractAt("Sushi", WBTCETHVaultAddr, deployer)

        // Deploy DPI-ETH
        const dataDPIETH = sushiVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Sushi DPI-ETH", "daoSushiDPI", 42,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        tx = await sushiFactory.connect(multisig).createVault(dataDPIETH)
        await tx.wait()
        const DPIETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))
        const DPIETHVault = await ethers.getContractAt("Sushi", DPIETHVaultAddr, deployer)

        // Deploy DAI-ETH
        const dataDAIETH = sushiVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Sushi DAI-ETH", "daoSushiDAI", 2,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        tx = await sushiFactory.connect(multisig).createVault(dataDAIETH)
        await tx.wait()
        const DAIETHVaultAddr = await sushiFactory.getVault((await sushiFactory.getVaultLength()).sub(1))
        const DAIETHVault = await ethers.getContractAt("Sushi", DAIETHVaultAddr, deployer)

        // Deploy Curve
        const CurveVault = await ethers.getContractFactory("Curve", deployer)
        const curveVault = await CurveVault.deploy()
        const curveVaultArtifact = await artifacts.readArtifact("Curve")
        const curveVaultInterface = new ethers.utils.Interface(curveVaultArtifact.abi)

        const CurveFactory = await ethers.getContractFactory("CurveFactory", deployer)
        const curveFactory = await CurveFactory.deploy(curveVault.address)
        await curveFactory.transferOwnership(multisig.address)

        // Deploy HBTC-WBTC
        const dataHBTCWBTC = curveVaultInterface.encodeFunctionData(
            "initialize",
            [
                "DAO L1 Curve HBTC-WBTC", "daoCurveHBTC", 8,
                treasury.address, community.address, strategist.address, admin.address,
            ]
        )
        tx = await curveFactory.connect(multisig).createVault(dataHBTCWBTC)
        await tx.wait()
        const HBTCWBTCVaultAddr = await curveFactory.getVault((await curveFactory.getVaultLength()).sub(1))
        const HBTCWBTCVault = await ethers.getContractAt("Curve", HBTCWBTCVaultAddr, deployer)

        // Deploy Citadel V2
        const CitadelV2Strategy = await ethers.getContractFactory("CitadelV2Strategy", deployer)
        const citadelV2Strategy = await upgrades.deployProxy(CitadelV2Strategy, [
            HBTCWBTCVaultAddr, WBTCETHVaultAddr, DPIETHVaultAddr, DAIETHVaultAddr
        ])
        const CitadelV2Vault = await ethers.getContractFactory("CitadelV2Vault", deployer)
        const citadelV2Vault = await upgrades.deployProxy(CitadelV2Vault, [
            "DAO L2 Citadel V2", "daoCDV2",
            treasury.address, community.address, strategist.address, admin.address,
            biconomy.address, citadelV2Strategy.address
        ])
        await citadelV2Strategy.setVault(citadelV2Vault.address)
        
        // Set whitelist
        await HBTCWBTCVault.connect(admin).setWhitelistAddress(citadelV2Strategy.address, true)
        await WBTCETHVault.connect(admin).setWhitelistAddress(citadelV2Strategy.address, true)
        await DPIETHVault.connect(admin).setWhitelistAddress(citadelV2Strategy.address, true)
        await DAIETHVault.connect(admin).setWhitelistAddress(citadelV2Strategy.address, true)

        // Unlock & transfer Stablecoins to client
        network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
        const binanceAcc = await ethers.getSigner(binanceAddr)
        const USDTContract = new ethers.Contract(USDTAddr, IERC20_ABI, binanceAcc)
        const USDCContract = new ethers.Contract(USDCAddr, IERC20_ABI, binanceAcc)
        const DAIContract = new ethers.Contract(DAIAddr, IERC20_ABI, binanceAcc)
        await USDTContract.transfer(client.address, ethers.utils.parseUnits("10000", 6))
        await USDTContract.transfer(client2.address, ethers.utils.parseUnits("10000", 6))
        await USDCContract.transfer(client.address, ethers.utils.parseUnits("10000", 6))
        await USDCContract.transfer(client3.address, ethers.utils.parseUnits("10000", 6))
        await DAIContract.transfer(client.address, ethers.utils.parseUnits("10000", 18))

        // Deposit
        await USDTContract.connect(client).approve(citadelV2Vault.address, ethers.constants.MaxUint256)
        await USDCContract.connect(client).approve(citadelV2Vault.address, ethers.constants.MaxUint256)
        await DAIContract.connect(client).approve(citadelV2Vault.address, ethers.constants.MaxUint256)
        tx = await citadelV2Vault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDTAddr)
        // receipt = await tx.wait()
        // console.log(receipt.gasUsed.toString())
        await citadelV2Vault.connect(client).deposit(ethers.utils.parseUnits("10000", 6), USDCAddr)
        await citadelV2Vault.connect(client).deposit(ethers.utils.parseUnits("10000", 18), DAIAddr)
        // console.log(ethers.utils.formatEther(await citadelV2Vault.balanceOf(client.address)))

        // Invest
        tx = await citadelV2Vault.connect(admin).invest()
        receipt = await tx.wait()
        console.log(receipt.gasUsed.toString())
        // console.log(ethers.utils.formatEther(await citadelV2Vault.getAllPool(true)))
        // console.log(ethers.utils.formatEther(await citadelV2Vault.getAllPoolInUSD()))
        // console.log(ethers.utils.formatEther(
        //     (await citadelV2Vault.balanceOf(client.address))
        //     .mul(await citadelV2Vault.getPricePerFullShare())
        //     .div(ethers.utils.parseEther("1"))
        // )) // User share in USD
        // console.log(ethers.utils.formatEther(await citadelV2Vault.getPricePerFullShare())) // LP token price
        // console.log((await citadelV2Strategy.getCurrentCompositionPerc()).toString());
        // console.log(ethers.utils.formatEther(await citadelV2Vault.balanceOf(client.address)))
        // console.log(ethers.utils.formatEther(await citadelV2Strategy.watermark()))
    })
    
    // it("Should work on Curve L1 HBTCWBTC vault", async function () {
    //     let tx, receipt
    //     const [deployer, client, client2, treasury, community, strategist, admin, multisig] = await ethers.getSigners()

    //     // Deploy
    //     const CurveVault = await ethers.getContractFactory("Curve", deployer)
    //     const curveVault = await CurveVault.deploy()
    //     const curveVaultArtifact = await artifacts.readArtifact("Curve")
    //     const curveVaultInterface = new ethers.utils.Interface(curveVaultArtifact.abi)

    //     const CurveFactory = await ethers.getContractFactory("CurveFactory", deployer)
    //     const curveFactory = await CurveFactory.deploy(curveVault.address)
        
    //     const dataHBTCWBTC = curveVaultInterface.encodeFunctionData(
    //         "initialize",
    //         [
    //             "DAO L1 Curve HBTC-WBTC", "daoCurveHBTC", 8,
    //             treasury.address, community.address, strategist.address, admin.address,
    //         ]
    //     )
    //     tx = await curveFactory.createVault(dataHBTCWBTC)
    //     await tx.wait()
    //     const HBTCWBTCVaultAddr = await curveFactory.getVault((await curveFactory.getVaultLength()).sub(1))
    //     const HBTCWBTCVault = await ethers.getContractAt("Curve", HBTCWBTCVaultAddr, deployer)
    //     await HBTCWBTCVault.transferOwnership(multisig.address)

    //     // Deploy CurveZap
    //     const CurveZap = await ethers.getContractFactory("CurveHBTCZap", deployer)
    //     const curveZap = await CurveZap.deploy(HBTCWBTCVaultAddr)
    //     await HBTCWBTCVault.connect(admin).setCurveZap(curveZap.address)

    //     // Unlock & transfer
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [HBTCWBTCHolderAddr]})
    //     const HBTCWBTCHolderAcc = await ethers.getSigner(HBTCWBTCHolderAddr)
    //     const HBTCWBTCContract = new ethers.Contract(HBTCWBTCLpAddr, IERC20_ABI, HBTCWBTCHolderAcc)
    //     await HBTCWBTCContract.transfer(client.address, ethers.utils.parseEther("1"))
    //     await HBTCWBTCContract.transfer(client2.address, ethers.utils.parseEther("1"))

    //     // Whitelist
    //     await HBTCWBTCVault.connect(admin).setWhitelistAddress(client.address, true)
    //     // await HBTCWBTCVault.connect(admin).setWhitelistAddress(client2.address, true)

    //     // Deposit
    //     await HBTCWBTCContract.connect(client).approve(HBTCWBTCVault.address, ethers.constants.MaxUint256)
    //     tx = await HBTCWBTCVault.connect(client).deposit(ethers.utils.parseEther("1"))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await HBTCWBTCVault.balanceOf(client.address)))

    //     // Invest
    //     tx = await HBTCWBTCVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())

    //     // Yield
    //     // console.log(ethers.utils.formatEther(await HBTCWBTCVault.getPricePerFullShare(false)))
    //     network.provider.request({method: "hardhat_impersonateAccount", params: [binanceAddr]})
    //     const binanceAcc = await ethers.getSigner(binanceAddr)
    //     const CRVContract = new ethers.Contract(CRVAddr, IERC20_ABI, binanceAcc)
    //     await CRVContract.transfer(HBTCWBTCVault.address, ethers.utils.parseEther("10"))
    //     tx = await HBTCWBTCVault.connect(admin).yield()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await HBTCWBTCVault.getPricePerFullShare(false)))

    //     // Check fees (yield fees)
    //     // console.log(ethers.utils.formatEther(await admin.getBalance()))
    //     // console.log(ethers.utils.formatEther(await community.getBalance()))
    //     // console.log(ethers.utils.formatEther(await strategist.getBalance()))

    //     // Second deposit
    //     await HBTCWBTCContract.connect(client2).approve(HBTCWBTCVault.address, ethers.constants.MaxUint256)
    //     tx = await HBTCWBTCVault.connect(client2).deposit(ethers.utils.parseEther("1"))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     // console.log(ethers.utils.formatEther(await HBTCWBTCVault.balanceOf(client2.address)))

    //     // Check fees (deposit fees)
    //     // console.log(ethers.utils.formatEther(await HBTCWBTCContract.balanceOf(treasury.address)))
    //     // console.log(ethers.utils.formatEther(await HBTCWBTCContract.balanceOf(community.address)))
    //     // console.log(ethers.utils.formatEther(await HBTCWBTCContract.balanceOf(strategist.address)))

    //     // Second invest
    //     tx = await HBTCWBTCVault.connect(admin).invest()
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())

    //     // Emergency withdrawal
    //     // await HBTCWBTCVault.connect(admin).emergencyWithdraw()
    //     // await HBTCWBTCVault.connect(admin).reinvest()

    //     // // Getter function
    //     // console.log(ethers.utils.formatEther(await HBTCWBTCVault.getPendingRewards()))
    //     // console.log(ethers.utils.formatEther(await HBTCWBTCVault.getAllPool()))
    //     // console.log(ethers.utils.formatEther(await HBTCWBTCVault.getAllPoolInNative())) // All pool in BTC
    //     // console.log(ethers.utils.formatEther((await HBTCWBTCVault.balanceOf(client.address))
    //     //     .mul(await HBTCWBTCVault.getPricePerFullShare(true))
    //     //     .div(ethers.utils.parseEther("1"))
    //     // )) // User share in BTC

    //     // Withdraw
    //     console.log("-----withdraw-----")
    //     tx = await HBTCWBTCVault.connect(client).withdraw(HBTCWBTCVault.balanceOf(client.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await HBTCWBTCContract.balanceOf(client.address))) // 1.000398083317176751

    //     tx = await HBTCWBTCVault.connect(client2).withdraw(HBTCWBTCVault.balanceOf(client2.address))
    //     // receipt = await tx.wait()
    //     // console.log(receipt.gasUsed.toString())
    //     console.log(ethers.utils.formatEther(await HBTCWBTCContract.balanceOf(client2.address))) // 0.9
    // });
});
