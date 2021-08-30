// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "hardhat/console.sol";

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

interface IPair is IERC20Upgradeable {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
}

interface IUniV3Router {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint deadline;
        uint amountIn;
        uint amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(
        ExactInputSingleParams calldata params
    ) external returns (uint amountOut);

    struct IncreaseLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }
    function increaseLiquidity(
       IncreaseLiquidityParams calldata params
    ) external returns (uint128 liquidity, uint256 amount0, uint256 amount1);

    struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }
    function decreaseLiquidity(
        DecreaseLiquidityParams calldata params
    ) external returns (uint256 amount0, uint256 amount1);

    function positions(
        uint256 tokenId
    ) external view returns (uint96, address, address, address, uint24, int24, int24, uint128, uint256, uint256, uint128, uint128);
}

interface IMasterChef {
    function deposit(uint pid, uint amount) external;
    function withdraw(uint pid, uint amount) external;
}

interface IWETH is IERC20Upgradeable {
    function withdraw(uint amount) external;
}

interface IDaoL1Vault is IERC20Upgradeable {
    function deposit(uint amount) external;
    function withdraw(uint share) external returns (uint);
    function getAllPoolInUSD() external view returns (uint);
    function getAllPoolInETH() external view returns (uint);
    function getAllPoolInETHExcludeVestedILV() external view returns (uint);
}

interface IChainlink {
    function latestAnswer() external view returns (int256);
}

contract MVFStrategy is Initializable, OwnableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for IWETH;
    using SafeERC20Upgradeable for IPair;

    // IERC20Upgradeable constant USDT = IERC20Upgradeable(0xdAC17F958D2ee523a2206206994597C13D831ec7);
    // IERC20Upgradeable constant USDC = IERC20Upgradeable(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    // IERC20Upgradeable constant DAI = IERC20Upgradeable(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    IWETH constant WETH = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    IERC20Upgradeable constant AXS = IERC20Upgradeable(0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b);
    IERC20Upgradeable constant SLP = IERC20Upgradeable(0xCC8Fa225D80b9c7D42F96e9570156c65D6cAAa25);
    IERC20Upgradeable constant ILV = IERC20Upgradeable(0x767FE9EDC9E0dF98E07454847909b5E959D7ca0E);
    IERC20Upgradeable constant GHST = IERC20Upgradeable(0x3F382DbD960E3a9bbCeaE22651E88158d2791550);
    IERC20Upgradeable constant REVV = IERC20Upgradeable(0x557B933a7C2c45672B610F8954A3deB39a51A8Ca);
    IERC20Upgradeable constant MVI = IERC20Upgradeable(0x72e364F2ABdC788b7E918bc238B21f109Cd634D7);

    IERC20Upgradeable constant AXSETH = IERC20Upgradeable(0x0C365789DbBb94A29F8720dc465554c587e897dB);
    IERC20Upgradeable constant SLPETH = IERC20Upgradeable(0x8597fa0773888107E2867D36dd87Fe5bAFeAb328);
    IERC20Upgradeable constant ILVETH = IERC20Upgradeable(0x6a091a3406E0073C3CD6340122143009aDac0EDa);
    IERC20Upgradeable constant GHSTETH = IERC20Upgradeable(0xFbA31F01058DB09573a383F26a088f23774d4E5d);
    IPair constant REVVETH = IPair(0x724d5c9c618A2152e99a45649a3B8cf198321f46);

    IRouter constant uniV2Router = IRouter(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D); // Uniswap v2
    IUniV3Router uniV3Router = IUniV3Router(0xE592427A0AEce92De3Edee1F18E0157C05861564);
    IRouter constant sushiRouter = IRouter(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F); // Sushi

    IDaoL1Vault public AXSETHVault;
    IDaoL1Vault public SLPETHVault;
    IDaoL1Vault public ILVETHVault;
    IDaoL1Vault public GHSTETHVault;

    uint constant AXSETHTargetPerc = 2000;
    uint constant SLPETHTargetPerc = 1500;
    uint constant ILVETHTargetPerc = 2000;
    uint constant GHSTETHTargetPerc = 1000;
    uint constant REVVETHTargetPerc = 1000;
    uint constant MVITargetPerc = 2500;

    uint public SLPETHTokenId;
    uint public GHSTETHTokenId;

    address public vault;
    uint public watermark; // In USD (18 decimals)

    address public treasuryWallet;
    address public communityWallet;
    address public strategist;
    address public admin;

    // event here

    modifier onlyVault {
        require(msg.sender == vault, "Only vault");
        _;
    }

    modifier onlyOwnerOrAdmin {
        require(msg.sender == owner() || msg.sender == address(admin), "Only owner or admin");
        _;
    }

    function initialize(
        address _AXSETHVault, address _SLPETHVault, address _ILVETHVault, address _GHSTETHVault,
        // address _treasuryWallet, address _communityWallet, address _admin, address _strategist, address _biconomy,
        uint _SLPETHTokenId, uint _GHSTETHTokenId
    ) external initializer {
        __Ownable_init();

        AXSETHVault = IDaoL1Vault(_AXSETHVault);
        SLPETHVault = IDaoL1Vault(_SLPETHVault);
        ILVETHVault = IDaoL1Vault(_ILVETHVault);
        GHSTETHVault = IDaoL1Vault(_GHSTETHVault);

        // treasuryWallet = _treasuryWallet;
        // communityWallet = _communityWallet;
        // admin = _admin;
        // strategist = _strategist;

        SLPETHTokenId = _SLPETHTokenId;
        GHSTETHTokenId = _GHSTETHTokenId;

        WETH.safeApprove(address(sushiRouter), type(uint).max);
        WETH.safeApprove(address(uniV2Router), type(uint).max);
        WETH.safeApprove(address(uniV3Router), type(uint).max);

        // USDT.safeApprove(address(sushiRouter), type(uint).max);
        // USDC.safeApprove(address(sushiRouter), type(uint).max);
        // DAI.safeApprove(address(sushiRouter), type(uint).max);

        AXS.safeApprove(address(sushiRouter), type(uint).max);
        SLP.safeApprove(address(sushiRouter), type(uint).max);
        ILV.safeApprove(address(sushiRouter), type(uint).max);
        GHST.safeApprove(address(uniV3Router), type(uint).max);
        REVV.safeApprove(address(uniV2Router), type(uint).max);
        MVI.safeApprove(address(uniV2Router), type(uint).max);

        AXSETH.safeApprove(address(sushiRouter), type(uint).max);
        AXSETH.safeApprove(address(AXSETHVault), type(uint).max);
        SLPETH.safeApprove(address(sushiRouter), type(uint).max);
        SLPETH.safeApprove(address(SLPETHVault), type(uint).max);
        ILVETH.safeApprove(address(sushiRouter), type(uint).max);
        ILVETH.safeApprove(address(ILVETHVault), type(uint).max);
        REVVETH.safeApprove(address(uniV2Router), type(uint).max);
    }

    function invest(uint WETHAmt) external onlyVault {
        WETH.safeTransferFrom(vault, address(this), WETHAmt);

        uint[] memory pools = getEachPool(false);
        uint pool = pools[0] + pools[1] + pools[2] + pools[3] + pools[4] + pools[5] + WETHAmt;
        uint AXSETHTargetPool = pool * 2000 / 1000; // 20%
        uint SLPETHTargetPool = pool * 1500 / 1000; // 15%
        uint ILVETHTargetPool = AXSETHTargetPool; // 20%
        uint GHSTETHTargetPool = pool * 1000 / 1000; // 10%
        uint REVVETHTargetPool = GHSTETHTargetPool; // 10%
        uint MVITargetPool = pool * 2500 / 1000; // 25%

        // Rebalancing invest
        if (
            AXSETHTargetPool > pools[0] &&
            SLPETHTargetPool > pools[1] &&
            ILVETHTargetPool > pools[2] &&
            GHSTETHTargetPool > pools[3] &&
            REVVETHTargetPool > pools[4] &&
            MVITargetPool > pools[5]
        ) {
            uint WETHAmt1000 = WETHAmt * 1000 / 10000;
            uint WETHAmt750 = WETHAmt * 750 / 10000;
            uint WETHAmt500 = WETHAmt * 500 / 10000;

            // AXS-ETH (10%-10%)
            // investAXSETH(WETHAmt1000);

            // SLP-ETH (7.5%-7.5%)
            // investSLPETH(WETHAmt750);

            // ILV-ETH (10%-10%)
            // investILVETH(WETHAmt1000);
            investILVETH(WETHAmt * 1500 / 10000);

            // GHST-ETH (5%-5%)
            // investGHSTETH(WETHAmt500);

            // REVV-ETH (5%-5%)
            // investREVVETH(WETHAmt500);
            investREVVETH(WETHAmt * 1500 / 10000);

            // MVI (25%)
            // investMVI(WETHAmt * 2500 / 10000);
            investMVI(WETHAmt * 4000 / 10000);
        } else {
            uint furthest;
            uint farmIndex;
            uint diff;

            if (AXSETHTargetPool > pools[0]) {
                diff = AXSETHTargetPool - pools[0];
                furthest = diff;
                farmIndex = 0;
            }
            if (SLPETHTargetPool > pools[1]) {
                diff = SLPETHTargetPool - pools[1];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 1;
                }
            }
            if (ILVETHTargetPool > pools[2]) {
                diff = ILVETHTargetPool - pools[2];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 2;
                }
            }
            if (GHSTETHTargetPool > pools[3]) {
                diff = GHSTETHTargetPool - pools[3];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 3;
                }
            }
            if (REVVETHTargetPool > pools[4]) {
                diff = AXSETHTargetPool - pools[4];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 4;
                }
            }
            if (MVITargetPool > pools[5]) {
                diff = MVITargetPool - pools[5];
                if (diff > furthest) {
                    furthest = diff;
                    farmIndex = 5;
                }
            }

            if (farmIndex == 0) investAXSETH(WETHAmt / 2);
            else if (farmIndex == 1) investSLPETH(WETHAmt / 2);
            else if (farmIndex == 2) investILVETH(WETHAmt / 2);
            else if (farmIndex == 3) investGHSTETH(WETHAmt / 2);
            else if (farmIndex == 4) investREVVETH(WETHAmt / 2);
            else investMVI(WETHAmt);
        }
    }

    function investAXSETH(uint WETHAmt) private {
        uint AXSAmt = sushiSwap(address(WETH), address(AXS), WETHAmt);
        (,,uint AXSETHLpAmt) = sushiRouter.addLiquidity(address(AXS), address(WETH), AXSAmt, WETHAmt, 0, 0, address(this), block.timestamp);
        AXSETHVault.deposit(AXSETHLpAmt);
    }

    function investSLPETH(uint WETHAmt) private {
        uint SLPAmt = uniV3Swap(address(WETH), address(SLP), 3000, WETHAmt);
        uniV3Router.increaseLiquidity(IUniV3Router.IncreaseLiquidityParams({
            tokenId: SLPETHTokenId,
            amount0Desired: SLPAmt,
            amount1Desired: WETHAmt,
            amount0Min: 0,
            amount1Min: 0,
            deadline: block.timestamp
        }));
    }

    function investILVETH(uint WETHAmt) private {
        uint ILVAmt = sushiSwap(address(WETH), address(ILV), WETHAmt);
        (,,uint ILVETHAmt) = sushiRouter.addLiquidity(address(ILV), address(WETH), ILVAmt, WETHAmt, 0, 0, address(this), block.timestamp);
        ILVETHVault.deposit(ILVETHAmt);
    }

    function investGHSTETH(uint WETHAmt) private {
        uint GHSTAmt = uniV3Swap(address(WETH), address(GHST), 10000, WETHAmt);
        uniV3Router.increaseLiquidity(IUniV3Router.IncreaseLiquidityParams({
            tokenId: GHSTETHTokenId,
            amount0Desired: GHSTAmt,
            amount1Desired: WETHAmt,
            amount0Min: 0,
            amount1Min: 0,
            deadline: block.timestamp
        }));
    }

    function investREVVETH(uint WETHAmt) private {
        uint REVVAmt = uniV2Swap(address(WETH), address(REVV), WETHAmt);
        uniV2Router.addLiquidity(address(REVV), address(WETH), REVVAmt, WETHAmt, 0, 0, address(this), block.timestamp);
    }

    function investMVI(uint WETHAmt) private {
        uniV2Swap(address(WETH), address(MVI), WETHAmt);
    }

    /// @param amount Amount to withdraw in USD
    function withdraw(uint amount) external onlyVault returns (uint WETHAmt){
        uint sharePerc = amount * 1e18 / getAllPoolInUSD(false);
        uint WETHAmtBefore = WETH.balanceOf(address(this));
        // withdrawAXSETH(sharePerc);
        // withdrawSLPETH(sharePerc);
        withdrawILVETH(sharePerc);
        // withdrawGHSTETH(sharePerc);
        withdrawREVVETH(sharePerc);
        withdrawMVI(sharePerc);
        WETHAmt = WETH.balanceOf(address(this)) - WETHAmtBefore;
        WETH.safeTransfer(vault, WETHAmt);
    }

    function withdrawAXSETH(uint sharePerc) private {
        uint AXSETHAmt = AXSETHVault.withdraw(AXSETHVault.balanceOf(address(this)) * sharePerc / 1e18);
        (uint AXSAmt,) = sushiRouter.removeLiquidity(address(AXS), address(WETH), AXSETHAmt, 0, 0, address(this), block.timestamp);
        sushiRouter.swapExactTokensForTokens(AXSAmt, 0, getPath(address(AXS), address(WETH)), address(this), block.timestamp);
    }

    function withdrawSLPETH(uint sharePerc) private {
        uint _SLPETHTokenId = SLPETHTokenId;
        (,,,,,,,uint128 SLPETHTotalAmt,,,,) = uniV3Router.positions(_SLPETHTokenId);
        uint128 SLPETHAmt = SLPETHTotalAmt * uint128(sharePerc) / 1e18;
        (uint SLPAmt,) = uniV3Router.decreaseLiquidity(IUniV3Router.DecreaseLiquidityParams({
            tokenId: _SLPETHTokenId,
            liquidity: SLPETHAmt,
            amount0Min: 0,
            amount1Min: 0,
            deadline: block.timestamp
        }));
        uniV3Swap(address(SLP), address(WETH), 3000, SLPAmt);
    }

    function withdrawILVETH(uint sharePerc) private {
        uint ILVETHAmt = ILVETHVault.withdraw(ILVETHVault.balanceOf(address(this)) * sharePerc / 1e18);
        (uint ILVAmt,) = sushiRouter.removeLiquidity(address(ILV), address(WETH), ILVETHAmt, 0, 0, address(this), block.timestamp);
        (sushiRouter.swapExactTokensForTokens(ILVAmt, 0, getPath(address(ILV), address(WETH)), address(this), block.timestamp))[1];
    }

    function withdrawGHSTETH(uint sharePerc) private {
        uint _GHSTETHTokenId = GHSTETHTokenId;
        (,,,,,,,uint128 GHSTETHTotalAmt,,,,) = uniV3Router.positions(_GHSTETHTokenId);
        uint128 GHSTETHAmt = GHSTETHTotalAmt * uint128(sharePerc) / 1e18;
        (uint GHSTAmt,) = uniV3Router.decreaseLiquidity(IUniV3Router.DecreaseLiquidityParams({
            tokenId: _GHSTETHTokenId,
            liquidity: GHSTETHAmt,
            amount0Min: 0,
            amount1Min: 0,
            deadline: block.timestamp
        }));
        uniV3Swap(address(GHST), address(WETH), 10000, GHSTAmt);
    }

    function withdrawREVVETH(uint sharePerc) private {
        uint REVVETHAmt = REVVETH.balanceOf(address(this)) * sharePerc / 1e18;
        (uint REVVAmt,) = uniV2Router.removeLiquidity(address(REVV), address(WETH), REVVETHAmt, 0, 0, address(this), block.timestamp);
        uniV2Router.swapExactTokensForTokens(REVVAmt, 0, getPath(address(REVV), address(WETH)), address(this), block.timestamp);
    }

    function withdrawMVI(uint sharePerc) private {
        uniV2Router.swapExactTokensForTokens(
            MVI.balanceOf(address(this)) * sharePerc / 1e18, 0, getPath(address(MVI), address(WETH)), address(this), block.timestamp
        );
    }

    function collectProfitAndUpdateWatermark() public onlyVault returns (uint fee) {
        uint currentWatermark = getAllPoolInUSD(false);
        uint lastWatermark = watermark;
        // console.log(currentWatermark);
        // console.log(lastWatermark);
        if (lastWatermark == 0) { // First invest or after emergency withdrawal
            watermark = currentWatermark;
        } else {
            if (currentWatermark > lastWatermark) {
                uint profit = currentWatermark - lastWatermark;
                fee = profit * 1 / 5; // 20%
                watermark = currentWatermark - fee;
            }
        }
    }

    /// @param signs True for positive, false for negative
    function adjustWatermark(uint amount, bool signs) external onlyVault {
        watermark = signs == true ? watermark + amount : watermark - amount;
    }

    /// @param amount Amount to reimburse to vault contract in ETH
    function reimburse(uint farmIndex, uint amount) external onlyOwnerOrAdmin returns (uint WETHAmt) {
        if (farmIndex == 0) withdrawAXSETH(amount * 1e18 / getAXSETHPool());
        else if (farmIndex == 1) withdrawSLPETH(amount * 1e18 / getSLPETHPool());
        else if (farmIndex == 2) withdrawILVETH(amount * 1e18 / getILVETHPool(false));
        else if (farmIndex == 3) withdrawGHSTETH(amount * 1e18 / getGHSTETHPool());
        else if (farmIndex == 4) withdrawREVVETH(amount * 1e18 / getREVVETHPool());
        else if (farmIndex == 5) withdrawMVI(amount * 1e18 / getMVIPool());
        WETHAmt = WETH.balanceOf(address(this));
        WETH.safeTransfer(vault, WETHAmt);
    }

    function emergencyWithdraw() external onlyOwnerOrAdmin {
        // 1e18 == 100% of share
        // withdrawAXSETH(1e18);
        // withdrawSLPETH(1e18);
        withdrawILVETH(1e18);
        // withdrawGHSTETH(1e18);
        withdrawREVVETH(1e18);
        withdrawMVI(1e18);
        WETH.safeTransfer(vault, WETH.balanceOf(address(this)));
        watermark = 0;
    }

    function sushiSwap(address from, address to, uint amount) private returns (uint) {
        address[] memory path = new address[](2);
        path[0] = from;
        path[1] = to;
        return (sushiRouter.swapExactTokensForTokens(amount, 0, path, address(this), block.timestamp))[1];
    }

    function uniV2Swap(address from, address to, uint amount) private returns (uint) {
        address[] memory path = new address[](2);
        path[0] = from;
        path[1] = to;
        return (uniV2Router.swapExactTokensForTokens(amount, 0, path, address(this), block.timestamp))[1];
    }

    function uniV3Swap(address tokenIn, address tokenOut, uint24 fee, uint amountIn) private returns (uint amountOut) {
        IUniV3Router.ExactInputSingleParams memory params =
            IUniV3Router.ExactInputSingleParams({
                tokenIn: tokenIn,
                tokenOut: tokenOut,
                fee: fee,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amountIn,
                amountOutMinimum: 0,
                sqrtPriceLimitX96: 0
            });
        amountOut = uniV3Router.exactInputSingle(params);
    }

    function setVault(address _vault) external onlyOwner {
        require(vault == address(0), "Vault set");
        vault = _vault;
    }

    function getPath(address tokenA, address tokenB) private pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;
    }

    function getETHPriceInUSD() private view returns (uint) {
        return uint(IChainlink(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419).latestAnswer()); // 8 decimals
    }

    function getAXSETHPool() private view returns (uint) {
        // return AXSETHVault.getAllPoolInETH();
        return 0;
    }

    function getSLPETHPool() private view returns (uint) {
        // return SLPETHVault.getAllPoolInETH();
        return 0;
    }

    function getILVETHPool(bool includeVestedILV) private view returns (uint) {
        return includeVestedILV ? 
            ILVETHVault.getAllPoolInETH(): 
            ILVETHVault.getAllPoolInETHExcludeVestedILV();
    }

    function getGHSTETHPool() private view returns (uint) {
        // return GHSTETHVault.getAllPoolInETH();
        return 0;
    }

    function getREVVETHPool() private view returns (uint) {
        uint REVVETHAmt = REVVETH.balanceOf(address(this));
        if (REVVETHAmt == 0) return 0;
        uint REVVPrice = (uniV2Router.getAmountsOut(1e18, getPath(address(REVV), address(WETH))))[1];
        (uint112 reserveREVV, uint112 reserveWETH,) = REVVETH.getReserves();
        uint totalReserve = reserveREVV * REVVPrice / 1e18 + reserveWETH;
        uint pricePerFullShare = totalReserve * 1e18 / REVVETH.totalSupply();
        return REVVETHAmt * pricePerFullShare / 1e18;
    }

    function getMVIPool() private view returns (uint) {
        uint MVIAmt = MVI.balanceOf(address(this));
        if (MVIAmt == 0) return 0;
        uint MVIPrice = (uniV2Router.getAmountsOut(1e18, getPath(address(MVI), address(WETH))))[1];
        return MVIAmt * MVIPrice / 1e18;
    }

    function getEachPool(bool includeVestedILV) private view returns (uint[] memory pools) {
        pools = new uint[](6);
        pools[0] = getAXSETHPool();
        pools[1] = getSLPETHPool();
        pools[2] = getILVETHPool(includeVestedILV);
        pools[3] = getGHSTETHPool();
        pools[4] = getREVVETHPool();
        pools[5] = getMVIPool();
    }

    /// @notice This function return only farms TVL in ETH
    function getAllPool(bool includeVestedILV) public view returns (uint) {
        uint[] memory pools = getEachPool(includeVestedILV);
        // console.log(pools[0] + pools[1] + pools[2] + pools[3] + pools[4] + pools[5]);
        // console.log(getETHPriceInUSD());
        return pools[0] + pools[1] + pools[2] + pools[3] + pools[4] + pools[5]; 
    }

    function getAllPoolInUSD(bool includeVestedILV) private view returns (uint) {
        uint ETHPriceInUSD = getETHPriceInUSD();
        // console.log(getAllPool(includeVestedILV) * ETHPriceInUSD / 1e8);
        return getAllPool(includeVestedILV) * ETHPriceInUSD / 1e8;
    }

    // function getAllPoolInUSD() external view returns (uint) {
    //     return getAllPoolInUSD(true);
    // }

    function getCurrentCompositionPerc() external view returns (uint[] memory percentages) {
        uint[] memory pools = getEachPool(false);
        uint allPool = pools[0] + pools[1] + pools[2] + pools[3] + pools[4] + pools[5];
        percentages = new uint[](6);
        percentages[0] = pools[0] * 10000 / allPool;
        percentages[1] = pools[1] * 10000 / allPool;
        percentages[2] = pools[2] * 10000 / allPool;
        percentages[3] = pools[3] * 10000 / allPool;
        percentages[4] = pools[4] * 10000 / allPool;
        percentages[5] = pools[5] * 10000 / allPool;
    }
}