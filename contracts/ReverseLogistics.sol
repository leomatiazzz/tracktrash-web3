// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @dev Interface mínima do EcoToken expondo apenas o que este contrato precisa
interface IEcoToken {
    function mint(address to, uint256 amount) external;
}

/// @dev Interface mínima do EcoBadge
interface IEcoBadge {
    function mintBadge(
        address recipient,
        string calldata achievementType,
        uint256 impactScore,
        string calldata metadataURI
    ) external returns (uint256 tokenId);
}

interface AggregatorV3Interface {
    function decimals() external view returns (uint8);
    function latestRoundData()
        external
        view
        returns (uint80, int256, uint256, uint256, uint80);
}

contract ReverseLogistics is AccessControl, ReentrancyGuard {
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");

    struct ReturnRecord {
        address user;
        string itemId;
        uint256 quantity;
        uint256 timestamp;
        uint256 ethUsdPrice;
        uint256 feePaidWei;
        uint256 rewardAmount;
        uint256 badgeTokenId;
        string metadataURI;
    }

    IEcoToken public immutable ecoToken;
    IEcoBadge public immutable ecoBadge;
    AggregatorV3Interface public priceFeed;

    uint256 public flatFeeUsd18;
    uint256 public rewardUsd18;
    uint256 public ecoTokenUsdPrice18;

    uint256 public nextReturnId;
    mapping(uint256 => ReturnRecord) public returnsById;
    mapping(address => uint256[]) public returnsByUser;

    event ReturnRegistered(
        uint256 indexed returnId,
        address indexed user,
        string itemId,
        uint256 quantity,
        uint256 feePaidWei,
        uint256 rewardAmount,
        uint256 ethUsdPrice
    );
    event PricingParamsUpdated(uint256 flatFeeUsd18, uint256 rewardUsd18, uint256 ecoTokenUsdPrice18);
    event PriceFeedUpdated(address indexed newPriceFeed);
    event FeesWithdrawn(address indexed to, uint256 amount);

    constructor(
        address admin,
        address ecoTokenAddress,
        address ecoBadgeAddress,
        address priceFeedAddress,
        uint256 flatFeeUsd18_,
        uint256 rewardUsd18_,
        uint256 ecoTokenUsdPrice18_
    ) {
        require(admin != address(0),          "ReverseLogistics: admin zero");
        require(ecoTokenAddress != address(0), "ReverseLogistics: token zero");
        require(ecoBadgeAddress != address(0), "ReverseLogistics: badge zero");
        require(priceFeedAddress != address(0),"ReverseLogistics: feed zero");
        require(ecoTokenUsdPrice18_ > 0,       "ReverseLogistics: token price zero");

        ecoToken = IEcoToken(ecoTokenAddress);
        ecoBadge = IEcoBadge(ecoBadgeAddress);
        priceFeed = AggregatorV3Interface(priceFeedAddress);
        flatFeeUsd18 = flatFeeUsd18_;
        rewardUsd18 = rewardUsd18_;
        ecoTokenUsdPrice18 = ecoTokenUsdPrice18_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MANAGER_ROLE, admin);
    }

    function registerReturn(
        string calldata itemId,
        uint256 quantity,
        string calldata metadataURI,
        string calldata achievementType,
        uint256 impactScore
    ) external payable nonReentrant returns (uint256 returnId) {
        require(quantity > 0,               "ReverseLogistics: quantity zero");
        require(bytes(itemId).length > 0,   "ReverseLogistics: item empty");

        uint256 ethUsdPrice     = _ethUsdPrice();
        uint256 requiredFeeWei  = usd18ToWei(flatFeeUsd18, ethUsdPrice);
        require(msg.value >= requiredFeeWei, "ReverseLogistics: insufficient fee");

        uint256 rewardAmount = (rewardUsd18 * 1e18) / ecoTokenUsdPrice18;

        returnId = ++nextReturnId;

        // Minta ECO como recompensa (requer MINTER_ROLE no EcoToken)
        ecoToken.mint(msg.sender, rewardAmount);

        // Minta EcoBadge NFT atomicamente (requer MINTER_ROLE no EcoBadge)
        uint256 badgeTokenId = ecoBadge.mintBadge(
            msg.sender,
            achievementType,
            impactScore,
            metadataURI
        );

        returnsById[returnId] = ReturnRecord({
            user:         msg.sender,
            itemId:       itemId,
            quantity:     quantity,
            timestamp:    block.timestamp,
            ethUsdPrice:  ethUsdPrice,
            feePaidWei:   msg.value,
            rewardAmount: rewardAmount,
            badgeTokenId: badgeTokenId,
            metadataURI:  metadataURI
        });
        returnsByUser[msg.sender].push(returnId);

        emit ReturnRegistered(returnId, msg.sender, itemId, quantity, msg.value, rewardAmount, ethUsdPrice);
    }

    function setPricingParams(
        uint256 flatFeeUsd18_,
        uint256 rewardUsd18_,
        uint256 ecoTokenUsdPrice18_
    ) external onlyRole(MANAGER_ROLE) {
        require(ecoTokenUsdPrice18_ > 0, "ReverseLogistics: token price zero");
        flatFeeUsd18 = flatFeeUsd18_;
        rewardUsd18 = rewardUsd18_;
        ecoTokenUsdPrice18 = ecoTokenUsdPrice18_;

        emit PricingParamsUpdated(flatFeeUsd18_, rewardUsd18_, ecoTokenUsdPrice18_);
    }

    function setPriceFeed(address newPriceFeed) external onlyRole(MANAGER_ROLE) {
        require(newPriceFeed != address(0), "ReverseLogistics: feed zero");
        priceFeed = AggregatorV3Interface(newPriceFeed);
        emit PriceFeedUpdated(newPriceFeed);
    }

    function withdrawFees(address payable to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        require(to != address(0), "ReverseLogistics: to zero");
        require(amount <= address(this).balance, "ReverseLogistics: amount too high");

        (bool sent, ) = to.call{value: amount}("");
        require(sent, "ReverseLogistics: withdraw fail");
        emit FeesWithdrawn(to, amount);
    }

    function getReturnsByUser(address user) external view returns (uint256[] memory) {
        return returnsByUser[user];
    }

    function usd18ToWei(uint256 usdAmount18, uint256 ethUsdPrice) public pure returns (uint256) {
        return (usdAmount18 * 1e8) / ethUsdPrice;
    }

    function _ethUsdPrice() internal view returns (uint256) {
        (, int256 answer, , uint256 updatedAt, ) = priceFeed.latestRoundData();
        require(answer > 0, "ReverseLogistics: invalid price");
        require(updatedAt > 0, "ReverseLogistics: stale price");
        return uint256(answer);
    }
}
