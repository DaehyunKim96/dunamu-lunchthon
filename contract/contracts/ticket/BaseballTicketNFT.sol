// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SimpleAccessControl} from "../access/SimpleAccessControl.sol";
import {IDojangVerifier} from "../interfaces/IDojangVerifier.sol";

interface IERC721Receiver {
    function onERC721Received(
        address operator,
        address from,
        uint256 tokenId,
        bytes calldata data
    ) external returns (bytes4);
}

contract BaseballTicketNFT is SimpleAccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
    bytes32 public constant MARKET_ROLE = keccak256("MARKET_ROLE");
    bytes32 public constant GATE_ROLE = keccak256("GATE_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");

    enum TicketStatus {
        Issued,
        Used,
        Postponed,
        Voided,
        Frozen
    }

    struct TicketMeta {
        bytes32 gameId;
        bytes32 seatId;
        uint64 startTime;
        uint64 transferDeadline;
        uint256 faceValueWei;
        uint32 faceValueKrw;
        uint16 zoneCode;
        uint8 row;
        uint8 seat;
        uint8 maxTransfers;
        bool reentryAllowed;
    }

    string public name;
    string public symbol;
    IDojangVerifier public verifier;
    bytes32 public attesterId;

    uint256 private _nextTokenId = 1;

    mapping(uint256 tokenId => address owner) private _owners;
    mapping(address owner => uint256 balance) private _balances;
    mapping(uint256 tokenId => address approved) private _tokenApprovals;
    mapping(address owner => mapping(address operator => bool approved)) private _operatorApprovals;
    mapping(uint256 tokenId => TicketMeta meta) private _ticketMetas;
    mapping(uint256 tokenId => TicketStatus status) private _ticketStatuses;
    mapping(uint256 tokenId => uint8 count) private _transferCounts;

    error NotAuthorized();
    error NotOwner();
    error NotVerified(address account);
    error TokenNotFound(uint256 tokenId);
    error TransferNotAllowed();
    error TransferWindowClosed();
    error TooManyTransfers();
    error WrongStatus(TicketStatus current);

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    event TicketMinted(
        uint256 indexed tokenId,
        address indexed to,
        bytes32 indexed gameId,
        bytes32 seatId,
        uint32 faceValueKrw,
        uint256 faceValueWei
    );
    event TicketUsed(uint256 indexed tokenId, address indexed owner, bytes32 indexed gateId);
    event TicketStatusChanged(uint256 indexed tokenId, TicketStatus fromStatus, TicketStatus toStatus);
    event VerifierUpdated(address indexed verifier, bytes32 attesterId);

    constructor(
        address verifier_,
        bytes32 attesterId_,
        string memory name_,
        string memory symbol_
    ) {
        if (verifier_ == address(0)) {
            revert ZeroAddress();
        }

        verifier = IDojangVerifier(verifier_);
        attesterId = attesterId_;
        name = name_;
        symbol = symbol_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(OPERATOR_ROLE, msg.sender);
    }

    function setVerifier(address verifier_, bytes32 attesterId_) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (verifier_ == address(0)) {
            revert ZeroAddress();
        }

        verifier = IDojangVerifier(verifier_);
        attesterId = attesterId_;
        emit VerifierUpdated(verifier_, attesterId_);
    }

    function isVerified(address account) public view returns (bool) {
        return verifier.isVerified(account, attesterId);
    }

    function balanceOf(address owner) external view returns (uint256) {
        if (owner == address(0)) {
            revert ZeroAddress();
        }
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) public view returns (address) {
        address owner = _owners[tokenId];
        if (owner == address(0)) {
            revert TokenNotFound(tokenId);
        }
        return owner;
    }

    function getApproved(uint256 tokenId) external view returns (address) {
        ownerOf(tokenId);
        return _tokenApprovals[tokenId];
    }

    function isApprovedForAll(address owner, address operator) public view returns (bool) {
        return _operatorApprovals[owner][operator];
    }

    function ticketMeta(uint256 tokenId) external view returns (TicketMeta memory) {
        ownerOf(tokenId);
        return _ticketMetas[tokenId];
    }

    function tokenStatus(uint256 tokenId) external view returns (TicketStatus) {
        ownerOf(tokenId);
        return _ticketStatuses[tokenId];
    }

    function transferCount(uint256 tokenId) external view returns (uint8) {
        ownerOf(tokenId);
        return _transferCounts[tokenId];
    }

    function approve(address to, uint256 tokenId) external {
        address owner = ownerOf(tokenId);
        if (msg.sender != owner && !isApprovedForAll(owner, msg.sender)) {
            revert NotAuthorized();
        }

        _tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external {
        _operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function mint(address to, TicketMeta calldata meta) external onlyRole(MINTER_ROLE) returns (uint256 tokenId) {
        if (to == address(0)) {
            revert ZeroAddress();
        }
        if (!isVerified(to)) {
            revert NotVerified(to);
        }

        tokenId = _nextTokenId++;
        _owners[tokenId] = to;
        _balances[to] += 1;
        _ticketMetas[tokenId] = meta;
        _ticketStatuses[tokenId] = TicketStatus.Issued;

        emit Transfer(address(0), to, tokenId);
        emit TicketMinted(tokenId, to, meta.gameId, meta.seatId, meta.faceValueKrw, meta.faceValueWei);
    }

    function burn(uint256 tokenId) external onlyRole(BURNER_ROLE) {
        address owner = ownerOf(tokenId);

        _clearApproval(owner, tokenId);
        _balances[owner] -= 1;
        delete _owners[tokenId];
        delete _ticketMetas[tokenId];
        delete _ticketStatuses[tokenId];
        delete _transferCounts[tokenId];

        emit Transfer(owner, address(0), tokenId);
    }

    function transferFrom(address from, address to, uint256 tokenId) public {
        if (!_isAuthorized(msg.sender, tokenId) && !hasRole(MARKET_ROLE, msg.sender)) {
            revert NotAuthorized();
        }
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public {
        transferFrom(from, to, tokenId);
        if (to.code.length > 0) {
            bytes4 received = IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data);
            if (received != IERC721Receiver.onERC721Received.selector) {
                revert TransferNotAllowed();
            }
        }
    }

    function markUsed(uint256 tokenId, bytes32 gateId) external onlyRole(GATE_ROLE) {
        address owner = ownerOf(tokenId);
        TicketStatus current = _ticketStatuses[tokenId];
        if (current != TicketStatus.Issued) {
            revert WrongStatus(current);
        }

        _setStatus(tokenId, TicketStatus.Used);
        emit TicketUsed(tokenId, owner, gateId);
    }

    function freeze(uint256 tokenId) external onlyRole(OPERATOR_ROLE) {
        ownerOf(tokenId);
        _setStatus(tokenId, TicketStatus.Frozen);
    }

    function unfreeze(uint256 tokenId) external onlyRole(OPERATOR_ROLE) {
        ownerOf(tokenId);
        TicketStatus current = _ticketStatuses[tokenId];
        if (current != TicketStatus.Frozen) {
            revert WrongStatus(current);
        }
        _setStatus(tokenId, TicketStatus.Issued);
    }

    function voidTicket(uint256 tokenId) external onlyRole(OPERATOR_ROLE) {
        ownerOf(tokenId);
        _setStatus(tokenId, TicketStatus.Voided);
    }

    function postponeTicket(uint256 tokenId, uint64 newStartTime, uint64 newTransferDeadline)
        external
        onlyRole(OPERATOR_ROLE)
    {
        ownerOf(tokenId);
        TicketMeta storage meta = _ticketMetas[tokenId];
        meta.startTime = newStartTime;
        meta.transferDeadline = newTransferDeadline;
        _setStatus(tokenId, TicketStatus.Postponed);
    }

    function reopenPostponedTicket(uint256 tokenId) external onlyRole(OPERATOR_ROLE) {
        ownerOf(tokenId);
        TicketStatus current = _ticketStatuses[tokenId];
        if (current != TicketStatus.Postponed) {
            revert WrongStatus(current);
        }
        _setStatus(tokenId, TicketStatus.Issued);
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        if (ownerOf(tokenId) != from) {
            revert NotOwner();
        }
        if (to == address(0)) {
            revert ZeroAddress();
        }
        if (!hasRole(MARKET_ROLE, msg.sender)) {
            revert TransferNotAllowed();
        }
        if (!isVerified(to)) {
            revert NotVerified(to);
        }

        TicketStatus current = _ticketStatuses[tokenId];
        if (current != TicketStatus.Issued) {
            revert WrongStatus(current);
        }

        TicketMeta memory meta = _ticketMetas[tokenId];
        if (block.timestamp > meta.transferDeadline) {
            revert TransferWindowClosed();
        }

        uint8 nextTransferCount = _transferCounts[tokenId] + 1;
        if (nextTransferCount > meta.maxTransfers) {
            revert TooManyTransfers();
        }

        _clearApproval(from, tokenId);
        _balances[from] -= 1;
        _balances[to] += 1;
        _owners[tokenId] = to;
        _transferCounts[tokenId] = nextTransferCount;

        emit Transfer(from, to, tokenId);
    }

    function _isAuthorized(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return spender == owner || _tokenApprovals[tokenId] == spender || isApprovedForAll(owner, spender);
    }

    function _clearApproval(address owner, uint256 tokenId) internal {
        if (_tokenApprovals[tokenId] != address(0)) {
            delete _tokenApprovals[tokenId];
            emit Approval(owner, address(0), tokenId);
        }
    }

    function _setStatus(uint256 tokenId, TicketStatus nextStatus) internal {
        TicketStatus previous = _ticketStatuses[tokenId];
        _ticketStatuses[tokenId] = nextStatus;
        emit TicketStatusChanged(tokenId, previous, nextStatus);
    }
}
