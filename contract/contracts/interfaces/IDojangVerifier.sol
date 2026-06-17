// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

interface IDojangVerifier {
    function isVerified(address addr, bytes32 attesterId) external view returns (bool);
}
