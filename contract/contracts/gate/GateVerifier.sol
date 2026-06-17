// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SimpleAccessControl} from "../access/SimpleAccessControl.sol";
import {BaseballTicketNFT} from "../ticket/BaseballTicketNFT.sol";

contract GateVerifier is SimpleAccessControl {
    bytes32 public constant GATE_SIGNER_ROLE = keccak256("GATE_SIGNER_ROLE");

    bytes32 private constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 private constant GATE_PASS_TYPEHASH =
        keccak256("GatePass(uint256 tokenId,address ownerAtSign,uint64 expiry,bytes32 nonce,bytes32 gateId)");

    struct GatePass {
        uint256 tokenId;
        address ownerAtSign;
        uint64 expiry;
        bytes32 nonce;
        bytes32 gateId;
    }

    BaseballTicketNFT public immutable ticket;
    uint256 private immutable _domainChainId;
    bytes32 private immutable _domainSeparator;

    mapping(bytes32 nonce => bool used) public usedNonce;

    error BadSignature();
    error BadSigner(address signer);
    error NonceUsed(bytes32 nonce);
    error OwnerChanged();
    error PassExpired();

    event GateRedeemed(uint256 indexed tokenId, address indexed owner, bytes32 indexed gateId, bytes32 nonce);

    constructor(address ticket_, address initialSigner) {
        if (ticket_ == address(0) || initialSigner == address(0)) {
            revert ZeroAddress();
        }

        ticket = BaseballTicketNFT(ticket_);
        _domainChainId = block.chainid;
        _domainSeparator = _buildDomainSeparator();

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GATE_SIGNER_ROLE, initialSigner);
    }

    function domainSeparator() public view returns (bytes32) {
        if (block.chainid == _domainChainId) {
            return _domainSeparator;
        }
        return _buildDomainSeparator();
    }

    function hashGatePass(GatePass calldata pass) public view returns (bytes32) {
        bytes32 structHash = keccak256(
            abi.encode(
                GATE_PASS_TYPEHASH,
                pass.tokenId,
                pass.ownerAtSign,
                pass.expiry,
                pass.nonce,
                pass.gateId
            )
        );
        return keccak256(abi.encodePacked("\x19\x01", domainSeparator(), structHash));
    }

    function redeem(GatePass calldata pass, bytes calldata signature) external {
        if (block.timestamp > pass.expiry) {
            revert PassExpired();
        }
        if (usedNonce[pass.nonce]) {
            revert NonceUsed(pass.nonce);
        }

        address signer = _recover(hashGatePass(pass), signature);
        if (!hasRole(GATE_SIGNER_ROLE, signer)) {
            revert BadSigner(signer);
        }
        if (ticket.ownerOf(pass.tokenId) != pass.ownerAtSign) {
            revert OwnerChanged();
        }

        usedNonce[pass.nonce] = true;
        ticket.markUsed(pass.tokenId, pass.gateId);
        emit GateRedeemed(pass.tokenId, pass.ownerAtSign, pass.gateId, pass.nonce);
    }

    function _buildDomainSeparator() private view returns (bytes32) {
        return keccak256(
            abi.encode(
                DOMAIN_TYPEHASH,
                keccak256(bytes("Proof-of-Fandom GateVerifier")),
                keccak256(bytes("1")),
                block.chainid,
                address(this)
            )
        );
    }

    function _recover(bytes32 digest, bytes calldata signature) private pure returns (address) {
        if (signature.length != 65) {
            revert BadSignature();
        }

        bytes32 r;
        bytes32 s;
        uint8 v;
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 0x20))
            v := byte(0, calldataload(add(signature.offset, 0x40)))
        }

        if (v < 27) {
            v += 27;
        }
        if (v != 27 && v != 28) {
            revert BadSignature();
        }

        address signer = ecrecover(digest, v, r, s);
        if (signer == address(0)) {
            revert BadSignature();
        }
        return signer;
    }
}
