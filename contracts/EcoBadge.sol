// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {ERC721URIStorage} from "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract EcoBadge is ERC721URIStorage, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    struct BadgeData {
        string achievementType;
        uint256 impactScore;
        uint256 issuedAt;
    }

    uint256 public nextTokenId;
    mapping(uint256 => BadgeData) private _badgeData;

    event BadgeMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        string achievementType,
        uint256 impactScore,
        string metadataURI
    );

    constructor(address admin) ERC721("EcoBadge", "ECOB") {
        require(admin != address(0), "EcoBadge: admin zero");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
    }

    function mintBadge(
        address recipient,
        string calldata achievementType,
        uint256 impactScore,
        string calldata metadataURI
    ) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        require(recipient != address(0), "EcoBadge: recipient zero");
        require(bytes(achievementType).length > 0, "EcoBadge: empty achievement");

        tokenId = ++nextTokenId;
        _safeMint(recipient, tokenId);
        _setTokenURI(tokenId, metadataURI);

        _badgeData[tokenId] = BadgeData({
            achievementType: achievementType,
            impactScore: impactScore,
            issuedAt: block.timestamp
        });

        emit BadgeMinted(recipient, tokenId, achievementType, impactScore, metadataURI);
    }

    function getBadgeData(uint256 tokenId) external view returns (BadgeData memory) {
        _requireOwned(tokenId);
        return _badgeData[tokenId];
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
