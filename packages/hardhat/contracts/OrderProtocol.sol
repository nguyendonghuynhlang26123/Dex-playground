// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.6.8;

import "./libs/SafeMath.sol";
import "./libs/ECDSA.sol";
import "./interfaces/IModule.sol";
import "./interfaces/IERC20.sol"; 
import "./Vault.sol";
import "./access/ProtocolAccessControl.sol"; 
import "./libs/SafeERC20.sol";  

/// @notice Core contract used to create, cancel and execute orders.
contract OrderProtocol { 
    using SafeMath for uint256;

    mapping(bytes32 => uint256) _amounts;

    // Events
    event OrderCreated(
        bytes32 indexed _key,
        address indexed _module,
        address _inputToken,
        address _owner, 
        address _witness,
        uint256 _amount,
        bytes _data, 
        bytes32 _secret 
    );

    event OrderExecuted(
        bytes32 indexed _key,
        address _inputToken,
        address _owner,
        address _witness,
        bytes _data,
        bytes _auxData,
        uint256 _amount,
        uint256 _bought
    );

    event OrderCancelled(
        bytes32 indexed _key,
        address _inputToken,
        address _owner,
        address _witness,
        bytes _data,
        uint256 _amount
    );

    /**
     * @notice Create an order
     * @param _module - Address of the module to use for the order execution
     * @param _inputToken - Address of the input token
     * @param _owner - Address of the order's owner
     * @param _witness - Address of the witness
     * @param _amount - Amount of token deposited for this order
     * @param _data - Bytes of the order's data
     */
    function createOrder( 
        address payable _module,
        address _inputToken,
        address payable _owner,
        address _witness,
        uint256 _amount,
        bytes calldata _data,
        bytes32 _secret
    ) external {
        IERC20 inputToken = IERC20(_inputToken);
        bytes32 key = keyOf(
            IModule(_module),
            IERC20(inputToken),
            _owner,
            _witness,
            _amount,
            _data
        );
        
        require(_amounts[key] == 0, "OrderProtocol#createOrder: ORDER_EXISTS");
        _amounts[key] = _amount;

        emit OrderCreated(
            key,
            _module,
            _inputToken,
            _owner,
            _witness,
            _amount,
            _data,
            _secret
        );
    }

    /**
     * @notice Cancel order
     * @dev The params should be the same used for the order creation
     * @param _module - Address of the module to use for the order execution
     * @param _inputToken - Address of the input token
     * @param _owner - Address of the order's owner
     * @param _witness - Address of the witness
     * @param _amount - Amount of token deposited for this order
     * @param _data - Bytes of the order's data
     */
    function cancelOrder(
        IModule _module,
        IERC20 _inputToken,
        address payable _owner,
        address _witness,
        uint256 _amount,
        bytes calldata _data
    ) external {
        require(msg.sender == _owner, "OrderProtocol#cancelOrder: INVALID_OWNER");
        bytes32 key = keyOf(
            _module,
            _inputToken,
            _owner,
            _witness,
            _amount,
            _data
        );

        require(_amounts[key] != 0, "OrderProtocol#cancelOrder: ORDER_DOES_NOT_EXISTS");
        delete _amounts[key];

        emit OrderCancelled(
            key,
            address(_inputToken),
            _owner,
            _witness,
            _data,
            _amount
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
        IERC20 _inputToken,
        address payable _owner,
        uint256 _amount,
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
        uint256 amount = _amounts[key];
        require(amount > 0, "OrderProtocol#executeOrder: ORDER_NOT_EXISTS");
        require(_inputToken.balanceOf(_owner) >= amount, "OrderProtocol#executeOrder: INSUFFICIENT_FUND");
        require(SafeERC20.transferFrom(_inputToken, _owner, address(_module), amount), "OrderProtocol#executeOrder: Failed to perform transferFrom");

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

        return _amounts[key] != 0;
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
        uint256 amount = _amounts[key];

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
        IERC20 _inputToken,
        address payable _owner,
        address _witness,
        uint256 _amount,
        bytes memory _data
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                _module,
                _inputToken,
                _owner,
                _witness,
                _amount,
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