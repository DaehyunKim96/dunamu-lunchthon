// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IDojangVerifier} from "../interfaces/IDojangVerifier.sol";
import {BaseballTicketNFT} from "../ticket/BaseballTicketNFT.sol";

contract TicketTransferMarket {
    struct Listing {
        address seller;
        uint256 priceWei;
        uint64 listedAt;
        bool active;
    }

    BaseballTicketNFT public immutable ticket;
    IDojangVerifier public immutable verifier;
    bytes32 public immutable attesterId;

    mapping(uint256 tokenId => Listing listing) public listings;
    bool private _locked;

    error NotListed();
    error NotOwner();
    error NotVerified(address account);
    error PayoutFailed();
    error PriceTooHigh();
    error ReentrantCall();
    error WrongAmount();
    error WrongStatus(BaseballTicketNFT.TicketStatus current);
    error ZeroAddress();

    event TicketListed(uint256 indexed tokenId, address indexed seller, uint256 priceWei);
    event TicketUnlisted(uint256 indexed tokenId, address indexed seller);
    event TicketTransferred(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 priceWei);

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
    }

    function list(uint256 tokenId, uint256 priceWei) external {
        if (ticket.ownerOf(tokenId) != msg.sender) {
            revert NotOwner();
        }

        BaseballTicketNFT.TicketStatus current = ticket.tokenStatus(tokenId);
        if (current != BaseballTicketNFT.TicketStatus.Issued) {
            revert WrongStatus(current);
        }

        BaseballTicketNFT.TicketMeta memory meta = ticket.ticketMeta(tokenId);
        if (priceWei == 0 || priceWei > meta.faceValueWei) {
            revert PriceTooHigh();
        }

        listings[tokenId] = Listing({
            seller: msg.sender,
            priceWei: priceWei,
            listedAt: uint64(block.timestamp),
            active: true
        });

        emit TicketListed(tokenId, msg.sender, priceWei);
    }

    function cancelListing(uint256 tokenId) external {
        Listing memory listing = listings[tokenId];
        if (!listing.active) {
            revert NotListed();
        }
        if (listing.seller != msg.sender) {
            revert NotOwner();
        }

        delete listings[tokenId];
        emit TicketUnlisted(tokenId, msg.sender);
    }

    function buy(uint256 tokenId) external payable nonReentrant {
        Listing memory listing = listings[tokenId];
        if (!listing.active) {
            revert NotListed();
        }
        if (msg.value != listing.priceWei) {
            revert WrongAmount();
        }
        if (!verifier.isVerified(msg.sender, attesterId)) {
            revert NotVerified(msg.sender);
        }
        if (ticket.ownerOf(tokenId) != listing.seller) {
            revert NotOwner();
        }

        delete listings[tokenId];

        ticket.safeTransferFrom(listing.seller, msg.sender, tokenId);

        (bool ok,) = listing.seller.call{value: msg.value}("");
        if (!ok) {
            revert PayoutFailed();
        }

        emit TicketTransferred(tokenId, listing.seller, msg.sender, listing.priceWei);
    }

    function priceCeilingOf(uint256 tokenId) external view returns (uint256) {
        BaseballTicketNFT.TicketMeta memory meta = ticket.ticketMeta(tokenId);
        return meta.faceValueWei;
    }
}
