// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "./AAPLToken.sol";
import "./CollateralVault.sol";
import "./OracleAdapter.sol";

/**
 * @title SyntheticStock
 * @dev Main contract for minting and redeeming synthetic AAPL shares
 * @notice Implements 150% over-collateralization with USDC backing
 */
contract SyntheticStock is 
    Initializable, 
    AccessControlUpgradeable, 
    UUPSUpgradeable, 
    ReentrancyGuardUpgradeable 
{
    using SafeERC20 for IERC20;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    // Core contracts
    AAPLToken public aaplToken;
    CollateralVault public collateralVault;
    OracleAdapter public oracle;
    IERC20 public usdcToken;

    // Collateralization parameters
    uint256 public constant COLLATERAL_RATIO = 150e18; // 150% (scaled by 1e18)
    uint256 public constant LIQUIDATION_THRESHOLD = 120e18; // 120%
    uint256 public constant LIQUIDATION_PENALTY = 10e18; // 10%

    // Scaling factors
    uint256 public constant USDC_DECIMALS = 6;
    uint256 public constant AAPL_DECIMALS = 18;
    uint256 public constant PRICE_DECIMALS = 8;

    // Fee parameters
    uint256 public mintFee; // 0.25% (basis points) - initialized in initialize()
    uint256 public redeemFee; // 0.25% - initialized in initialize()
    uint256 public constant MAX_FEE = 1000; // 10% max fee

    // User positions
    mapping(address => Position) public positions;
    
    struct Position {
        uint256 collateralAmount;  // USDC collateral (6 decimals)
        uint256 aaplAmount;        // AAPL-x tokens (18 decimals)
        uint256 lastUpdatePrice;   // Last known price (8 decimals)
        uint256 lastUpdateTime;    // Timestamp of last update
    }

    // Events
    event Minted(
        address indexed user,
        uint256 usdcDeposited,
        uint256 aaplMinted,
        uint256 price,
        uint256 fee
    );
    
    event Redeemed(
        address indexed user,
        uint256 aaplBurned,
        uint256 usdcWithdrawn,
        uint256 price,
        uint256 fee
    );
    
    event Liquidated(
        address indexed user,
        address indexed liquidator,
        uint256 aaplBurned,
        uint256 collateralSeized,
        uint256 penalty
    );

    event FeesUpdated(uint256 newMintFee, uint256 newRedeemFee);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract with required addresses
     * @param _aaplToken Address of the AAPL-x token contract
     * @param _collateralVault Address of the collateral vault
     * @param _oracle Address of the oracle adapter
     * @param _usdcToken Address of the USDC token
     * @param admin Address that will have admin privileges
     */
    function initialize(
        address _aaplToken,
        address _collateralVault,
        address _oracle,
        address _usdcToken,
        address admin
    ) external initializer {
        require(_aaplToken != address(0), "SyntheticStock: AAPL token cannot be zero");
        require(_collateralVault != address(0), "SyntheticStock: vault cannot be zero");
        require(_oracle != address(0), "SyntheticStock: oracle cannot be zero");
        require(_usdcToken != address(0), "SyntheticStock: USDC cannot be zero");
        require(admin != address(0), "SyntheticStock: admin cannot be zero");

        __AccessControl_init();
        __UUPSUpgradeable_init();
        __ReentrancyGuard_init();

        aaplToken = AAPLToken(_aaplToken);
        collateralVault = CollateralVault(_collateralVault);
        oracle = OracleAdapter(_oracle);
        usdcToken = IERC20(_usdcToken);

        // Initialize fee parameters
        mintFee = 25; // 0.25% (basis points)
        redeemFee = 25; // 0.25%

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        _grantRole(OPERATOR_ROLE, admin);
    }

    /**
     * @dev Mint AAPL-x tokens by depositing USDC collateral
     * @param usdcAmount Amount of USDC to deposit as collateral (6 decimals)
     * @return aaplAmount Amount of AAPL-x tokens minted (18 decimals)
     */
    function mint(uint256 usdcAmount) external nonReentrant returns (uint256 aaplAmount) {
        require(usdcAmount > 0, "SyntheticStock: amount must be positive");
        
        // Get current AAPL price from oracle
        (int256 price, ) = oracle.getPrice();
        require(price > 0, "SyntheticStock: invalid price");
        
        uint256 aaplPrice = uint256(price);
        
        // Calculate AAPL amount that can be minted with this collateral
        // Formula: aaplAmount = (usdcAmount * collateralRatio / 100) / price
        // Converting decimals: USDC(6) -> AAPL(18), price(8)
        aaplAmount = (usdcAmount * 10**(AAPL_DECIMALS - USDC_DECIMALS) * 100e18) / 
                     (aaplPrice * 10**(PRICE_DECIMALS) * COLLATERAL_RATIO);
        
        require(aaplAmount > 0, "SyntheticStock: insufficient collateral");
        
        // Calculate and deduct mint fee
        uint256 fee = (usdcAmount * mintFee) / 10000;
        uint256 netCollateral = usdcAmount - fee;
        
        // Transfer USDC from user to this contract
        usdcToken.safeTransferFrom(msg.sender, address(this), usdcAmount);
        
        // Approve and deposit collateral to vault
        usdcToken.approve(address(collateralVault), netCollateral);
        collateralVault.depositCollateral(msg.sender, netCollateral);
        
        // Mint AAPL-x tokens to user
        aaplToken.mint(msg.sender, aaplAmount);
        
        // Update user position
        Position storage position = positions[msg.sender];
        position.collateralAmount += netCollateral;
        position.aaplAmount += aaplAmount;
        position.lastUpdatePrice = aaplPrice;
        position.lastUpdateTime = block.timestamp;
        
        emit Minted(msg.sender, usdcAmount, aaplAmount, aaplPrice, fee);
        
        return aaplAmount;
    }

    /**
     * @dev Redeem AAPL-x tokens to get back USDC collateral
     * @param aaplAmount Amount of AAPL-x tokens to burn (18 decimals)
     * @return usdcAmount Amount of USDC returned (6 decimals)
     */
    function redeem(uint256 aaplAmount) external nonReentrant returns (uint256 usdcAmount) {
        require(aaplAmount > 0, "SyntheticStock: amount must be positive");
        require(aaplToken.balanceOf(msg.sender) >= aaplAmount, "SyntheticStock: insufficient balance");
        
        Position storage position = positions[msg.sender];
        require(position.aaplAmount >= aaplAmount, "SyntheticStock: insufficient position");
        
        // Get current AAPL price
        (int256 price, ) = oracle.getPrice();
        require(price > 0, "SyntheticStock: invalid price");
        
        uint256 aaplPrice = uint256(price);
        
        // Calculate USDC to return
        // Formula: usdcAmount = (aaplAmount * price * collateralRatio / 100) 
        // Converting decimals: AAPL(18) -> USDC(6), price(8)
        usdcAmount = (aaplAmount * aaplPrice * 10**(PRICE_DECIMALS) * COLLATERAL_RATIO) / 
                     (100e18 * 10**(AAPL_DECIMALS - USDC_DECIMALS));
        
        // Ensure we don't return more than user's collateral
        uint256 userCollateral = collateralVault.getUserCollateral(msg.sender);
        if (usdcAmount > userCollateral) {
            usdcAmount = userCollateral;
        }
        
        // Calculate and deduct redeem fee
        uint256 fee = (usdcAmount * redeemFee) / 10000;
        uint256 netReturn = usdcAmount - fee;
        
        // Burn AAPL-x tokens from user
        aaplToken.burn(msg.sender, aaplAmount);
        
        // Withdraw collateral from vault to user
        collateralVault.withdrawCollateral(msg.sender, usdcAmount, msg.sender);
        
        // Update user position
        position.collateralAmount -= usdcAmount;
        position.aaplAmount -= aaplAmount;
        position.lastUpdatePrice = aaplPrice;
        position.lastUpdateTime = block.timestamp;
        
        emit Redeemed(msg.sender, aaplAmount, netReturn, aaplPrice, fee);
        
        return netReturn;
    }

    /**
     * @dev Get the current collateralization ratio for a user
     * @param user Address of the user
     * @return ratio Collateralization ratio (scaled by 1e18)
     */
    function getCollateralizationRatio(address user) external view returns (uint256 ratio) {
        Position memory position = positions[user];
        if (position.aaplAmount == 0) return 0;
        
        (int256 price, , ) = oracle.getPriceUnsafe();
        if (price <= 0) return 0;
        
        uint256 aaplPrice = uint256(price);
        
        // Calculate ratio = (collateral_value / aapl_value) * 100 * 1e18
        // collateral_value = position.collateralAmount (USDC, 6 decimals)
        // aapl_value = (position.aaplAmount * aaplPrice) / 1e18 / 1e8 * 1e6 (convert to USDC terms)
        // aapl_value = (position.aaplAmount * aaplPrice) / 1e20
        
        // ratio = (position.collateralAmount * 1e20 * 100 * 1e18) / (position.aaplAmount * aaplPrice)
        // ratio = (position.collateralAmount * 100e38) / (position.aaplAmount * aaplPrice)
        
        uint256 numerator = position.collateralAmount * 100e38;
        uint256 denominator = position.aaplAmount * aaplPrice;
        
        if (denominator == 0) return type(uint256).max;
        
        ratio = numerator / denominator;
        return ratio;
    }

    /**
     * @dev Check if a position can be liquidated
     * @param user Address of the user
     * @return bool True if position is under-collateralized
     */
    function canLiquidate(address user) external view returns (bool) {
        uint256 ratio = this.getCollateralizationRatio(user);
        return ratio > 0 && ratio < LIQUIDATION_THRESHOLD;
    }

    /**
     * @dev Update fees (only admin)
     * @param newMintFee New mint fee in basis points
     * @param newRedeemFee New redeem fee in basis points
     */
    function updateFees(uint256 newMintFee, uint256 newRedeemFee) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newMintFee <= MAX_FEE, "SyntheticStock: mint fee too high");
        require(newRedeemFee <= MAX_FEE, "SyntheticStock: redeem fee too high");
        
        mintFee = newMintFee;
        redeemFee = newRedeemFee;
        
        emit FeesUpdated(newMintFee, newRedeemFee);
    }

    /**
     * @dev Authorize contract upgrades
     * @param newImplementation Address of new implementation
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(UPGRADER_ROLE) 
    {}

    /**
     * @dev Get contract version
     * @return string Version identifier
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
} 