// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockUSDC
 * @dev Mock USDC contract for testing synthetic stock functionality
 * @notice This is for testnet use only - implements 6 decimal precision like real USDC
 */
contract MockUSDC is ERC20, Ownable {
    uint8 private constant DECIMALS = 6;
    uint256 public constant INITIAL_SUPPLY = 1_000_000 * 10**DECIMALS; // 1M USDC

    event Mint(address indexed to, uint256 amount);
    event Burn(address indexed from, uint256 amount);

    constructor(address initialOwner) 
        ERC20("Mock USDC", "USDC") 
        Ownable(initialOwner) 
    {
        _mint(initialOwner, INITIAL_SUPPLY);
    }

    /**
     * @dev Returns the number of decimals used to get its user representation
     * @return uint8 Number of decimals (6 for USDC)
     */
    function decimals() public pure override returns (uint8) {
        return DECIMALS;
    }

    /**
     * @dev Mint new USDC tokens (testnet only)
     * @param to Address to mint tokens to
     * @param amount Amount to mint (in wei, considering 6 decimals)
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "MockUSDC: mint to zero address");
        require(amount > 0, "MockUSDC: mint amount must be positive");
        
        _mint(to, amount);
        emit Mint(to, amount);
    }

    /**
     * @dev Burn USDC tokens
     * @param amount Amount to burn (in wei, considering 6 decimals)
     */
    function burn(uint256 amount) external {
        require(amount > 0, "MockUSDC: burn amount must be positive");
        require(balanceOf(msg.sender) >= amount, "MockUSDC: insufficient balance");
        
        _burn(msg.sender, amount);
        emit Burn(msg.sender, amount);
    }

    /**
     * @dev Burn USDC tokens from a specific account (with allowance)
     * @param from Address to burn tokens from
     * @param amount Amount to burn
     */
    function burnFrom(address from, uint256 amount) external {
        require(amount > 0, "MockUSDC: burn amount must be positive");
        require(from != address(0), "MockUSDC: burn from zero address");
        
        uint256 currentAllowance = allowance(from, msg.sender);
        require(currentAllowance >= amount, "MockUSDC: insufficient allowance");
        
        _spendAllowance(from, msg.sender, amount);
        _burn(from, amount);
        emit Burn(from, amount);
    }

    /**
     * @dev Faucet function for easy testing - anyone can mint up to 1000 USDC per call
     * @notice For testnet use only
     */
    function faucet() external {
        uint256 faucetAmount = 1000 * 10**DECIMALS; // 1000 USDC
        require(
            balanceOf(msg.sender) < faucetAmount * 10, // Max 10k USDC per address
            "MockUSDC: address already has enough tokens"
        );
        
        _mint(msg.sender, faucetAmount);
        emit Mint(msg.sender, faucetAmount);
    }
} 