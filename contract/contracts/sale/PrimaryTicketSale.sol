// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SimpleAccessControl} from "../access/SimpleAccessControl.sol";
import {IDojangVerifier} from "../interfaces/IDojangVerifier.sol";
import {BaseballTicketNFT} from "../ticket/BaseballTicketNFT.sol";

contract PrimaryTicketSale is SimpleAccessControl {
    bytes32 public constant INVENTORY_ROLE = keccak256("INVENTORY_ROLE");

    struct SeatListing {
        bytes32 gameId;
        bytes32 seatId;
        uint64 startTime;
        uint64 transferDeadline;
        uint256 priceWei;
        uint32 faceValueKrw;
        uint16 zoneCode;
        uint8 row;
        uint8 seat;
        uint8 maxTransfers;
        uint8 maxPerWallet;
        bool reentryAllowed;
        bool active;
    }

    BaseballTicketNFT public immutable ticket;
    IDojangVerifier public immutable verifier;
    bytes32 public immutable attesterId;

    mapping(bytes32 seatKey => SeatListing listing) private _seatListings;
    mapping(bytes32 seatKey => address holder) public seatHolder;
    mapping(bytes32 gameId => mapping(address buyer => uint8 count)) public walletPurchaseCount;
    mapping(uint256 tokenId => bytes32 seatKey) public tokenSeatKey;
    mapping(uint256 tokenId => uint256 priceWei) public tokenPriceWei;

    bool private _locked;

    error NotOwner();
    error NotVerified(address account);
    error OverWalletLimit();
    error PayoutFailed();
    error ReentrantCall();
    error SeatNotForSale();
    error SeatTaken();
    error UnknownSeat();
    error WrongAmount();
    error WrongStatus(BaseballTicketNFT.TicketStatus current);

    event SeatRegistered(bytes32 indexed seatKey, bytes32 indexed gameId, bytes32 indexed seatId, uint256 priceWei);
    event SeatPurchased(bytes32 indexed seatKey, address indexed buyer, uint256 indexed tokenId, uint256 priceWei);
    event SeatRefunded(bytes32 indexed seatKey, address indexed buyer, uint256 indexed tokenId, uint256 priceWei);
    event Withdrawn(address indexed to, uint256 amount);

    modifier nonReentrant() {
        if (_locked) {
            revert ReentrantCall();
        }
        _locked = true;
        _;
        _locked = false;
    }

    constructor(address ticket_, address verifier_, bytes32 attesterId_) {
        if (ticket_ == address(0) || verifier_ == address(0)) {
            revert ZeroAddress();
        }

        ticket = BaseballTicketNFT(ticket_);
        verifier = IDojangVerifier(verifier_);
        attesterId = attesterId_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(INVENTORY_ROLE, msg.sender);
    }

    receive() external payable {}

    function seatKeyOf(bytes32 gameId, bytes32 seatId) public pure returns (bytes32) {
        return keccak256(abi.encode(gameId, seatId));
    }

    function seatListing(bytes32 seatKey) external view returns (SeatListing memory) {
        return _seatListings[seatKey];
    }

    function registerSeats(SeatListing[] calldata listings) external onlyRole(INVENTORY_ROLE) {
        for (uint256 i = 0; i < listings.length; i++) {
            SeatListing calldata listing = listings[i];
            if (listing.priceWei == 0 || !listing.active || listing.maxPerWallet == 0) {
                revert SeatNotForSale();
            }

            bytes32 seatKey = seatKeyOf(listing.gameId, listing.seatId);
            _seatListings[seatKey] = listing;
            emit SeatRegistered(seatKey, listing.gameId, listing.seatId, listing.priceWei);
        }
    }

    function setSeatActive(bytes32 seatKey, bool active) external onlyRole(INVENTORY_ROLE) {
        if (_seatListings[seatKey].priceWei == 0) {
            revert UnknownSeat();
        }

        _seatListings[seatKey].active = active;
    }

    function purchase(bytes32 seatKey) external payable nonReentrant returns (uint256 tokenId) {
        SeatListing memory listing = _seatListings[seatKey];
        if (!listing.active || listing.priceWei == 0) {
            revert SeatNotForSale();
        }
        if (seatHolder[seatKey] != address(0)) {
            revert SeatTaken();
        }
        if (msg.value != listing.priceWei) {
            revert WrongAmount();
        }
        if (!verifier.isVerified(msg.sender, attesterId)) {
            revert NotVerified(msg.sender);
        }

        uint8 nextCount = walletPurchaseCount[listing.gameId][msg.sender] + 1;
        if (nextCount > listing.maxPerWallet) {
            revert OverWalletLimit();
        }

        seatHolder[seatKey] = msg.sender;
        walletPurchaseCount[listing.gameId][msg.sender] = nextCount;

        BaseballTicketNFT.TicketMeta memory meta = BaseballTicketNFT.TicketMeta({
            gameId: listing.gameId,
            seatId: listing.seatId,
            startTime: listing.startTime,
            transferDeadline: listing.transferDeadline,
            faceValueWei: listing.priceWei,
            faceValueKrw: listing.faceValueKrw,
            zoneCode: listing.zoneCode,
            row: listing.row,
            seat: listing.seat,
            maxTransfers: listing.maxTransfers,
            reentryAllowed: listing.reentryAllowed
        });

        tokenId = ticket.mint(msg.sender, meta);
        tokenSeatKey[tokenId] = seatKey;
        tokenPriceWei[tokenId] = listing.priceWei;

        emit SeatPurchased(seatKey, msg.sender, tokenId, listing.priceWei);
    }

    function refund(uint256 tokenId) external nonReentrant {
        bytes32 seatKey = tokenSeatKey[tokenId];
        if (seatKey == bytes32(0)) {
            revert UnknownSeat();
        }
        if (ticket.ownerOf(tokenId) != msg.sender) {
            revert NotOwner();
        }
        if (seatHolder[seatKey] != msg.sender) {
            revert NotOwner();
        }

        BaseballTicketNFT.TicketStatus current = ticket.tokenStatus(tokenId);
        if (current != BaseballTicketNFT.TicketStatus.Issued) {
            revert WrongStatus(current);
        }

        SeatListing memory listing = _seatListings[seatKey];
        uint256 refundAmount = tokenPriceWei[tokenId];

        delete tokenSeatKey[tokenId];
        delete tokenPriceWei[tokenId];
        seatHolder[seatKey] = address(0);
        walletPurchaseCount[listing.gameId][msg.sender] -= 1;

        ticket.burn(tokenId);

        (bool ok,) = msg.sender.call{value: refundAmount}("");
        if (!ok) {
            revert PayoutFailed();
        }

        emit SeatRefunded(seatKey, msg.sender, tokenId, refundAmount);
    }

    function withdraw(address payable to, uint256 amount) external onlyRole(DEFAULT_ADMIN_ROLE) nonReentrant {
        if (to == address(0)) {
            revert ZeroAddress();
        }

        (bool ok,) = to.call{value: amount}("");
        if (!ok) {
            revert PayoutFailed();
        }
        emit Withdrawn(to, amount);
    }
}
