// SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

interface IRouter {
    function swapExactTokensForTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external returns (uint[] memory amounts);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint amountADesired,
        uint amountBDesired,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB, uint liquidity);

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint liquidity,
        uint amountAMin,
        uint amountBMin,
        address to,
        uint deadline
    ) external returns (uint amountA, uint amountB);

    function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts);
}

interface IDaoL1Vault is IERC20Upgradeable {
    function deposit(uint amount) external;
    function withdraw(uint share) external returns (uint);
    function getAllPoolInUSD() external view returns (uint);
    function getAllPoolInETH() external view returns (uint);
}

interface IChainlink {
    function latestAnswer() external view returns (int256);
}

contract CitadelV2Strategy is Initializable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC20Upgradeable constant WAVAX = IERC20Upgradeable(0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7);
    IERC20Upgradeable constant JOE = IERC20Upgradeable(0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd);
    IERC20Upgradeable constant PNG = IERC20Upgradeable(0x60781C2586D68229fde47564546784ab3fACA982);
    IERC20Upgradeable constant LYD = IERC20Upgradeable(0x4C9B4E1AC6F24CdE3660D5E4Ef1eBF77C710C084);

    IERC20Upgradeable constant JOEAVAX = IERC20Upgradeable(0x454e67025631c065d3cfad6d71e6892f74487a15);
    IERC20Upgradeable constant PNGAVAX = IERC20Upgradeable(0xd7538cABBf8605BdE1f4901B47B8D42c61DE0367);
    IERC20Upgradeable constant LYDAVAX = IERC20Upgradeable(0xfba4edaad3248b03f1a3261ad06ad846a8e50765);

    IRouter constant joeRouter = IRouter(0x60aE616a2155Ee3d9A68541Ba4544862310933d4);
    IRouter constant pangolinRouter = IRouter(0xE54Ca86531e17Ef3616d22Ca28b0D458b6C89106);
    IRouter constant lydiaRouter = IRouter(0xA52aBE4676dbfd04Df42eF7755F01A3c41f28D27);

    IDaoL1Vault public HBTCWBTCVault;
    IDaoL1Vault public WBTCETHVault;
    IDaoL1Vault public DPIETHVault;
    IDaoL1Vault public DAIETHVault;

    uint constant HBTCWBTCTargetPerc = 3000;
    uint constant WBTCETHTargetPerc = 3000;
    uint constant DPIETHTargetPerc = 3000;
    uint constant DAIETHTargetPerc = 1000;

    address public vault;
    uint public watermark; // In USD (18 decimals)
    uint public profitFeePerc;

    event TargetComposition (uint HBTCWBTCTargetPool, uint WBTCETHTargetPool, uint DPIETHTargetPool, uint DAIETHTargetPool);
    event CurrentComposition (uint HBTCWBTCCurrentPool, uint WBTCETHCurrentPool, uint DPIETHCurrentPool, uint DAIETHCurrentPool);
    event InvestHBTCWBTC(uint WAVAXAmt, uint HBTCWBTCAmt);
    event InvestWBTCETH(uint WAVAXAmt, uint WBTCETHAmt);
    event InvestDPIETH(uint WAVAXAmt, uint DPIETHAmt);
    event InvestDAIETH(uint WAVAXAmt, uint DAIETHAmt);
    event Withdraw(uint amount, uint WAVAXAmt);
    event WithdrawHBTCWBTC(uint lpTokenAmt, uint WAVAXAmt);
    event WithdrawWBTCETH(uint lpTokenAmt, uint WAVAXAmt);
    event WithdrawDPIETH(uint lpTokenAmt, uint WAVAXAmt);
    event WithdrawDAIETH(uint lpTokenAmt, uint WAVAXAmt);
    event CollectProfitAndUpdateWatermark(uint currentWatermark, uint lastWatermark, uint fee);
    event AdjustWatermark(uint currentWatermark, uint lastWatermark);
    event Reimburse(uint WAVAXAmt);
    event EmergencyWithdraw(uint WAVAXAmt);

    modifier onlyVault {
        require(msg.sender == vault, "Only vault");
        _;
    }

    function initialize(
        address _HBTCWBTCVault, address _WBTCETHVault, address _DPIETHVault, address _DAIETHVault
    ) external initializer {
        __Ownable_init();

        HBTCWBTCVault = IDaoL1Vault(_HBTCWBTCVault);
        WBTCETHVault = IDaoL1Vault(_WBTCETHVault);
        DPIETHVault = IDaoL1Vault(_DPIETHVault);
        DAIETHVault = IDaoL1Vault(_DAIETHVault);

        profitFeePerc = 2000;

        WAVAX.safeApprove(address(sushiRouter), type(uint).max);
        WBTC.safeApprove(address(curvePool), type(uint).max);
        WBTC.safeApprove(address(sushiRouter), type(uint).max);
        DPI.safeApprove(address(sushiRouter), type(uint).max);
        DAI.safeApprove(address(sushiRouter), type(uint).max);

        HBTCWBTC.safeApprove(address(HBTCWBTCVault), type(uint).max);
        HBTCWBTC.safeApprove(address(sushiRouter), type(uint).max);
        WBTCETH.safeApprove(address(WBTCETHVault), type(uint).max);
        WBTCETH.safeApprove(address(sushiRouter), type(uint).max);
        DPIETH.safeApprove(address(DPIETHVault), type(uint).max);
        DPIETH.safeApprove(address(sushiRouter), type(uint).max);
        DAIETH.safeApprove(address(DAIETHVault), type(uint).max);
        DAIETH.safeApprove(address(sushiRouter), type(uint).max);
    }

    function invest(uint WAVAXAmt) external onlyVault {
        WAVAX.safeTransferFrom(vault, address(this), WAVAXAmt);

        uint[] memory pools = getEachPool();
        uint pool = pools[0] + pools[1] + pools[2] + pools[3] + WAVAXAmt;
        uint HBTCWBTCTargetPool = pool * 3000 / 10000; // 30%
        uint WBTCETHTargetPool = HBTCWBTCTargetPool; // 30%
        uint DPIETHTargetPool = HBTCWBTCTargetPool; // 30%
        uint DAIETHTargetPool = pool * 1000 / 10000; // 10%

        // Rebalancing invest
        if (
            HBTCWBTCTargetPool > pools[0] &&
            WBTCETHTargetPool > pools[1] &&
            DPIETHTargetPool > pools[2] &&
            DAIETHTargetPool > pools[3]
        ) {
            investHBTCWBTC(HBTCWBTCTargetPool - pools[0]);
            investWBTCETH((WBTCETHTargetPool - pools[1]));
            investDPIETH((DPIETHTargetPool - pools[2]));
            investDAIETH((DAIETHTargetPool - pools[3]));
        } else {
            uint furthest;
            uint farmIndex;
            uint diff;

            if (HBTCWBTCTargetPool > pools[0]) {
                diff = HBTCWBTCTargetPool - pools[0];
                furthest = diff;
                farmIndex = 0;
            }
            if (WBTCETHTargetPool > pools[1]) {
                diff = WBTCETHTargetPool - pools[1];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 1;
                }
            }
            if (DPIETHTargetPool > pools[2]) {
                diff = DPIETHTargetPool - pools[2];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 2;
                }
            }
            if (DAIETHTargetPool > pools[3]) {
                diff = DAIETHTargetPool - pools[3];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 3;
                }
            }

            if (farmIndex == 0) investHBTCWBTC(WAVAXAmt);
            else if (farmIndex == 1) investWBTCETH(WAVAXAmt);
            else if (farmIndex == 2) investDPIETH(WAVAXAmt);
            else investDAIETH(WAVAXAmt);
        }

        emit TargetComposition(HBTCWBTCTargetPool, WBTCETHTargetPool, DPIETHTargetPool, DAIETHTargetPool);
        emit CurrentComposition(pools[0], pools[1], pools[2], pools[3]);
    }

    function investHBTCWBTC(uint WAVAXAmt) private {
        uint WBTCAmt = swap(address(WAVAX), address(WBTC), WAVAXAmt, 0);
        uint256[2] memory amounts = [0, WBTCAmt];
        curvePool.add_liquidity(amounts, 0);
        uint HBTCWBTCAmt = HBTCWBTC.balanceOf(address(this));
        HBTCWBTCVault.deposit(HBTCWBTCAmt);
        emit InvestHBTCWBTC(WAVAXAmt, HBTCWBTCAmt);
    }

    function investWBTCETH(uint WAVAXAmt) private {
        uint halfWAVAX = WAVAXAmt / 2;
        uint WBTCAmt = swap(address(WAVAX), address(WBTC), halfWAVAX, 0);
        (,,uint WBTCETHAmt) = sushiRouter.addLiquidity(address(WBTC), address(WAVAX), WBTCAmt, halfWAVAX, 0, 0, address(this), block.timestamp);
        WBTCETHVault.deposit(WBTCETHAmt);
        emit InvestWBTCETH(WAVAXAmt, WBTCETHAmt);
    }

    function investDPIETH(uint WAVAXAmt) private {
        uint halfWAVAX = WAVAXAmt / 2;
        uint DPIAmt = swap(address(WAVAX), address(DPI), halfWAVAX, 0);
        (,,uint DPIETHAmt) = sushiRouter.addLiquidity(address(DPI), address(WAVAX), DPIAmt, halfWAVAX, 0, 0, address(this), block.timestamp);
        DPIETHVault.deposit(DPIETHAmt);
        emit InvestDPIETH(WAVAXAmt, DPIETHAmt);
    }

    function investDAIETH(uint WAVAXAmt) private {
        uint halfWAVAX = WAVAXAmt / 2;
        uint DAIAmt = swap(address(WAVAX), address(DAI), halfWAVAX, 0);
        (,,uint DAIETHAmt) = sushiRouter.addLiquidity(address(DAI), address(WAVAX), DAIAmt, halfWAVAX, 0, 0, address(this), block.timestamp);
        DAIETHVault.deposit(DAIETHAmt);
        emit InvestDAIETH(WAVAXAmt, DAIETHAmt);
    }

    /// @param amount Amount to withdraw in USD
    function withdraw(uint amount, uint[] calldata tokenPrice) external onlyVault returns (uint WAVAXAmt) {
        uint sharePerc = amount * 1e18 / getAllPoolInUSD();
        uint WAVAXAmtBefore = WAVAX.balanceOf(address(this));
        withdrawHBTCWBTC(sharePerc, tokenPrice[1]);
        withdrawWBTCETH(sharePerc, tokenPrice[1]);
        withdrawDPIETH(sharePerc, tokenPrice[2]);
        withdrawDAIETH(sharePerc, tokenPrice[3]);
        WAVAXAmt = WAVAX.balanceOf(address(this)) - WAVAXAmtBefore;
        WAVAX.safeTransfer(vault, WAVAXAmt);
        emit Withdraw(amount, WAVAXAmt);
    }

    function withdrawHBTCWBTC(uint sharePerc, uint WBTCPrice) private {
        uint HBTCWBTCAmt = HBTCWBTCVault.withdraw(HBTCWBTCVault.balanceOf(address(this)) * sharePerc / 1e18);
        curvePool.remove_liquidity_one_coin(HBTCWBTCAmt, 1, 0);
        uint WBTCAmt = WBTC.balanceOf(address(this));
        uint _WAVAXAmt = swap(address(WBTC), address(WAVAX), WBTCAmt, WBTCAmt * WBTCPrice / 1e8);
        emit WithdrawHBTCWBTC(HBTCWBTCAmt, _WAVAXAmt);
    }

    function withdrawWBTCETH(uint sharePerc, uint WBTCPrice) private {
        uint WBTCETHAmt = WBTCETHVault.withdraw(WBTCETHVault.balanceOf(address(this)) * sharePerc / 1e18);
        (uint WBTCAmt, uint WAVAXAmt) = sushiRouter.removeLiquidity(address(WBTC), address(WAVAX), WBTCETHAmt, 0, 0, address(this), block.timestamp);
        uint _WAVAXAmt = swap(address(WBTC), address(WAVAX), WBTCAmt, WBTCAmt * WBTCPrice / 1e8);
        emit WithdrawWBTCETH(WBTCETHAmt, WAVAXAmt + _WAVAXAmt);
    }

    function withdrawDPIETH(uint sharePerc, uint DPIPrice) private {
        uint DPIETHAmt = DPIETHVault.withdraw(DPIETHVault.balanceOf(address(this)) * sharePerc / 1e18);
        (uint DPIAmt, uint WAVAXAmt) = sushiRouter.removeLiquidity(address(DPI), address(WAVAX), DPIETHAmt, 0, 0, address(this), block.timestamp);
        uint _WAVAXAmt = swap(address(DPI), address(WAVAX), DPIAmt, DPIAmt * DPIPrice / 1e18);
        emit WithdrawDPIETH(DPIETHAmt, WAVAXAmt + _WAVAXAmt);
    }

    function withdrawDAIETH(uint sharePerc, uint DAIPrice) private {
        uint DAIETHAmt = DAIETHVault.withdraw(DAIETHVault.balanceOf(address(this)) * sharePerc / 1e18);
        (uint DAIAmt, uint WAVAXAmt) = sushiRouter.removeLiquidity(address(DAI), address(WAVAX), DAIETHAmt, 0, 0, address(this), block.timestamp);
        uint _WAVAXAmt = swap(address(DAI), address(WAVAX), DAIAmt, DAIAmt * DAIPrice / 1e18);
        emit WithdrawDAIETH(DAIETHAmt, WAVAXAmt + _WAVAXAmt);
    }

    function collectProfitAndUpdateWatermark() public onlyVault returns (uint fee) {
        uint currentWatermark = getAllPoolInUSD();
        uint lastWatermark = watermark;
        if (currentWatermark > lastWatermark) {
            uint profit = currentWatermark - lastWatermark;
            fee = profit * profitFeePerc / 10000;
            watermark = currentWatermark;
        }
        emit CollectProfitAndUpdateWatermark(currentWatermark, lastWatermark, fee);
    }

    /// @param signs True for positive, false for negative
    function adjustWatermark(uint amount, bool signs) external onlyVault {
        uint lastWatermark = watermark;
        watermark = signs == true ? watermark + amount : watermark - amount;
        emit AdjustWatermark(watermark, lastWatermark);
    }

    /// @param amount Amount to reimburse to vault contract in ETH
    function reimburse(uint farmIndex, uint amount) external onlyVault returns (uint WAVAXAmt) {
        if (farmIndex == 0) withdrawHBTCWBTC(amount * 1e18 / getHBTCWBTCPool(), 0);
        else if (farmIndex == 1) withdrawWBTCETH(amount * 1e18 / getWBTCETHPool(), 0);
        else if (farmIndex == 2) withdrawDPIETH(amount * 1e18 / getDPIETHPool(), 0);
        else if (farmIndex == 3) withdrawDAIETH(amount * 1e18 / getDAIETHPool(), 0);
        WAVAXAmt = WAVAX.balanceOf(address(this));
        WAVAX.safeTransfer(vault, WAVAXAmt);
        emit Reimburse(WAVAXAmt);
    }

    function emergencyWithdraw() external onlyVault {
        // 1e18 == 100% of share
        withdrawHBTCWBTC(1e18, 0);
        withdrawWBTCETH(1e18, 0);
        withdrawDPIETH(1e18, 0);
        withdrawDAIETH(1e18, 0);
        uint WAVAXAmt = WAVAX.balanceOf(address(this));
        WAVAX.safeTransfer(vault, WAVAXAmt);
        watermark = 0;
        emit EmergencyWithdraw(WAVAXAmt);
    }

    function swap(address from, address to, uint amount, uint amountOutMin) private returns (uint) {
        address[] memory path = new address[](2);
        path[0] = from;
        path[1] = to;
        return (sushiRouter.swapExactTokensForTokens(amount, amountOutMin, path, address(this), block.timestamp))[1];
    }

    function setVault(address _vault) external {
        require(vault == address(0), "Vault set");
        vault = _vault;
    }

    function setProfitFeePerc(uint _profitFeePerc) external onlyVault {
        profitFeePerc = _profitFeePerc;
    }

    function getPath(address tokenA, address tokenB) private pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;
    }

    function getHBTCWBTCPool() private view returns (uint) {
        uint HBTCWBTCVaultPoolInBTC = HBTCWBTCVault.getAllPoolInNative();
        if (HBTCWBTCVaultPoolInBTC == 0) return 0;
        uint share = HBTCWBTCVaultPoolInBTC * HBTCWBTCVault.balanceOf(address(this)) / HBTCWBTCVault.totalSupply();
        uint BTCPriceInETH = uint(IChainlink(0xdeb288F737066589598e9214E782fa5A8eD689e8).latestAnswer());
        require(BTCPriceInETH > 0, "ChainLink error");
        return share * BTCPriceInETH / 1e18;
    }

    function getWBTCETHPool() private view returns (uint) {
        uint WBTCETHVaultPool = WBTCETHVault.getAllPoolInETH();
        if (WBTCETHVaultPool == 0) return 0;
        return WBTCETHVaultPool * WBTCETHVault.balanceOf(address(this)) / WBTCETHVault.totalSupply();
    }

    function getDPIETHPool() private view returns (uint) {
        uint DPIETHVaultPool = DPIETHVault.getAllPoolInETH();
        if (DPIETHVaultPool == 0) return 0;
        return DPIETHVaultPool * DPIETHVault.balanceOf(address(this)) / DPIETHVault.totalSupply();
    }

    function getDAIETHPool() private view returns (uint) {
        uint DAIETHVaultPool = DAIETHVault.getAllPoolInETH();
        if (DAIETHVaultPool == 0) return 0;
        return DAIETHVaultPool * DAIETHVault.balanceOf(address(this)) / DAIETHVault.totalSupply();
    }

    function getEachPool() private view returns (uint[] memory pools) {
        pools = new uint[](4);
        pools[0] = getHBTCWBTCPool();
        pools[1] = getWBTCETHPool();
        pools[2] = getDPIETHPool();
        pools[3] = getDAIETHPool();
    }

    /// @notice This function return only farms TVL in ETH
    function getAllPool() public view returns (uint) {
        uint[] memory pools = getEachPool();
        return pools[0] + pools[1] + pools[2] + pools[3];
    }

    function getAllPoolInUSD() public view returns (uint) {
        uint ETHPriceInUSD = uint(IChainlink(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419).latestAnswer()); // 8 decimals
        require(ETHPriceInUSD > 0, "ChainLink error");
        return getAllPool() * ETHPriceInUSD / 1e8;
    }

    function getCurrentCompositionPerc() external view returns (uint[] memory percentages) {
        uint[] memory pools = getEachPool();
        uint allPool = pools[0] + pools[1] + pools[2] + pools[3];
        percentages = new uint[](4);
        percentages[0] = pools[0] * 10000 / allPool;
        percentages[1] = pools[1] * 10000 / allPool;
        percentages[2] = pools[2] * 10000 / allPool;
        percentages[3] = pools[3] * 10000 / allPool;
    }
}