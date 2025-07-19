// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title AAPLToken
 * @dev ERC-20 token representing synthetic Apple (AAPL) shares
 * @notice Only authorized minters (SyntheticStock contract) can mint/burn tokens
 */
contract AAPLToken is ERC20, AccessControl, Pausable {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    uint8 private constant DECIMALS = 18;
    
    event Mint(address indexed to, uint256 amount, address indexed minter);
    event Burn(address indexed from, uint256 amount, address indexed burner);

    constructor(address admin) ERC20("Synthetic Apple Stock", "AAPL-x") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation
     * @return uint8 Number of decimals (18 for ERC-20 standard)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @dev Mint new AAPL-x tokens
     * @param to Address to mint tokens to
     * @param amount Amount to mint (18 decimal precision)
     * @notice Only addresses with MINTER_ROLE can call this function
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(to != address(0), "AAPLToken: mint to zero address");
        require(amount > 0, "AAPLToken: mint amount must be positive");
        
        _mint(to, amount);
        emit Mint(to, amount, msg.sender);
    }

    /**
     * @dev Burn AAPL-x tokens from a specific address
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     * @notice Only addresses with BURNER_ROLE can call this function
     */
    function burn(address from, uint256 amount) external onlyRole(BURNER_ROLE) whenNotPaused {
        require(from != address(0), "AAPLToken: burn from zero address");
        require(amount > 0, "AAPLToken: burn amount must be positive");
        require(balanceOf(from) >= amount, "AAPLToken: insufficient balance");
        
        _burn(from, amount);
        emit Burn(from, amount, msg.sender);
    }

    /**
     * @dev Allow users to burn their own tokens
     * @param amount Amount to burn
     */
    function burnSelf(uint256 amount) external whenNotPaused {
        require(amount > 0, "AAPLToken: burn amount must be positive");
        require(balanceOf(msg.sender) >= amount, "AAPLToken: insufficient balance");
        
        _burn(msg.sender, amount);
        emit Burn(msg.sender, amount, msg.sender);
    }

    /**
     * @dev Pause the contract (emergency stop)
     * @notice Only addresses with PAUSER_ROLE can call this function
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause the contract
     * @notice Only addresses with PAUSER_ROLE can call this function
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Override transfer to respect pause state
     */
    function transfer(address to, uint256 amount) public override whenNotPaused returns (bool) {
        return super.transfer(to, amount);
    }

    /**
     * @dev Override transferFrom to respect pause state
     */
    function transferFrom(address from, address to, uint256 amount) 
        public 
        override 
        whenNotPaused 
        returns (bool) 
    {
        return super.transferFrom(from, to, amount);
    }

    /**
     * @dev Get the current total supply of AAPL-x tokens
     * @return uint256 Total supply in 18 decimal precision
     */
    function getTotalSupply() external view returns (uint256) {
        return totalSupply();
    }
} 