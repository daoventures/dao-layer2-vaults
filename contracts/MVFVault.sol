// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "../libs/BaseRelayRecipient.sol";
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

interface IStrategy {
    function invest(uint amount) external;
    function withdraw(uint sharePerc) external;
    function collectProfit() external returns (uint);
    function reimburse(uint farmIndex, uint sharePerc) external returns (uint);
    function emergencyWithdraw() external;
    function reinvest() external;
    function getAllPool(bool includeVestedILV) external view returns (uint);

}

contract MVFVault is Initializable, ERC20Upgradeable, OwnableUpgradeable, 
        ReentrancyGuardUpgradeable, PausableUpgradeable, BaseRelayRecipient {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for IWETH;
    using SafeERC20Upgradeable for IPair;

    IERC20Upgradeable constant USDT = IERC20Upgradeable(0xdAC17F958D2ee523a2206206994597C13D831ec7);
    IERC20Upgradeable constant USDC = IERC20Upgradeable(0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48);
    IERC20Upgradeable constant DAI = IERC20Upgradeable(0x6B175474E89094C44Da98b954EedeAC495271d0F);
    IWETH constant WETH = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    IRouter constant sushiRouter = IRouter(0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F); // Sushi
    IStrategy public strategy;

    uint[] public networkFeeTier2;
    uint public customNetworkFeeTier;
    uint[] public networkFeePerc;
    uint public customNetworkFeePerc;

    uint[] public percKeepInVault;
    uint public fees;

    address public treasuryWallet;
    address public communityWallet;
    address public strategist;
    address public admin;

    // event here

    modifier onlyEOA {
        require(msg.sender == tx.origin, "Only EOA");
        _;
    }

    modifier onlyOwnerOrAdmin {
        require(msg.sender == owner() || msg.sender == address(admin), "Only owner or admin");
        _;
    }

    function initialize(
        address _strategy,
        address _treasuryWallet, address _communityWallet, address _admin, address _strategist,
        address _biconomy
    ) external initializer {
        __Ownable_init();

        strategy = IStrategy(_strategy);

        treasuryWallet = _treasuryWallet;
        communityWallet = _communityWallet;
        admin = _admin;
        strategist = _strategist;
        trustedForwarder = _biconomy;

        networkFeeTier2 = [50000*1e18+1, 100000*1e18];
        customNetworkFeeTier = 1000000*1e18;
        networkFeePerc = [100, 75, 50];
        // networkFeePerc = [0, 75, 50];
        customNetworkFeePerc = 25;

        // percKeepInVault = [200, 200, 200]; // USDT, USDC, DAI
        percKeepInVault = [0, 0, 0];

        USDT.safeApprove(address(sushiRouter), type(uint).max);
        USDC.safeApprove(address(sushiRouter), type(uint).max);
        DAI.safeApprove(address(sushiRouter), type(uint).max);
        WETH.safeApprove(address(sushiRouter), type(uint).max);
        WETH.safeApprove(address(strategy), type(uint).max);
    }

    function deposit(uint amount, IERC20Upgradeable token) external onlyEOA nonReentrant whenNotPaused {
        require(amount > 0, "Amount must > 0");

        uint pool = getAllPoolInUSD(true);
        token.safeTransferFrom(msg.sender, address(this), amount);

        if (token == USDT || token == USDC) amount = amount * 1e12;

        uint _networkFeePerc;
        if (amount < networkFeeTier2[0]) _networkFeePerc = networkFeePerc[0]; // Tier 1
        else if (amount <= networkFeeTier2[1]) _networkFeePerc = networkFeePerc[1]; // Tier 2
        else if (amount < customNetworkFeeTier) _networkFeePerc = networkFeePerc[2]; // Tier 3
        else _networkFeePerc = customNetworkFeePerc; // Custom Tier
        uint fee = amount * _networkFeePerc / 10000;
        fees = fees + fee;
        amount = amount - fee;

        uint _totalSupply = totalSupply();
        uint share = _totalSupply == 0 ? amount : amount * _totalSupply / pool;
        _mint(msg.sender, share);
    }

    function withdraw(uint share, IERC20Upgradeable token) external onlyEOA nonReentrant {
        require(share > 0, "Shares must > 0");
        require(share <= balanceOf(msg.sender), "Not enough share to withdraw");

        uint _totalSupply = totalSupply();
        uint withdrawAmt = getAllPoolInUSD(false) * share / _totalSupply;
        _burn(msg.sender, share);

        uint tokenAmtInVault = token.balanceOf(address(this));
        if (token == USDT || token == USDC) tokenAmtInVault = tokenAmtInVault * 1e12;
        if (withdrawAmt <= tokenAmtInVault) {
            if (token == USDT || token == USDC) withdrawAmt = withdrawAmt / 1e12;
            token.safeTransfer(msg.sender, withdrawAmt);
        } else {
            if (!paused()) {
                uint WETHAmtBefore = WETH.balanceOf(address(this));
                strategy.withdraw(withdrawAmt);
                uint WETHAmtAfter = WETH.balanceOf(address(this));
                withdrawAmt = (sushiRouter.swapExactTokensForTokens(
                    WETHAmtAfter - WETHAmtBefore, 0, getPath(address(WETH), address(token)), msg.sender, block.timestamp
                ))[1];
            } else {
                uint sharePerc = share * 1e18 / _totalSupply;
                withdrawAmt = (sushiRouter.swapExactTokensForTokens(
                    WETH.balanceOf(address(this)) * sharePerc / 1e18, 0, getPath(address(WETH), address(token)), msg.sender, block.timestamp
                ))[1];
            }
        }
        // emit withdrawAmt
    }

    function invest() public whenNotPaused {
        require(
            msg.sender == address(this) ||
            msg.sender == owner() ||
            msg.sender == admin, "Only authorized caller"
        );

        collectProfit();
        (uint USDTAmt, uint USDCAmt, uint DAIAmt) = transferOutFees();

        uint WETHAmt = swapTokenToWETH(USDTAmt, USDCAmt, DAIAmt);
        strategy.invest(WETHAmt);
    }

    function swapTokenToWETH(uint USDTAmt, uint USDCAmt, uint DAIAmt) private returns (uint WETHAmt) {
        uint[] memory _percKeepInVault = percKeepInVault;
        if (USDTAmt > 1e6) {
            USDTAmt = USDTAmt - USDTAmt * _percKeepInVault[0] / 10000;
            WETHAmt = sushiSwap(address(USDT), address(WETH), USDTAmt);
        }
        if (USDCAmt > 1e6) {
            USDCAmt = USDCAmt - USDCAmt * _percKeepInVault[1] / 10000;
            uint _WETHAmt = sushiSwap(address(USDC), address(WETH), USDCAmt);
            WETHAmt = WETHAmt + _WETHAmt;
        }
        if (DAIAmt > 1e18) {
            DAIAmt = DAIAmt - DAIAmt * _percKeepInVault[2] / 10000;
            uint _WETHAmt = sushiSwap(address(DAI), address(WETH), DAIAmt);
            WETHAmt = WETHAmt + _WETHAmt;
        }
    }

    function collectProfit() public {
        require(
            msg.sender == address(this) ||
            msg.sender == owner() ||
            msg.sender == admin, "Only authorized caller"
        );
        uint profit = strategy.collectProfit();
        fees = fees + profit;
    }

    function transferOutFees() public returns (uint USDTAmt, uint USDCAmt, uint DAIAmt) {
        require(
            msg.sender == address(this) ||
            msg.sender == owner() ||
            msg.sender == admin, "Only authorized caller"
        );

        USDTAmt = USDT.balanceOf(address(this));
        USDCAmt = USDC.balanceOf(address(this));
        DAIAmt = DAI.balanceOf(address(this));
        uint _fees = fees;

        if (_fees != 0) {
            // TODO: transfer out fees 
            IERC20Upgradeable token;
            if (USDTAmt * 1e12 > _fees) {
                token = USDT;
                USDTAmt = USDTAmt - _fees / 1e12;
                _fees = _fees / 1e12;
            } else if (USDCAmt * 1e12 > _fees) {
                token = USDC;
                USDCAmt = USDCAmt - _fees / 1e12;
                _fees = _fees / 1e12;
            } else if (DAIAmt > _fees) {
                token = DAI;
                DAIAmt = DAIAmt - _fees;
            } else return (USDTAmt, USDCAmt, DAIAmt);

            uint _fee = _fees * 2 / 5; // 40%
            token.safeTransfer(treasuryWallet, _fee); // 40%
            token.safeTransfer(communityWallet, _fee); // 40%
            token.safeTransfer(strategist, _fees - _fee - _fee); // 20%

            fees = 0;
            // emit TransferredOutFees(_fees); // Decimal follow _token
        }
    }

    /// @param amount Amount to reimburse (decimal follow token)
    function reimburse(uint farmIndex, address token, uint amount) external onlyOwnerOrAdmin {
        uint WETHAmt;
        WETHAmt = (sushiRouter.getAmountsOut(amount, getPath(token, address(WETH))))[1];
        WETHAmt = strategy.reimburse(farmIndex, WETHAmt);
        sushiSwap(address(WETH), token, WETHAmt);
    }

    function emergencyWithdraw() external onlyOwnerOrAdmin {
        _pause();
        strategy.emergencyWithdraw();
    }

    function reinvest() external onlyOwnerOrAdmin {
        _unpause();
        invest();
    }

    function sushiSwap(address from, address to, uint amount) private returns (uint) {
        address[] memory path = new address[](2);
        path[0] = from;
        path[1] = to;
        return (sushiRouter.swapExactTokensForTokens(amount, 0, path, address(this), block.timestamp))[1];
    }

    function _msgSender() internal override(ContextUpgradeable, BaseRelayRecipient) view returns (address) {
        return BaseRelayRecipient._msgSender();
    }
    
    function versionRecipient() external pure override returns (string memory) {
        return "1";
    }

    function getPath(address tokenA, address tokenB) private pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;
    }

    function getETHPriceInUSD() private view returns (uint) {
        return uint(IChainlink(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419).latestAnswer()); // 8 decimals
    }

    /// @notice This function return only farms TVL in ETH
    function getAllPool(bool includeVestedILV) public view returns (uint) {
        return strategy.getAllPool(includeVestedILV); 
    }

    function getAllPoolInUSD(bool includeVestedILV) private view returns (uint) {
        uint ETHPriceInUSD = getETHPriceInUSD();
        if (paused()) return WETH.balanceOf(address(this)) * ETHPriceInUSD / 1e8;
        uint strategyPoolInUSD = strategy.getAllPool(includeVestedILV) * ETHPriceInUSD / 1e8;

        uint tokenKeepInVault = USDT.balanceOf(address(this)) * 1e12 +
            USDC.balanceOf(address(this)) * 1e12 + DAI.balanceOf(address(this));
        
        return strategyPoolInUSD + tokenKeepInVault - fees;
    }

    function getAllPoolInUSD() external view returns (uint) {
        return getAllPoolInUSD(true);
    }

    /// @notice Can be use for calculate both user shares & APR    
    function getPricePerFullShare() external view returns (uint) {
        return getAllPoolInUSD(true) * 1e18 / totalSupply();
    }
}