// SPDX-License-Identifier: MIT
// OpenZeppelin Contracts v4.4.1 (access/Ownable.sol)
pragma solidity ^0.6.8;  
import "./Roles.sol";

abstract contract ProtocolAccessControl {
    using Roles for Roles.Role;
    
    address private _owner;
    Roles.Role private _relayers;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);
    event RelayerRoleGranted(address indexed account);
    event RelayerRoleRevoked(address indexed account);

    /**
     * @dev Initializes the contract setting the deployer as the initial owner.
     */
    constructor() public {
        _transferOwnership(msg.sender);
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    /**
     * @dev Throws if called by any account other than the owner.
     */
    modifier onlyRelayers() {
        _checkRelayers();
        _;
    }

    /**
     * @dev Returns the address of the current owner.
     */
    function owner() public view virtual returns (address) {
        return _owner;
    }

    /**
     * @dev Throws if the sender is not the owner.
     */
    function _checkOwner() internal view virtual {
        require(owner() == msg.sender, "Ownable: caller is not the owner");
    }

    /**
     * @dev Throws if the sender is not one of relayers.
     */
    function _checkRelayers() internal view virtual {
        require(_relayers.has(msg.sender), "Ownable: caller is not the one of relayers");
    }

    /**
     * @dev Leaves the contract without owner. It will not be possible to call
     * `onlyOwner` functions anymore. Can only be called by the current owner.
     *
     * NOTE: Renouncing ownership will leave the contract without an owner,
     * thereby removing any functionality that is only available to the owner.
     */
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Can only be called by the current owner.
     */
    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    /**
     * @dev Transfers ownership of the contract to a new account (`newOwner`).
     * Internal function without access restriction.
     */
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }

    /**
     * @dev Grants role Relayer to `account`. 
     */
    function grantRelayerRole(address account) public virtual onlyOwner {
        if (!_relayers.has(account)) {
            _relayers.add(account);
            emit RelayerRoleGranted(account);
        }
    }

    /**
     * @dev Revoked Relayer role of `account`. 
     */
    function revokeRelayerRole(address account) public virtual onlyOwner {
        if (_relayers.has(account)) {
            _relayers.remove(account);
            emit RelayerRoleRevoked(account);
        }
    }
}