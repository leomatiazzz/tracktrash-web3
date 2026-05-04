// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @dev Interface mínima do EcoToken expondo apenas a função de mint
interface IEcoToken {
    function mint(address to, uint256 amount) external;
}

contract EcoStaking is AccessControl, ReentrancyGuard {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    IERC20    public immutable stakingToken; // token depositado em stake
    IEcoToken public immutable rewardToken;  // token mintado como recompensa

    uint256 public rewardRatePerSecond;
    uint256 public lastRewardTime;
    uint256 public accRewardPerShare;
    uint256 public totalStaked;

    mapping(address => uint256) public stakedBalance;
    mapping(address => uint256) public rewardDebt;
    mapping(address => uint256) public pendingRewards;

    event Staked(address indexed user, uint256 amount);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 oldRate, uint256 newRate);

    constructor(
        address admin,
        address stakingTokenAddress,
        address rewardTokenAddress,
        uint256 rewardRatePerSecond_
    ) {
        require(admin != address(0), "EcoStaking: admin zero");
        require(stakingTokenAddress != address(0), "EcoStaking: staking token zero");
        require(rewardTokenAddress != address(0), "EcoStaking: reward token zero");

        stakingToken = IERC20(stakingTokenAddress);
        rewardToken  = IEcoToken(rewardTokenAddress);
        rewardRatePerSecond = rewardRatePerSecond_;
        lastRewardTime = block.timestamp;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
    }

    function stake(uint256 amount) external nonReentrant {
        require(amount > 0, "EcoStaking: amount zero");
        _updatePool();
        _harvestToPending(msg.sender);

        totalStaked += amount;
        stakedBalance[msg.sender] += amount;
        rewardDebt[msg.sender] = (stakedBalance[msg.sender] * accRewardPerShare) / 1e12;

        bool ok = stakingToken.transferFrom(msg.sender, address(this), amount);
        require(ok, "EcoStaking: transferFrom fail");
        emit Staked(msg.sender, amount);
    }

    function unstake(uint256 amount) external nonReentrant {
        require(amount > 0, "EcoStaking: amount zero");
        require(stakedBalance[msg.sender] >= amount, "EcoStaking: insufficient stake");
        _updatePool();
        _harvestToPending(msg.sender);

        totalStaked -= amount;
        stakedBalance[msg.sender] -= amount;
        rewardDebt[msg.sender] = (stakedBalance[msg.sender] * accRewardPerShare) / 1e12;

        bool ok = stakingToken.transfer(msg.sender, amount);
        require(ok, "EcoStaking: transfer fail");
        emit Unstaked(msg.sender, amount);
    }

    function claimRewards() external nonReentrant {
        _updatePool();
        _harvestToPending(msg.sender);

        uint256 reward = pendingRewards[msg.sender];
        require(reward > 0, "EcoStaking: no rewards");
        pendingRewards[msg.sender] = 0;
        rewardDebt[msg.sender] = (stakedBalance[msg.sender] * accRewardPerShare) / 1e12;

        // Minta recompensas diretamente para o usuário.
        // Requer que este contrato tenha MINTER_ROLE no EcoToken.
        rewardToken.mint(msg.sender, reward);
        emit RewardsClaimed(msg.sender, reward);
    }

    function setRewardRatePerSecond(uint256 newRate) external onlyRole(MANAGER_ROLE) {
        _updatePool();
        uint256 oldRate = rewardRatePerSecond;
        rewardRatePerSecond = newRate;
        emit RewardRateUpdated(oldRate, newRate);
    }

    function pendingReward(address user) external view returns (uint256) {
        uint256 currentAcc = accRewardPerShare;
        if (block.timestamp > lastRewardTime && totalStaked > 0) {
            uint256 elapsed = block.timestamp - lastRewardTime;
            uint256 generated = elapsed * rewardRatePerSecond;
            currentAcc += (generated * 1e12) / totalStaked;
        }

        uint256 accumulated = (stakedBalance[user] * currentAcc) / 1e12;
        uint256 harvestable = accumulated > rewardDebt[user] ? accumulated - rewardDebt[user] : 0;
        return pendingRewards[user] + harvestable;
    }

    function _updatePool() internal {
        if (block.timestamp <= lastRewardTime) return;

        if (totalStaked == 0) {
            lastRewardTime = block.timestamp;
            return;
        }

        uint256 elapsed = block.timestamp - lastRewardTime;
        uint256 generated = elapsed * rewardRatePerSecond;
        accRewardPerShare += (generated * 1e12) / totalStaked;
        lastRewardTime = block.timestamp;
    }

    function _harvestToPending(address user) internal {
        uint256 accumulated = (stakedBalance[user] * accRewardPerShare) / 1e12;
        uint256 delta = accumulated > rewardDebt[user] ? accumulated - rewardDebt[user] : 0;
        if (delta > 0) {
            pendingRewards[user] += delta;
        }
    }
}
