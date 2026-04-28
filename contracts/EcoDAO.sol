// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EcoDAO is AccessControl, ReentrancyGuard {
    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");

    struct Proposal {
        address proposer;
        address target;
        uint256 value;
        bytes data;
        string description;
        uint256 startTime;
        uint256 endTime;
        uint256 forVotes;
        uint256 againstVotes;
        bool executed;
    }

    IERC20 public immutable governanceToken;
    uint256 public votingPeriod;
    uint256 public quorum;
    uint256 public nextProposalId;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => bool)) public hasVoted;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed proposer,
        address indexed target,
        uint256 value,
        string description
    );
    event VoteCast(uint256 indexed proposalId, address indexed voter, bool support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);
    event VotingConfigUpdated(uint256 votingPeriod, uint256 quorum);

    constructor(address admin, address governanceTokenAddress, uint256 votingPeriod_, uint256 quorum_) {
        require(admin != address(0), "EcoDAO: admin zero");
        require(governanceTokenAddress != address(0), "EcoDAO: token zero");
        require(votingPeriod_ > 0, "EcoDAO: voting period zero");

        governanceToken = IERC20(governanceTokenAddress);
        votingPeriod = votingPeriod_;
        quorum = quorum_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(PROPOSER_ROLE, admin);
    }

    function createProposal(
        address target,
        uint256 value,
        bytes calldata data,
        string calldata description
    ) external onlyRole(PROPOSER_ROLE) returns (uint256 proposalId) {
        require(target != address(0), "EcoDAO: target zero");
        require(bytes(description).length > 0, "EcoDAO: empty description");

        proposalId = ++nextProposalId;
        Proposal storage p = proposals[proposalId];
        p.proposer = msg.sender;
        p.target = target;
        p.value = value;
        p.data = data;
        p.description = description;
        p.startTime = block.timestamp;
        p.endTime = block.timestamp + votingPeriod;

        emit ProposalCreated(proposalId, msg.sender, target, value, description);
    }

    function vote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(p.startTime > 0, "EcoDAO: proposal missing");
        require(block.timestamp >= p.startTime, "EcoDAO: vote not started");
        require(block.timestamp <= p.endTime, "EcoDAO: vote ended");
        require(!hasVoted[proposalId][msg.sender], "EcoDAO: already voted");

        uint256 weight = governanceToken.balanceOf(msg.sender);
        require(weight > 0, "EcoDAO: no voting power");

        hasVoted[proposalId][msg.sender] = true;
        if (support) {
            p.forVotes += weight;
        } else {
            p.againstVotes += weight;
        }

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(p.startTime > 0, "EcoDAO: proposal missing");
        require(block.timestamp > p.endTime, "EcoDAO: vote active");
        require(!p.executed, "EcoDAO: already executed");

        uint256 totalVotes = p.forVotes + p.againstVotes;
        require(totalVotes >= quorum, "EcoDAO: quorum not met");
        require(p.forVotes > p.againstVotes, "EcoDAO: proposal rejected");

        p.executed = true;
        (bool ok, ) = p.target.call{value: p.value}(p.data);
        require(ok, "EcoDAO: execution failed");

        emit ProposalExecuted(proposalId);
    }

    function setVotingConfig(uint256 votingPeriod_, uint256 quorum_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(votingPeriod_ > 0, "EcoDAO: voting period zero");
        votingPeriod = votingPeriod_;
        quorum = quorum_;
        emit VotingConfigUpdated(votingPeriod_, quorum_);
    }

    receive() external payable {}
}
