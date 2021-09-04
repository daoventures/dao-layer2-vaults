//SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "hardhat/console.sol";

// import "@uniswap/v3-periphery/contracts/libraries/LiquidityAmounts.sol";
// import "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
// import "@uniswap/v3-core/contracts/libraries/TickMath.sol";
// import "@uniswap/v3-core/contracts/interfaces/pool/IUniswapV3PoolState.sol";
// import "@uniswap/v3-periphery/contracts/interfaces/INonfungiblePositionManager.sol";

interface INonfungiblePositionManager {
    struct MintParams {
        address token0;
        address token1;
        uint24 fee;
        int24 tickLower;
        int24 tickUpper;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        address recipient;
        uint256 deadline;
    }
    function mint(
        MintParams memory params
    ) external returns (uint256 tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);

    struct IncreaseLiquidityParams {
        uint256 tokenId;
        uint256 amount0Desired;
        uint256 amount1Desired;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }
    function increaseLiquidity(
        IncreaseLiquidityParams memory params
    ) external returns (uint128 liquidity, uint256 amount0, uint256 amount1);

    struct DecreaseLiquidityParams {
        uint256 tokenId;
        uint128 liquidity;
        uint256 amount0Min;
        uint256 amount1Min;
        uint256 deadline;
    }
    function decreaseLiquidity(
        DecreaseLiquidityParams memory params
    ) external returns (uint256 amount0, uint256 amount1);

    struct CollectParams {
        uint256 tokenId;
        address recipient;
        uint128 amount0Max;
        uint128 amount1Max;
    }
    function collect(
        CollectParams memory params
    ) external returns (uint256 amount0, uint256 amount1);

    function positions(uint256 tokenId) external view returns (
        uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper,
        uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1
    );
}

interface IUniswapV3Pool {
    function token0() external view returns (address);
    function token1() external view returns (address);
    function fee() external view returns (uint24);
    function tickSpacing() external view returns (int24);
}

interface IChainlink {
    function latestAnswer() external view returns (int256);
}

contract UniswapV3 is Initializable, ERC20Upgradeable, ReentrancyGuardUpgradeable, OwnableUpgradeable, PausableUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    IERC20Upgradeable public token0;
    IERC20Upgradeable public token1;
    IERC20Upgradeable private constant WETH = IERC20Upgradeable(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2); 

    INonfungiblePositionManager private constant nonfungiblePositionManager = INonfungiblePositionManager(0xC36442b4a4522E871399CD717aBDD847Ab11FE88);
    // IUniswapV3PoolState public UniswapPool;

    // ISwapRouter public constant Router  = ISwapRouter(0xE592427A0AEce92De3Edee1F18E0157C05861564);

    uint depositFeePerc;
    uint yieldFeePerc;
    uint vaultPositionTokenId;
    uint totalLiquidity; 
    uint private _feeToken0;
    uint private _feeToken1;

    uint24 poolFee; // uni v3 pool fee //3000 - 0.3 % fee tier

    int24 lowerTick;
    int24 upperTick;

    address public admin;
    address public treasury;
    address public communityWallet;
    address public strategist;

    mapping(uint => address) positionOwner;

    modifier onlyOwnerOrAdmin {
        require(msg.sender == owner() || msg.sender == address(admin), "Only owner or admin");
        _;
    }

    ///@dev _token0, _token1 should be same as in uniswap pool
    // function initialize(IERC20Upgradeable _token0, IERC20Upgradeable _token1, IUniswapV3PoolState _UniswapPool,
    //     address _admin, address _communityWallet, address _treasury, address _strategist, 
    //     uint24 _uniPoolFee, int24 _lowerTick, int24 _upperTick) external initializer {
    function initialize(
        string calldata name, string calldata symbol, IUniswapV3Pool uniswapV3Pool,
        address _treasury, address _communityWallet, address _strategist, address _admin
    ) external initializer {
        __ERC20_init(name, symbol);
        __Ownable_init();

        token0 = IERC20Upgradeable(uniswapV3Pool.token0());
        token1 = IERC20Upgradeable(uniswapV3Pool.token1());
        poolFee = uniswapV3Pool.fee();
        int24 tickspacing = uniswapV3Pool.tickSpacing();
        // console.log(uint24(tickspacing));
        lowerTick = (-887272 / tickspacing) * tickspacing; // Min tick
        upperTick = (887272 / tickspacing) * tickspacing; // Max tick
        // console.log(uint24(lowerTick));
        // console.log(uint24(upperTick));

        depositFeePerc = 1000;
        yieldFeePerc = 5000;

        // UniswapPool = _UniswapPool;
        admin = _admin;
        treasury = _treasury;
        communityWallet = _communityWallet;
        strategist = _strategist;

        IERC20Upgradeable(token0).approve( address(nonfungiblePositionManager), type(uint).max);
        IERC20Upgradeable(token1).approve( address(nonfungiblePositionManager), type(uint).max);
        // _token0.approve(address(Router), type(uint).max);
        // _token1.approve(address(Router), type(uint).max);
    }

    function deposit(uint amount0, uint amount1) external nonReentrant {
        require(amount0 > 0 && amount1 > 0, "Amount < 0");

        token0.safeTransferFrom(msg.sender, address(this), amount0);
        token1.safeTransferFrom(msg.sender, address(this), amount1);
        // depositedBlock[msg.sender] = block.number;

        // if (!isWhitelisted[msg.sender]) {
        //     uint fee0 = amount0 * depositFee / 10000;
        //     amount0 = amount0 - fee0;
        //     uint fees1 = amount1 * depositFee / 10000;
        //     amount1 = amount1 - fee1;

        //     uint portionFee0 = fee0 * 2 / 5; // 40%
        //     token0.safeTransfer(treasuryWallet, portionFee0); // 40%
        //     token0.safeTransfer(communityWallet, portionFee0); // 40%
        //     token0.safeTransfer(strategist, fee0 - portionFee0 - portionFee0); // 20%

        //     uint portionFee1 = fee1 * 2 / 5;
        //     token1.safeTransfer(treasuryWallet, portionFee1);
        //     token1.safeTransfer(communityWallet, portionFee1);
        //     token1.safeTransfer(strategist, fee1 - portionFee1 - portionFee1);
        // }

        uint amtLiquidity = addLiquidity(amount0, amount1);

        (,,,,,,, uint128 pool,,,,) = nonfungiblePositionManager.positions(vaultPositionTokenId);
        uint _totalSupply = totalSupply();
        uint share = _totalSupply == 0 ? amtLiquidity : amtLiquidity * _totalSupply / pool;
        _mint(msg.sender, share);
    }

    function withdraw(uint share) external nonReentrant returns (uint amount0, uint amount1) {
        require(share > 0, "Share must > 0");

        (,,,,,,, uint128 pool,,,,) = nonfungiblePositionManager.positions(vaultPositionTokenId);
        uint amtliquidity = share * pool / totalSupply();
        _burn(msg.sender, share);

        INonfungiblePositionManager.DecreaseLiquidityParams memory params =
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: vaultPositionTokenId,
                liquidity: uint128(amtliquidity),
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp
            });
        (amount0, amount1) = nonfungiblePositionManager.decreaseLiquidity(params);
        console.log("---");
        console.log(token0.balanceOf(address(this)));
        console.log(token1.balanceOf(address(this)));

        // token0.safeTransfer(msg.sender, amount0);
        token1.safeTransfer(msg.sender, amount1);
    }

    function yield() external onlyOwnerOrAdmin { 
        INonfungiblePositionManager.CollectParams memory collectParams =
            INonfungiblePositionManager.CollectParams({
                tokenId: vaultPositionTokenId,
                recipient: address(this),
                amount0Max: type(uint128).max,
                amount1Max: type(uint128).max
            });
        (uint amt0Collected, uint amt1Collected) =  nonfungiblePositionManager.collect(collectParams);

        if(amt0Collected > 0 && amt1Collected > 0) {
            // _calcFee(amt0Collected, amt0Collected, 1);

            // (uint _amt0, uint _amt1 ) = _available();
            // uint _liquidityAdded = addLiquidity(_amt0, _amt1);
            // totalLiquidity = totalLiquidity + _liquidityAdded;
            // _transferFee();
        }
    }

    function changeTicks(int24 _upper, int24 _lower) external onlyOwnerOrAdmin {

        (uint _amt0, uint _amt1) = _decreaseLiquidity(totalLiquidity);

        (_amt0, _amt1) = _collect(_amt0, _amt1);

        lowerTick = _lower;
        upperTick = _upper;
        
        vaultPositionTokenId = 0;
        uint _liquidity = addLiquidity(_amt0, _amt1);
         
        totalLiquidity = _liquidity;
    }

    function setTreasury(address _treasury) external onlyOwner {
        treasury = _treasury;
    }

    function setCommunityWallet(address _communityWallet) external onlyOwner {
        communityWallet = _communityWallet;
    }

    function setStrategist(address _strategist) external onlyOwner {
        strategist = _strategist;
    }

    function setAdmin(address _admin) external onlyOwner {
        admin = _admin;
    }

    function setFee(uint _depositFeePerc, uint _yieldFeePerc) external onlyOwner {
        depositFeePerc = _depositFeePerc; //deposit fee
        yieldFeePerc =_yieldFeePerc; //yield Fee
    }

    // function transferFee() external onlyOwnerOrAdmin {
    //     _transferFee();
    // }

    // function _swap(address _source, address _target, uint _sourceAmount) internal returns (uint _outAmount) {
    //     ISwapRouter.ExactInputSingleParams memory param = ISwapRouter.ExactInputSingleParams({
    //         tokenIn: _source, 
    //         tokenOut: _target, 
    //         fee: poolFee,
    //         recipient: address(this),
    //         deadline: block.timestamp,
    //         amountIn: _sourceAmount,
    //         amountOutMinimum: 0,
    //         sqrtPriceLimitX96: 0
    //     });

    //     _outAmount = Router.exactInputSingle(param);
    // }

    // function _transferFee() internal {
    //     uint _feeInETH;

    //     if(token0 == WETH) {
    //         uint _out = _swap(address(token1), address(token0), _feeToken1);
    //         _feeInETH = _out.add(_feeToken0);
    //     } else {
    //         uint _out = _swap(address(token0), address(token1), _feeToken0);
    //         _feeInETH = _out.add(_feeToken1);
    //     }


    //     if(_feeInETH > 0) {
    //         uint _feeSplit = _feeInETH.mul(2).div(5);

    //         WETH.safeTransfer(treasury, _feeSplit);
    //         WETH.safeTransfer(communityWallet, _feeSplit);
    //         WETH.safeTransfer(strategist, _feeInETH.sub(_feeSplit).sub(_feeSplit));
            
    //     }

    // }

    function addLiquidity(uint amount0, uint amount1) internal returns (uint){
        if(vaultPositionTokenId == 0) {
            // add liquidity for the first time
            INonfungiblePositionManager.MintParams memory params =
                INonfungiblePositionManager.MintParams({
                    token0: address(token0),
                    token1: address(token1),
                    fee: poolFee,
                    tickLower: lowerTick, 
                    tickUpper: upperTick, 
                    // tickLower: -840000, 
                    // tickUpper: 840000, 
                    amount0Desired: amount0,
                    amount1Desired: amount1,
                    amount0Min: 0,
                    amount1Min: 0,
                    recipient: address(this),
                    deadline: block.timestamp
                });
            (uint _tokenId, uint liquidity,,) = nonfungiblePositionManager.mint(params);
            vaultPositionTokenId = _tokenId;
            return liquidity;
        } else {
            INonfungiblePositionManager.IncreaseLiquidityParams memory params =
                INonfungiblePositionManager.IncreaseLiquidityParams({
                    tokenId: vaultPositionTokenId,
                    amount0Desired: amount0,
                    amount1Desired: amount1,
                    amount0Min: 0,
                    amount1Min: 0,
                    deadline: block.timestamp
                });
            (uint liquidity, , ) = nonfungiblePositionManager.increaseLiquidity(params);
            return liquidity;
        }
    }

    function _decreaseLiquidity(uint _liquidity) internal returns (uint _amt0, uint _amt1){
         INonfungiblePositionManager.DecreaseLiquidityParams memory params =
            INonfungiblePositionManager.DecreaseLiquidityParams({
                tokenId: vaultPositionTokenId,
                liquidity: uint128(_liquidity),
                amount0Min: 0,
                amount1Min: 0,
                deadline: block.timestamp
            });

        //decrease liquidity to collect deposit fee
        (_amt0, _amt1) = nonfungiblePositionManager.decreaseLiquidity(params);
    }

    function _collect(uint _amount0, uint _amount1) internal returns (uint _amt0Collected, uint _amt1Collected){

        INonfungiblePositionManager.CollectParams memory collectParams =
            INonfungiblePositionManager.CollectParams({
                tokenId: vaultPositionTokenId,
                recipient: address(this),
                amount0Max: uint128(_amount0),
                amount1Max: uint128(_amount1)
            });

        (_amt0Collected, _amt1Collected) =  nonfungiblePositionManager.collect(collectParams);
    }

    //type == 0 for depositFee
    // function _calcFee(uint _amount0, uint _amount1, uint _type) internal returns (uint _amt0AfterFee, uint _amt1AfterFee){
    //     //both tokens added as liquidity
    //     uint _half = _type == 0 ? depositFeePerc/2 : yieldFeePerc/2;
    //     uint _fee0 = _amount0.mul(_half).div(10000);
    //     uint _fee1 = _amount1.mul(_half).div(10000);
        
    //     _feeToken0 = _feeToken0.add(_fee0);
    //     _feeToken1 = _feeToken1.add(_fee1);

    //     _amt0AfterFee = _amount0 .sub (_fee0);
    //     _amt1AfterFee = _amount1 .sub (_fee1);

    // }

    // function _available() internal view returns (uint _amt0, uint _amt1) {
    //     _amt0 = token0.balanceOf(address(this)).sub(_feeToken0);
    //     _amt1 = token1.balanceOf(address(this)).sub(_feeToken1);
    // }

    // function getAllPool() public view returns (uint _amount0, uint _amount1) {
    //     (,,,,,int24 _tickLower, int24 _tickHigher, uint128 _liquidity, ,,,) =  nonfungiblePositionManager.positions(vaultPositionTokenId);
        
    //     (uint160 sqrtRatioX96,,,,,,) = UniswapPool.slot0(); //Current price // (sqrt(token1/token0))

    //     uint160 sqrtRatioAX96 = TickMath.getSqrtRatioAtTick(_tickLower);
    //     uint160 sqrtRatioBX96 = TickMath.getSqrtRatioAtTick(_tickHigher);
        

    //     (_amount0, _amount1) = LiquidityAmounts.getAmountsForLiquidity(sqrtRatioX96, sqrtRatioAX96, sqrtRatioBX96, _liquidity);
        
    // }

    // function getAllPoolInETH() public view returns (uint _valueInETH) {
    //     (uint _amount0, uint _amount1) = getAllPool();
    //     _valueInETH = token0 == WETH ? _amount0.mul(2) : _amount1.mul(2); //since the value(in USD) of _amount1 and _amount0 are equal
    // }

    // function getAllPoolInUSD() public view returns (uint) {
    //     uint ETHPriceInUSD = uint(IChainlink(0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419).latestAnswer()).mul(1e10); // 8 decimals
    //     return getAllPoolInETH() .mul (ETHPriceInUSD) .div (1e18);
    // }
    
    // function getPricePerFullShare(bool inUSD) external view returns (uint) {
    //     uint _totalSupply = totalSupply();
    //     if (_totalSupply == 0) return 0;
    //     return inUSD == true ?
    //         getAllPoolInUSD() .mul (1e18) .div (_totalSupply) :
    //         getAllPoolInETH() .mul (1e18) .div (_totalSupply);
    // }
}