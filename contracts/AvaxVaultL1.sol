//SPDX-License-Identifier: MIT
pragma solidity 0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

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

    function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts);
}

interface IPair is IERC20Upgradeable {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
}

interface IMasterChef {
    function deposit(uint pid, uint amount) external;
    function withdraw(uint pid, uint amount) external;
    function userInfo(uint pid, address account) external view returns (uint amount, uint rewardDebt);
    function poolInfo(uint pid) external view returns (address lpToken, uint allocPoint, uint lastRewardBlock, uint accJOEPerShare);
    function pendingTokens(uint pid, address account) external view returns (uint);
}

interface IChainlink {
    function latestAnswer() external view returns (int256);
}

interface IWAVAX is IERC20Upgradeable {
    function withdraw(uint amount) external;
}

contract AvaxVaultL1 is Initializable, ERC20Upgradeable,
    ReentrancyGuardUpgradeable, OwnableUpgradeable, PausableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for IPair;
    using SafeERC20Upgradeable for IWAVAX;

    IRouter constant router = IRouter(0x60aE616a2155Ee3d9A68541Ba4544862310933d4);
    IMasterChef constant masterChef = IMasterChef(0xd6a4F121CA35509aF06A0Be99093d08462f53052);
    uint public poolId;

    IPair public lpToken;
    IERC20Upgradeable public token0;
    IERC20Upgradeable public token1;
    uint token0Decimal;
    uint token1Decimal;
    IWAVAX constant WAVAX = IWAVAX(0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7); 
    IERC20Upgradeable constant JOE = IERC20Upgradeable(0x6e84a6216eA6dACC71eE8E6b0a5B7322EEbC0fDd);
    
    address public treasuryWallet;
    address public communityWallet;
    address public strategist;
    address public admin; 

    uint public yieldFeePerc;
    uint public depositFeePerc;

    mapping(address => bool) public isWhitelisted;
    mapping(address => uint) private depositedBlock;

    event Deposit(address caller, uint amtDeposited, uint sharesMinted);
    event Withdraw(address caller, uint amtWithdrawed, uint sharesBurned);
    event Invest(uint amtInvested);
    event Yield(uint amount);
    event EmergencyWithdraw(uint amtTokenWithdrawed);
    event SetWhitelistAddress(address _address, bool status);
    event SetFee(uint _yieldFeePerc, uint _depositFeePerc);
    event SetAddresses(address treasuryWallet, address communityWallet, address admin);
    event SetStrategist(address strategist);
    event SetAdmin(address admin);

    modifier onlyOwnerOrAdmin {
        require(msg.sender == owner() || msg.sender == address(admin), "Only owner or admin");
        _;
    }

    function initialize(
            string calldata name, string calldata symbol, uint _poolId,
            address _treasuryWallet, address _communityWallet, address _strategist, address _admin
    ) external initializer {
        __ERC20_init(name, symbol);
        __Ownable_init();

        poolId = _poolId;
        (address _lpToken,,,) = masterChef.poolInfo(_poolId);
        lpToken = IPair(_lpToken);
        token0 = IERC20Upgradeable(lpToken.token0());
        token1 = IERC20Upgradeable(lpToken.token1());
        token0Decimal = ERC20Upgradeable(address(token0)).decimals();
        token1Decimal = ERC20Upgradeable(address(token1)).decimals();

        treasuryWallet = _treasuryWallet;
        communityWallet = _communityWallet;
        strategist = _strategist;
        admin = _admin;

        yieldFeePerc = 2000;
        depositFeePerc = 1000;

        token0.safeApprove(address(router), type(uint).max);
        token1.safeApprove(address(router), type(uint).max);
        lpToken.safeApprove(address(router), type(uint).max);
        lpToken.safeApprove(address(masterChef), type(uint).max);
        if (address(JOE) != address(token0) && address(JOE) != address(token1)) {
            JOE.safeApprove(address(router), type(uint).max);
        }
        if (address(token0) != address(WAVAX) && address(token1) != address(WAVAX)) {
            WAVAX.safeApprove(address(router), type(uint).max);
        }
    }

    function deposit(uint amount) external nonReentrant whenNotPaused {
        require(amount > 0, "Amount must > 0");
        uint amtDeposit = amount;

        uint pool = getAllPool();
        lpToken.safeTransferFrom(msg.sender, address(this), amount);
        depositedBlock[msg.sender] = block.number;

        if (!isWhitelisted[msg.sender]) {
            uint fees = amount * depositFeePerc / 10000;
            amount = amount - fees;

            uint fee = fees * 2 / 5; // 40%
            lpToken.safeTransfer(treasuryWallet, fee);
            lpToken.safeTransfer(communityWallet, fee);
            lpToken.safeTransfer(strategist, fees - fee - fee);
        }

        uint _totalSupply = totalSupply();
        uint share = _totalSupply == 0 ? amount : amount * _totalSupply / pool;
        _mint(msg.sender, share);

        emit Deposit(msg.sender, amtDeposit, share);
    }

    function withdraw(uint share) external nonReentrant returns (uint withdrawAmt) {
        require(share > 0, "Share must > 0");
        require(share <= balanceOf(msg.sender), "Not enough shares to withdraw");
        require(depositedBlock[msg.sender] != block.number, "Withdraw within same block");

        uint lpTokenBalInVault = lpToken.balanceOf(address(this));
        (uint lpTokenBalInFarm,) = masterChef.userInfo(poolId, address(this));
        withdrawAmt = (lpTokenBalInVault + lpTokenBalInFarm) * share / totalSupply();
        _burn(msg.sender, share);

        if (withdrawAmt > lpTokenBalInVault) {
            uint amtToWithdraw = withdrawAmt - lpTokenBalInVault;
            masterChef.withdraw(poolId, amtToWithdraw);
        }

        lpToken.safeTransfer(msg.sender, withdrawAmt);

        emit Withdraw(msg.sender, withdrawAmt, share);
    }

    function invest() public onlyOwnerOrAdmin whenNotPaused {
        masterChef.deposit(poolId, lpToken.balanceOf(address(this)));
    }

    function yield() external onlyOwnerOrAdmin whenNotPaused {
        masterChef.withdraw(poolId, 0);

        uint WAVAXAmt = (router.swapExactTokensForTokens(
            JOE.balanceOf(address(this)), 0,
            getPath(address(JOE), address(WAVAX)), address(this), block.timestamp
        ))[1];

        uint fee = WAVAXAmt * yieldFeePerc / 10000;
        WAVAX.withdraw(fee);
        WAVAXAmt = WAVAXAmt - fee;

        uint portionAVAX = address(this).balance * 2 / 5; // 40%
        (bool _a,) = admin.call{value: portionAVAX}("");
        require(_a, "Fee transfer failed");
        (bool _t,) = communityWallet.call{value: portionAVAX}("");
        require(_t, "Fee transfer failed");
        (bool _s,) = strategist.call{value: (address(this).balance)}("");
        require(_s, "Fee transfer failed");

        uint token0Amt;
        uint token1Amt;
        uint halfWAVAXAmt = WAVAXAmt / 2;
        if (token0 == WAVAX) {
            token1Amt = swap(address(WAVAX), address(token1), halfWAVAXAmt);
            token0Amt = halfWAVAXAmt;
        } else if (token1 == WAVAX) {
            token0Amt = swap(address(WAVAX), address(token0), halfWAVAXAmt);
            token1Amt = halfWAVAXAmt;
        } else {
            token0Amt = swap(address(WAVAX), address(token0), halfWAVAXAmt);
            token1Amt = swap(address(WAVAX), address(token1), halfWAVAXAmt);
        }

        router.addLiquidity(address(token0), address(token1), token0Amt, token1Amt, 0, 0, address(this), block.timestamp);

        emit Yield(WAVAXAmt);
    }

    receive() external payable {}

    function emergencyWithdraw() external onlyOwnerOrAdmin {
        _pause();

        (uint lpTokenAmtInFarm,) = masterChef.userInfo(poolId, address(this));
        if (lpTokenAmtInFarm > 0) {
            masterChef.withdraw(poolId, lpTokenAmtInFarm);
        }

        emit EmergencyWithdraw(lpTokenAmtInFarm);
    }

    function reinvest() external onlyOwnerOrAdmin whenPaused {
        _unpause();

        invest();
    }

    function swap(address from, address to, uint amount) private returns (uint) {
        return router.swapExactTokensForTokens(amount, 0, getPath(from, to), address(this), block.timestamp)[1];
    }

    function setWhitelistAddress(address _addr, bool _status) external onlyOwnerOrAdmin {
        isWhitelisted[_addr] = _status;
        emit SetWhitelistAddress(_addr, _status);
    }

    function setFee(uint _yieldFeePerc, uint _depositFeePerc) external onlyOwner {
        yieldFeePerc = _yieldFeePerc;
        depositFeePerc = _depositFeePerc;
        emit SetFee(_yieldFeePerc, _depositFeePerc);
    }

    function setAddresses(address _treasuryWallet, address _communityWallet, address _admin) external onlyOwner {
        treasuryWallet = _treasuryWallet;
        communityWallet = _communityWallet;
        admin = _admin;

        emit SetAddresses(_treasuryWallet, _communityWallet, _admin);
    }

    function setStrategist(address _strategist) external onlyOwner {
        require(
            msg.sender == address(strategist) ||
            msg.sender == address(admin) ||
            msg.sender == owner(), "Not authorized"
        );
        
        strategist = _strategist;

        emit SetStrategist(_strategist);
    }

    function getPath(address tokenA, address tokenB) private pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;
    }

    function getLpTokenPriceInAVAX() private view returns (uint) {
        (uint112 reserveToken0, uint112 reserveToken1,) = lpToken.getReserves();

        uint totalReserveTokenInAVAX;
        if (token0 == WAVAX) {
            uint token1PriceInAVAX = router.getAmountsOut(10 ** token1Decimal, getPath(address(token1), address(WAVAX)))[1];
            uint reserveToken1InAVAX = reserveToken1 * token1PriceInAVAX / 10 ** token1Decimal;
            totalReserveTokenInAVAX = reserveToken0 + reserveToken1InAVAX;
        } else if (token1 == WAVAX) {
            uint token0PriceInAVAX = router.getAmountsOut(10 ** token0Decimal, getPath(address(token0), address(WAVAX)))[1];
            uint reserveToken0InAVAX = reserveToken0 * token0PriceInAVAX / 10 ** token0Decimal;
            totalReserveTokenInAVAX = reserveToken1 + reserveToken0InAVAX;
        } else {
            uint token0PriceInAVAX = router.getAmountsOut(10 ** token0Decimal, getPath(address(token0), address(WAVAX)))[1];
            uint reserveToken0InAVAX = reserveToken0 * token0PriceInAVAX / 10 ** token0Decimal;

            uint token1PriceInAVAX = router.getAmountsOut(10 ** token1Decimal, getPath(address(token1), address(WAVAX)))[1];
            uint reserveToken1InAVAX = reserveToken1 * token1PriceInAVAX / 10 ** token1Decimal;

            totalReserveTokenInAVAX = reserveToken0InAVAX + reserveToken1InAVAX;
        }

        return totalReserveTokenInAVAX * 1e18 / lpToken.totalSupply();
    }

    function getLpTokenPriceInUSD() private view returns (uint) {
        uint AVAXPriceInUSD = uint(IChainlink(0x0A77230d17318075983913bC2145DB16C7366156).latestAnswer()); // 8 decimals
        require(AVAXPriceInUSD != 0, "ChainLink error");
        return getLpTokenPriceInAVAX() * AVAXPriceInUSD / 1e8;
    }

    /// @return Pending rewards in JOE
    /// @dev Rewards also been claimed while deposit or withdraw through masterChef contract
    function getPendingRewards() external view returns (uint) {
        return masterChef.pendingTokens(poolId, address(this)) + JOE.balanceOf(address(this));
    }

    function getAllPool() public view returns (uint) {
        (uint lpTokenAmtInFarm, ) = masterChef.userInfo(poolId, address(this));
        return lpToken.balanceOf(address(this)) + lpTokenAmtInFarm;
    }

    function getAllPoolInAVAX() public view returns (uint) {
        return getAllPool() * getLpTokenPriceInAVAX() / 1e18;
    }

    function getAllPoolInUSD() public view returns (uint) {
        return getAllPool() * getLpTokenPriceInUSD() / 1e18;
    }

    /// @param inUSD true for calculate user share in USD, false for calculate APR
    function getPricePerFullShare(bool inUSD) external view returns (uint) {
        uint _totalSupply = totalSupply();
        if (_totalSupply == 0) return 0;
        return inUSD == true ?
            getAllPoolInUSD() * 1e18 / _totalSupply :
            getAllPool() * 1e18 / _totalSupply;
    }
}