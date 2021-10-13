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
    function userInfo(uint pid, address user) external view returns (uint amount, uint rewardDebt);
    function poolInfo(uint pid) external view returns (address lpToken, uint allocPoint, uint lastRewardBlock, uint accSushiPerShare);
    function pendingLyd(uint pid, address user) external view returns (uint);
}

interface IChainlink {
    function latestAnswer() external view returns (int256);
}

interface IWAVAX is IERC20Upgradeable {
    function withdraw(uint amount) external;
}

contract LydImpl is Initializable, ERC20Upgradeable, ReentrancyGuardUpgradeable, OwnableUpgradeable, PausableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;
    using SafeERC20Upgradeable for IPair;
    using SafeERC20Upgradeable for IWAVAX;

    IRouter constant lydRouter = IRouter(0xA52aBE4676dbfd04Df42eF7755F01A3c41f28D27);    
    IMasterChef constant masterChef = IMasterChef(0xFb26525B14048B7BB1F3794F6129176195Db7766);
    uint public poolId;

    IPair public lpToken;
    IERC20Upgradeable public token0;
    IERC20Upgradeable public token1;
    uint baseTokenDecimals;
    IWAVAX constant WAVAX = IWAVAX(0xB31f66AA3C1e785363F0875A1B74E27b85FD66c7); 
    IERC20Upgradeable constant LYD = IERC20Upgradeable(0x4C9B4E1AC6F24CdE3660D5E4Ef1eBF77C710C084);
    
    address public admin; 
    address public treasuryWallet;
    address public communityWallet;

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
    event SetTreasuryWallet(address treasuryWallet);
    event SetCommunityWallet(address communityWallet);
    event SetAdminWallet(address admin);
    event SetStrategistWallet(address strategistWallet);
    event SetAdmin(address admin);

    modifier onlyOwnerOrAdmin {
        require(msg.sender == owner() || msg.sender == address(admin), "Only owner or admin");
        _;
    }

    function initialize(
            string calldata name, string calldata symbol, uint _poolId,
            address _treasuryWallet, address _communityWallet, address _admin
        ) external initializer {
        __ERC20_init(name, symbol);
        __Ownable_init();

        treasuryWallet = _treasuryWallet;
        communityWallet = _communityWallet;
        admin = _admin;

        poolId = _poolId;
        (address _lpToken,,,) = masterChef.poolInfo(_poolId);
        lpToken = IPair(_lpToken);

        yieldFeePerc = 2000;
        depositFeePerc = 1000;

        token0 = IERC20Upgradeable(lpToken.token0());
        token1 = IERC20Upgradeable(lpToken.token1());
        address baseToken = address(token0) == address(WAVAX) ? address(token1) : address(token0);
        baseTokenDecimals = ERC20Upgradeable(baseToken).decimals();

        token0.safeApprove(address(lydRouter), type(uint).max);
        token1.safeApprove(address(lydRouter), type(uint).max);
        lpToken.safeApprove(address(lydRouter), type(uint).max);
        lpToken.safeApprove(address(masterChef), type(uint).max);
        if (address(token0) != address(LYD) && address(token1) != address(LYD)) {
            LYD.safeApprove(address(lydRouter), type(uint).max);
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

            uint fee = fees / 2;
            lpToken.safeTransfer(treasuryWallet, fee);
            lpToken.safeTransfer(communityWallet, fees - fee);
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
        masterChef.withdraw(poolId, 0); // To collect LYD
        uint lydBalance = LYD.balanceOf(address(this));
        uint WAVAXAmt = (lydRouter.swapExactTokensForTokens(
            lydBalance, 0, getPath(address(LYD), address(WAVAX)), address(this), block.timestamp
        ))[1];

        uint fee = WAVAXAmt * yieldFeePerc / 10000;
        WAVAX.withdraw(fee);
        WAVAXAmt = WAVAXAmt - fee;

        uint portionAVAX = address(this).balance / 2;
        (bool _a,) = admin.call{value: portionAVAX}("");
        require(_a, "Fee transfer failed");
        (bool _t,) = communityWallet.call{value: portionAVAX}("");
        require(_t, "Fee transfer failed");

        uint WAVAXAmtHalf = WAVAXAmt / 2;
        address baseToken = address(token0) == address(WAVAX) ? address(token1) : address(token0);
        uint baseTokenAmt = (lydRouter.swapExactTokensForTokens(
            WAVAXAmtHalf, 0, getPath(address(WAVAX), baseToken), address(this), block.timestamp
        ))[1];
        lydRouter.addLiquidity(address(baseToken), address(WAVAX), baseTokenAmt, WAVAXAmtHalf, 0, 0, address(this), block.timestamp);

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

    function setWhitelistAddress(address _addr, bool _status) external onlyOwnerOrAdmin {
        isWhitelisted[_addr] = _status;
        emit SetWhitelistAddress(_addr, _status);
    }

    function setFee(uint _yieldFeePerc, uint _depositFeePerc) external onlyOwner {
        yieldFeePerc = _yieldFeePerc;
        depositFeePerc = _depositFeePerc;
        emit SetFee(_yieldFeePerc, _depositFeePerc);
    }

    function setTreasuryWallet(address _treasuryWallet) external onlyOwner {
        treasuryWallet = _treasuryWallet;
        emit SetTreasuryWallet(_treasuryWallet);
    }

    function setCommunityWallet(address _communityWallet) external onlyOwner {
        communityWallet = _communityWallet;
        emit SetCommunityWallet(_communityWallet);
    }

    function setAdmin(address _admin) external onlyOwner {
        admin = _admin;
        emit SetAdmin(_admin);
    }

    function getPath(address tokenA, address tokenB) private pure returns (address[] memory path) {
        path = new address[](2);
        path[0] = tokenA;
        path[1] = tokenB;
    }

    function getLpTokenPriceInAVAX() private view returns (uint) {
        address baseToken;
        uint reserveBaseToken;
        uint reserveWAVAX;

        (uint112 reserveToken0, uint112 reserveToken1,) = lpToken.getReserves();
        if (address(token0) == address(WAVAX)) {
            baseToken = address(token1);
            reserveWAVAX = reserveToken0;
            reserveBaseToken = reserveToken1;
        } else {
            baseToken = address(token0);
            reserveWAVAX = reserveToken1;
            reserveBaseToken = reserveToken0;
        }

        uint _baseTokenDecimals = baseTokenDecimals;
        uint baseTokenPriceInAVAX = (lydRouter.getAmountsOut(10 ** _baseTokenDecimals, getPath(baseToken, address(WAVAX))))[1];
        uint totalReserveInAVAX = reserveBaseToken * baseTokenPriceInAVAX / 10 ** _baseTokenDecimals + reserveWAVAX;
        return totalReserveInAVAX * 1e18 / lpToken.totalSupply();
    }

    function getLpTokenPriceInUSD() private view returns (uint) {
        uint AVAXPriceInUSD = uint(IChainlink(0x0A77230d17318075983913bC2145DB16C7366156).latestAnswer()); // 8 decimals
        return getLpTokenPriceInAVAX() * AVAXPriceInUSD / 1e8;
    }

    /// @return Pending rewards in LYD token
    /// @dev Rewards also been claimed while deposit or withdraw through masterChef contract
    function getPendingRewards() external view returns (uint) {
        uint pendingRewards = masterChef.pendingLyd(poolId, address(this));
        return pendingRewards + LYD.balanceOf(address(this));
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
