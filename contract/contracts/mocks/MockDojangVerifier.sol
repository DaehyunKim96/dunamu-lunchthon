// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {SimpleAccessControl} from "../access/SimpleAccessControl.sol";
import {IDojangVerifier} from "../interfaces/IDojangVerifier.sol";

contract MockDojangVerifier is SimpleAccessControl, IDojangVerifier {
    bool public defaultVerified;
    mapping(address account => mapping(bytes32 attesterId => bool verified)) private _verified;

    event DefaultVerifiedChanged(bool value);
    event VerifiedChanged(address indexed account, bytes32 indexed attesterId, bool verified);

    constructor(bool defaultVerified_) {
        defaultVerified = defaultVerified_;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function isVerified(address account, bytes32 attesterId) external view returns (bool) {
        return defaultVerified || _verified[account][attesterId];
    }

    function setDefaultVerified(bool value) external onlyRole(DEFAULT_ADMIN_ROLE) {
        defaultVerified = value;
        emit DefaultVerifiedChanged(value);
    }

    function setVerified(address account, bytes32 attesterId, bool verified) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (account == address(0)) {
            revert ZeroAddress();
        }

        _verified[account][attesterId] = verified;
        emit VerifiedChanged(account, attesterId, verified);
    }
}
