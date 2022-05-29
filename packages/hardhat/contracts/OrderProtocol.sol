// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "./libs/SafeMath.sol";
import "./libs/ECDSA.sol";
import "./libs/Fabric.sol";
import "./interfaces/IModule.sol";
import "./interfaces/IERC20.sol"; 
import "./Vault.sol";

/// @notice Core contract used to create, cancel and execute orders.
contract OrderProtocol is Vault { 
    using SafeMath for uint256;

    bytes32 public constant PASS_PHRASE = "2022001812713618127252"; 

    // Events
    event OrderCreated(
        bytes32 indexed _key,
        address indexed _module,
        address[] _inputTokens,
        uint256[] _amounts,
        address _owner, 
        address _witness,
        bytes _data, 
        bytes32 _secret 
    );

    event OrderExecuted(
        bytes32 indexed _key,
        address[] _inputTokens,
        uint256[] _amounts,
        address _owner,
        address _witness,
        bytes _data,
        bytes _auxData,
        uint256 _bought
    );

    event OrderCancelled(
        bytes32 indexed _key,
        address[] _inputTokens,
        uint256[] _amounts,
        address _owner,
        address _witness,
        bytes _data
    );

    /**
     * @notice Create an order
     * @param _module - Address of the module to use for the order execution
     * @param _inputTokens - Address list of input tokens
     * @param _amounts - The list of amount deposit to the vault. This must has the same length with the input addresses list
     * @param _owner - Address of the order's owner
     * @param _witness - Address of the witness
     * @param _data - Bytes of the order's data
     */
    function createOrder( 
        address payable _module,
        address payable _owner,
        address[] memory _inputTokens,
        uint256[] memory _amounts,
        address _witness,
        bytes calldata _data,
        bytes32 _secret
    ) external payable {
        bytes32 key = keyOf(
            IModule(_module),
            _inputTokens,
            _amounts,
            _owner,
            _witness,
            _data
        );

        _depositVault(_key, _inputTokens, _amounts, owner);

        emit OrderCreated(
            key,
            _module,
            _inputTokens,
            _amounts,
            _owner,
            _witness,
            _data,
            _secret
        );
    }

    /**
     * @notice Cancel order
     * @dev The params should be the same used for the order creation
     * @param _module - Address of the module to use for the order execution
     * @param _inputTokens - Address list of input tokens
     * @param _amounts - The list of amount deposit to the vault. This must has the same length with the input addresses list
     * @param _witness - Address of the witness. 
     * @param _data - Bytes of the order's data
     */
    function cancelOrder(
        IModule _module,
        IERC20[] memory _inputTokens,
        uint256[] memory _amounts, 
        address _witness,
        bytes calldata _data
    ) external {
        bytes32 key = keyOf(
            _module,
            _inputTokens,
            _amounts,
            msg.sender,
            _witness,
            _data
        );

        uint256 amount = _pullVault(key, msg.sender);

        emit OrderCancelled(
            key,
            address(_inputToken),
            _owner,
            _witness,
            _data,
            amount
        );
    }

    /**
     * @notice Executes an order
     * @dev The sender should use the _secret to sign its own address
     * to prevent front-runnings
     * @param _module - Address of the module to use for the order execution
     * @param _inputToken - Address of the input token
     * @param _owner - Address of the order's owner
     * @param _data - Bytes of the order's data
     * @param _signature - Signature to calculate the witness
     * @param _auxData - Bytes of the auxiliar data used for the handlers to execute the order
     */
    function executeOrder(
        IModule _module,
        IERC20[] calldata _inputTokens,
        uint256[] calldata _amounts,
        address payable _owner,
        bytes calldata _data,
        bytes calldata _signature,
        bytes calldata _auxData
    ) external {
        // Calculate witness using signature
        address witness = _recoverSigner(_signature);

        bytes32 key = keyOf(
            _module,
            _inputToken,
            _owner,
            witness,
            _amount,
            _data
        );

        // Pull amount
        uint256 amount = _pullVault(key, address(_module));
        require(amount > 0, "OrderProtocol#executeOrder: INVALID_ORDER");

        uint256 bought = _module.execute(
            _inputToken,
            amount,
            _owner,
            _data,
            _auxData
        );

        emit OrderExecuted(
            key,
            address(_inputToken),
            _owner,
            witness,
            _data,
            _auxData,
            amount,
            bought
        );
    }

    /**
     * @notice Check whether an order exists or not
     * @dev Check the balance of the order
     * @param _module - Address of the module to use for the order execution
     * @param _inputToken - Address of the input token
     * @param _owner - Address of the order's owner
     * @param _witness - Address of the witness
     * @param _data - Bytes of the order's data
     * @return bool - whether the order exists or not
     */
    function existOrder(
        IModule _module,
        IERC20 _inputToken,
        address payable _owner,
        address _witness,
        uint256 _amount,
        bytes calldata _data
    ) external view returns (bool) {
        bytes32 key = keyOf(
            _module,
            _inputToken,
            _owner,
            _witness,
            _amount,
            _data
        );

        return getDeposits(key) != 0;
    }

    /**
     * @notice Check whether an order can be executed or not
     * @param _module - Address of the module to use for the order execution
     * @param _inputToken - Address of the input token
     * @param _owner - Address of the order's owner
     * @param _witness - Address of the witness
     * @param _amount - Amount of token staked by that order
     * @param _data - Bytes of the order's data
     * @param _auxData - Bytes of the auxiliar data used for the handlers to execute the order
     * @return bool - whether the order can be executed or not
     */
    function canExecuteOrder(
        IModule _module,
        IERC20 _inputToken,
        address payable _owner,
        address _witness,
        uint256 _amount,
        bytes calldata _data,
        bytes calldata _auxData
    ) external view returns (bool) {
        bytes32 key = keyOf(
            _module,
            _inputToken,
            _owner,
            _witness,
            _amount,
            _data
        );

        // Mock Pull amount
        uint256 amount = getDeposits(key);

        return _module.canExecute(
            _inputToken,
            amount,
            _data,
            _auxData
        );
    }

    /**
     * @notice Get the order's key
     * @param _module - Address of the module to use for the order execution
     * @param _inputToken - Address of the input token
     * @param _owner - Address of the order's owner
     * @param _witness - Address of the witness
     * @param _data - Bytes of the order's data
     * @return bytes32 - order's key
     */
    function keyOf(
        IModule _module,
        IERC20[] calldata _inputTokens,
        uint256[] calldata _amounts,
        address payable _owner,
        address _witness,
        bytes memory _data
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                _module,
                _inputTokens,
                _amounts,
                _owner,
                _witness,
                _data
            )
        );
    }

    function _recoverSigner(bytes memory _signature) internal view returns(address) {
        bytes32 hashMsg = keccak256(abi.encodePacked(msg.sender));
        return ECDSA.recover(
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hashMsg)
            ),
            _signature
        );
    }
}