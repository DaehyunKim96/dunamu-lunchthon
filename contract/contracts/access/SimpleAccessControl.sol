// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

abstract contract SimpleAccessControl {
    bytes32 public constant DEFAULT_ADMIN_ROLE = 0x00;

    mapping(bytes32 role => mapping(address account => bool granted)) private _roles;

    error MissingRole(bytes32 role, address account);
    error ZeroAddress();

    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);

    modifier onlyRole(bytes32 role) {
        if (!hasRole(role, msg.sender)) {
            revert MissingRole(role, msg.sender);
        }
        _;
    }

    function hasRole(bytes32 role, address account) public view returns (bool) {
        return _roles[role][account];
    }

    function grantRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _grantRole(role, account);
    }

    function revokeRole(bytes32 role, address account) external onlyRole(DEFAULT_ADMIN_ROLE) {
        if (_roles[role][account]) {
            _roles[role][account] = false;
            emit RoleRevoked(role, account, msg.sender);
        }
    }

    function _grantRole(bytes32 role, address account) internal {
        if (account == address(0)) {
            revert ZeroAddress();
        }

        if (!_roles[role][account]) {
            _roles[role][account] = true;
            emit RoleGranted(role, account, msg.sender);
        }
    }
}
