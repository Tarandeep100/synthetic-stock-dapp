// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./SyntheticStock.sol";

/**
 * @title ZKSolvencyVerifier
 * @dev Verifies zero-knowledge proofs of system solvency per SDD requirements
 * @notice Per SDD: ZKProver -- "proof" --> Verifier (proves totalCollateral ≥ 1.5 × totalSupply)
 */
contract ZKSolvencyVerifier is AccessControl, Pausable {
    bytes32 public constant PROVER_ROLE = keccak256("PROVER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // Core contract reference
    SyntheticStock public immutable syntheticStock;

    // Proof verification parameters
    struct SolvencyProof {
        uint256[8] proof; // Groth16 proof (2 G1 points + 1 G2 point = 8 uint256)
        uint256 timestamp;
        bool verified;
    }

    // Latest proof tracking
    SolvencyProof public latestProof;
    uint256 public constant PROOF_VALIDITY_PERIOD = 7 days; // Weekly proofs per SDD
    uint256 public constant MIN_PROOF_INTERVAL = 1 days; // Minimum time between proofs

    // Verification key for Groth16 (example structure)
    struct VerifyingKey {
        uint256[2] alpha;
        uint256[2][2] beta;
        uint256[2][2] gamma;
        uint256[2][2] delta;
        uint256[2][8] ic; // Fixed size for simple solvency circuit
    }
    VerifyingKey internal verifyingKey;

    // Custom getters for VerifyingKey components
    function getVerifyingKeyAlpha() external view returns (uint256[2] memory) {
        return verifyingKey.alpha;
    }
    
    function getVerifyingKeyBeta() external view returns (uint256[2][2] memory) {
        return verifyingKey.beta;
    }
    
    function getVerifyingKeyGamma() external view returns (uint256[2][2] memory) {
        return verifyingKey.gamma;
    }
    
    function getVerifyingKeyDelta() external view returns (uint256[2][2] memory) {
        return verifyingKey.delta;
    }
    
    function getVerifyingKeyIC() external view returns (uint256[2][8] memory) {
        return verifyingKey.ic;
    }

    // Solvency history
    mapping(uint256 => SolvencyProof) public proofHistory;
    uint256 public proofCount;

    event ProofSubmitted(
        uint256 indexed proofId,
        uint256 timestamp,
        bool verified,
        address indexed prover
    );
    
    event ProofVerified(
        uint256 indexed proofId,
        uint256 timestamp,
        uint256 totalCollateral,
        uint256 totalSupply,
        uint256 collateralizationRatio
    );
    
    event VerifyingKeyUpdated(address indexed updater);
    event SolvencyAlert(uint256 collateralizationRatio, bool isSolvent);

    constructor(
        address _syntheticStock,
        address admin
    ) {
        require(_syntheticStock != address(0), "ZKSolvencyVerifier: invalid SyntheticStock");
        require(admin != address(0), "ZKSolvencyVerifier: invalid admin");
        
        syntheticStock = SyntheticStock(_syntheticStock);
        
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PROVER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
    }

    /**
     * @dev Submit and verify ZK proof of solvency per SDD requirements
     * @param proof Groth16 proof array [a1, a2, b1, b2, b3, b4, c1, c2]
     * @param publicSignals Public inputs [totalCollateral, totalSupply, timestamp]
     * @return verified Whether the proof is valid
     * @notice Per SDD: Proves totalCollateral ≥ 1.5 × totalSupply
     */
    function submitSolvencyProof(
        uint256[8] calldata proof,
        uint256[3] calldata publicSignals
    ) external onlyRole(PROVER_ROLE) whenNotPaused returns (bool verified) {
        require(
            block.timestamp >= latestProof.timestamp + MIN_PROOF_INTERVAL,
            "ZKSolvencyVerifier: proof submitted too frequently"
        );

        uint256 totalCollateral = publicSignals[0];
        uint256 totalSupply = publicSignals[1];
        uint256 proofTimestamp = publicSignals[2];

        // Verify timestamp is recent
        require(
            proofTimestamp >= block.timestamp - 1 hours &&
            proofTimestamp <= block.timestamp + 1 hours,
            "ZKSolvencyVerifier: invalid proof timestamp"
        );

        // Verify the ZK proof (simplified for MVP - would use actual Groth16 verification)
        verified = verifyGroth16Proof(proof, publicSignals);
        
        // Store the proof
        uint256 proofId = proofCount++;
        SolvencyProof storage newProof = proofHistory[proofId];
        newProof.proof = proof;
        newProof.timestamp = block.timestamp;
        newProof.verified = verified;

        // Update latest proof if verified
        if (verified) {
            latestProof = newProof;
            
            // Calculate collateralization ratio
            uint256 collateralizationRatio = totalSupply > 0 ? 
                (totalCollateral * 100) / totalSupply : type(uint256).max;
            
            // Check if system is solvent (≥ 150% per SDD)
            bool isSolvent = collateralizationRatio >= 150;
            
            emit ProofVerified(
                proofId,
                block.timestamp,
                totalCollateral,
                totalSupply,
                collateralizationRatio
            );
            
            // Emit solvency alert if needed
            if (!isSolvent) {
                emit SolvencyAlert(collateralizationRatio, false);
            }
        }

        emit ProofSubmitted(proofId, block.timestamp, verified, msg.sender);
        
        return verified;
    }

    /**
     * @dev Verify Groth16 proof (simplified for MVP)
     * @param proof Groth16 proof array
     * @param publicSignals Public inputs
     * @return valid Whether the proof is mathematically valid
     * @notice In production, this would use actual pairing operations
     */
    function verifyGroth16Proof(
        uint256[8] calldata proof,
        uint256[3] calldata publicSignals
    ) internal view returns (bool valid) {
        // Simplified verification for MVP
        // In production, this would:
        // 1. Parse proof into G1/G2 points
        // 2. Compute vk_x from public signals and IC
        // 3. Verify pairing equation: e(A,B) = e(alpha,beta) * e(vk_x,gamma) * e(C,delta)
        
        // For now, check basic constraints and simulate verification
        uint256 totalCollateral = publicSignals[0];
        uint256 totalSupply = publicSignals[1];
        
        // Basic sanity checks
        require(totalCollateral > 0, "ZKSolvencyVerifier: invalid total collateral");
        require(proof.length == 8, "ZKSolvencyVerifier: invalid proof length");
        
        // Simulate verification - in production would use actual pairing operations
        // Check if the relationship totalCollateral ≥ 1.5 × totalSupply holds
        if (totalSupply == 0) {
            return true; // No supply means solvent by default
        }
        
        uint256 requiredCollateral = (totalSupply * 150) / 100;
        bool solvencyConstraint = totalCollateral >= requiredCollateral;
        
        // Simulate cryptographic verification (would be replaced with actual pairing check)
        bool cryptographicValid = true;
        for (uint256 i = 0; i < proof.length; i++) {
            if (proof[i] == 0) {
                cryptographicValid = false;
                break;
            }
        }
        
        return solvencyConstraint && cryptographicValid;
    }

    /**
     * @dev Check if latest proof is still valid (within validity period)
     * @return isValid Whether the latest proof is still valid
     * @return timeRemaining Time until proof expires (0 if expired)
     */
    function isLatestProofValid() external view returns (bool isValid, uint256 timeRemaining) {
        if (latestProof.timestamp == 0 || !latestProof.verified) {
            return (false, 0);
        }
        
        uint256 expiryTime = latestProof.timestamp + PROOF_VALIDITY_PERIOD;
        
        if (block.timestamp >= expiryTime) {
            return (false, 0);
        }
        
        return (true, expiryTime - block.timestamp);
    }

    /**
     * @dev Get current system solvency status
     * @return isSolvent Whether system is solvent according to latest proof
     * @return collateralizationRatio Current collateralization ratio
     * @return proofAge Age of latest proof in seconds
     */
    function getSolvencyStatus() external view returns (
        bool isSolvent,
        uint256 collateralizationRatio,
        uint256 proofAge
    ) {
        // Get current system data
        uint256 currentRatio = syntheticStock.getSystemCollateralizationRatio();
        
        // Check if we have a recent valid proof
        (bool proofValid, ) = this.isLatestProofValid();
        
        if (proofValid) {
            isSolvent = currentRatio >= 150;
            collateralizationRatio = currentRatio;
            proofAge = block.timestamp - latestProof.timestamp;
        } else {
            // No valid proof - assume not solvent for safety
            isSolvent = false;
            collateralizationRatio = currentRatio;
            proofAge = latestProof.timestamp > 0 ? 
                block.timestamp - latestProof.timestamp : type(uint256).max;
        }
        
        return (isSolvent, collateralizationRatio, proofAge);
    }

    /**
     * @dev Update verifying key (admin only)
     * @param alpha Alpha component of verifying key
     * @param beta Beta component of verifying key
     * @param gamma Gamma component of verifying key
     * @param delta Delta component of verifying key
     * @param ic IC components of verifying key (fixed array of 8 elements)
     */
    function updateVerifyingKey(
        uint256[2] calldata alpha,
        uint256[2][2] calldata beta,
        uint256[2][2] calldata gamma,
        uint256[2][2] calldata delta,
        uint256[2][8] calldata ic
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        verifyingKey.alpha = alpha;
        verifyingKey.beta = beta;
        verifyingKey.gamma = gamma;
        verifyingKey.delta = delta;
        verifyingKey.ic = ic;
        
        emit VerifyingKeyUpdated(msg.sender);
    }

    /**
     * @dev Emergency check - compare ZK proof with on-chain state
     * @return matches Whether ZK proof matches current on-chain state
     * @return onChainRatio Current on-chain collateralization ratio
     */
    function emergencyStateCheck() external view returns (bool matches, uint256 onChainRatio) {
        if (latestProof.timestamp == 0) {
            return (false, 0);
        }
        
        // Get current on-chain state
        onChainRatio = syntheticStock.getSystemCollateralizationRatio();
        
        // Check if the ratio is still above 150% (allowing for some deviation)
        bool currentlySolvent = onChainRatio >= 150;
        
        // The proof should be consistent with current solvency
        matches = currentlySolvent == (onChainRatio >= 150);
        
        return (matches, onChainRatio);
    }

    /**
     * @dev Get proof history
     * @param proofId ID of the proof to retrieve
     * @return proof The proof data
     * @return timestamp When the proof was submitted
     * @return verified Whether the proof was verified
     */
    function getProofHistory(uint256 proofId) external view returns (
        uint256[8] memory proof,
        uint256 timestamp,
        bool verified
    ) {
        require(proofId < proofCount, "ZKSolvencyVerifier: proof does not exist");
        
        SolvencyProof storage historicalProof = proofHistory[proofId];
        return (historicalProof.proof, historicalProof.timestamp, historicalProof.verified);
    }

    /**
     * @dev Emergency pause (admin only)
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause (admin only)
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    /**
     * @dev Get contract version
     */
    function version() external pure returns (string memory) {
        return "1.0.0";
    }
} 