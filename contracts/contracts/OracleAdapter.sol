// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/**
 * @title OracleAdapter
 * @dev Manages AAPL price feeds for the synthetic stock system
 * @notice Implements UUPS upgradeable pattern for future improvements
 */
contract OracleAdapter is Initializable, AccessControlUpgradeable, UUPSUpgradeable {
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    // Price data
    int256 private _latestPrice;      // Price scaled by 1e8 (e.g., 150.34 USD = 15034000000)
    uint256 private _lastUpdated;     // Block timestamp of last update
    uint256 private _updateCount;     // Number of price updates

    // Price validation parameters
    uint256 public constant MAX_PRICE_AGE = 1 hours;        // Maximum age for price validity
    uint256 public constant MIN_UPDATE_INTERVAL = 1 minutes; // Minimum time between updates
    int256 public constant MAX_PRICE_CHANGE = 50e8;          // Max 50% price change per update

    // Price bounds (in 1e8 precision)
    int256 public constant MIN_PRICE = 1e8;      // $1.00
    int256 public constant MAX_PRICE = 10000e8;  // $10,000

    event PriceUpdated(
        int256 indexed newPrice,
        int256 indexed oldPrice,
        uint256 timestamp,
        address indexed operator
    );
    
    event OperatorAdded(address indexed operator, address indexed admin);
    event OperatorRemoved(address indexed operator, address indexed admin);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev Initialize the contract with admin address
     * @param admin Address that will have admin and upgrader roles
     */
    function initialize(address admin) external initializer {
        require(admin != address(0), "OracleAdapter: admin cannot be zero address");
        
        __AccessControl_init();
        __UUPSUpgradeable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(UPGRADER_ROLE, admin);
        
        // Initialize with a default price (e.g., $150.00)
        _latestPrice = 150e8;
        _lastUpdated = block.timestamp;
        _updateCount = 0;
    }

    /**
     * @dev Update the AAPL price
     * @param newPrice New price in 1e8 precision (e.g., 150.34 USD = 15034000000)
     * @notice Only operators can call this function
     */
    function pushPrice(int256 newPrice) external onlyRole(OPERATOR_ROLE) {
        require(newPrice > 0, "OracleAdapter: price must be positive");
        require(newPrice >= MIN_PRICE, "OracleAdapter: price below minimum");
        require(newPrice <= MAX_PRICE, "OracleAdapter: price above maximum");
        require(
            block.timestamp >= _lastUpdated + MIN_UPDATE_INTERVAL,
            "OracleAdapter: update too frequent"
        );

        // Validate price change is not too extreme
        if (_updateCount > 0) {
            int256 priceChange = newPrice > _latestPrice 
                ? newPrice - _latestPrice 
                : _latestPrice - newPrice;
            
            int256 maxChange = (_latestPrice * MAX_PRICE_CHANGE) / 100e8;
            require(
                priceChange <= maxChange,
                "OracleAdapter: price change too large"
            );
        }

        int256 oldPrice = _latestPrice;
        _latestPrice = newPrice;
        _lastUpdated = block.timestamp;
        _updateCount++;

        emit PriceUpdated(newPrice, oldPrice, block.timestamp, msg.sender);
    }

    /**
     * @dev Get the latest AAPL price
     * @return price Latest price in 1e8 precision
     * @return lastUpdated Timestamp of last update
     */
    function getPrice() external view returns (int256 price, uint256 lastUpdated) {
        require(_lastUpdated > 0, "OracleAdapter: no price data available");
        require(
            block.timestamp <= _lastUpdated + MAX_PRICE_AGE,
            "OracleAdapter: price data too old"
        );
        
        return (_latestPrice, _lastUpdated);
    }

    /**
     * @dev Get the latest price without age validation (for emergency use)
     * @return price Latest price in 1e8 precision
     * @return lastUpdated Timestamp of last update
     * @return isStale Whether the price is older than MAX_PRICE_AGE
     */
    function getPriceUnsafe() external view returns (int256 price, uint256 lastUpdated, bool isStale) {
        bool stale = _lastUpdated == 0 || block.timestamp > _lastUpdated + MAX_PRICE_AGE;
        return (_latestPrice, _lastUpdated, stale);
    }

    /**
     * @dev Check if price data is fresh
     * @return bool True if price is within acceptable age
     */
    function isPriceFresh() external view returns (bool) {
        return _lastUpdated > 0 && block.timestamp <= _lastUpdated + MAX_PRICE_AGE;
    }

    /**
     * @dev Add a new price operator
     * @param operator Address to grant operator role
     * @notice Only admins can call this function
     */
    function addOperator(address operator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(operator != address(0), "OracleAdapter: operator cannot be zero address");
        
        _grantRole(OPERATOR_ROLE, operator);
        emit OperatorAdded(operator, msg.sender);
    }

    /**
     * @dev Remove a price operator
     * @param operator Address to revoke operator role
     * @notice Only admins can call this function
     */
    function removeOperator(address operator) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _revokeRole(OPERATOR_ROLE, operator);
        emit OperatorRemoved(operator, msg.sender);
    }

    /**
     * @dev Get oracle statistics
     * @return latestPrice Current price
     * @return lastUpdated Last update timestamp
     * @return updateCount Total number of updates
     * @return isFresh Whether price is fresh
     */
    function getOracleStats() external view returns (
        int256 latestPrice,
        uint256 lastUpdated,
        uint256 updateCount,
        bool isFresh
    ) {
        return (
            _latestPrice,
            _lastUpdated,
            _updateCount,
            _lastUpdated > 0 && block.timestamp <= _lastUpdated + MAX_PRICE_AGE
        );
    }

    /**
     * @dev Authorize contract upgrades
     * @param newImplementation Address of new implementation
     * @notice Only upgraders can call this function
     */
    function _authorizeUpgrade(address newImplementation) 
        internal 
        override 
        onlyRole(UPGRADER_ROLE) 
    {}

    /**
     * @dev Get the current contract version
     * @return string Version identifier
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
} 