// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./Vault.sol";
import "./interfaces/IExchangeHandler.sol"; 
import "./libs/OrderUtils.sol";


contract ProtocolCore is Vault {
    using SafeMath for uint256; 
    
    // Events 
    event OrderSubmited(
        bytes32 indexed key,  
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        uint256 outputAmount, 
        address indexed owner, 
        address _witness,
        uint32 deadline,
        bytes32 secret
    );

    event OrderCanceled(
        bytes32 indexed key,  
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        uint256 outputAmount, 
        address indexed owner, 
        address _witness,
        uint32 deadline
    );

    event OrderExecuted(
        bytes32 indexed key,
        address exchangeHandler,
        uint256 bought, 
        bytes relayData
    ); 

    receive() external payable {
        require(
            msg.sender != tx.origin, 
            "ProtocolContract: NO_SEND_ETH_PLEASE"
        );
    }

    function createTokenOrder(
        address _inputToken,
        address _outputToken,
        uint256 _inputAmount,
        uint256 _minOutputAmount, 
        address _owner, 
        address _witness, 
        uint32 _deadline,
        bytes32 _secret
    ) public { 
        bytes32 key = keyOf(
            IERC20(_inputToken), 
            IERC20(_outputToken), 
            _inputAmount, 
            _minOutputAmount,
            _owner,
            _witness, 
            _deadline
        );

        _depositVault(key, _inputToken, _owner, _inputAmount);

        emit OrderSubmited(key, _inputToken, _outputToken, _inputAmount, _minOutputAmount, _owner, _witness, _deadline, _secret);
    }

    function cancelOrder(
        address _inputToken,
        address _outputToken,
        uint256 _inputAmount,
        uint256 _minOutputAmount, 
        address _owner, 
        address _witness, 
        uint32 _deadline
    ) public { 
        bytes32 key = keyOf(
            IERC20(_inputToken), 
            IERC20(_outputToken), 
            _inputAmount, 
            _minOutputAmount,
            _owner,
            _witness, 
            _deadline
        );

        _pullVault(key, _owner);

        emit OrderCanceled(key, _inputToken, _outputToken, _inputAmount, _minOutputAmount, _owner, _witness, _deadline);
    }

    function executeOrder( 
        address _handler,
        bytes calldata _orderData,
        bytes calldata _relayData,
        bytes calldata _signature
    ) external {
        // Calculate witness using signature
        address signer = _recoverSigner(_signature);

        (
            ,
            address outputToken,
            ,
            uint256 minOutputAmount, 
            address owner, 
            address witness,
        ) = OrderUtils.decodeOrder(_orderData); 

        require(signer == witness, "ProtocolContract: INVALID_WITNESS");

        // 1. transfer all funds deposited in the vault to the handler and let it handle the rest ...
        bytes32 key = keccak256(_orderData);
        _pullVault(key, _handler);
        
        // 2. Let handler handle the rest...
        IExchangeHandler(_handler).handleExchange(_orderData, _relayData);

        // 3. Verify that this contract received the output 
        uint256 bought = IERC20(outputToken).balanceOf(address(this));
        require(bought >= minOutputAmount, "ProtocolContract: INSUFICIENT_BOUGHT_TOKENS");

        // 4. Transfer the oup to the user
        IERC20(outputToken).transfer(owner, bought);
        
        emit OrderExecuted( key, _handler, bought, _relayData); 
    }

    function encodeOrder(
        address _inputToken,
        address _outputToken,
        uint256 _inputAmount,
        uint256 _minOutputAmount, 
        address _owner, 
        address _witness,
        uint32 _deadline
    ) public pure returns (bytes memory) { 
        return OrderUtils.encodeOrder(
                _inputToken,
                _outputToken,
                _inputAmount,
                _minOutputAmount, 
                _owner, 
                _witness, 
                _deadline
            );
    }

    function _recoverSigner(bytes calldata _signature) internal returns(address) {
        bytes32 hashMsg = keccak256(abi.encodePacked(msg.sender));
        return ECDSA.recover(
            keccak256(
                abi.encodePacked("\x19Ethereum Signed Message:\n32", hashMsg)
            ),
            _signature
        );
    }

    /**
     * @notice Get the order's key
     * @param _inputToken - Address of the input token
     * @param _outputToken - Address of the output token
     * @param _inputAmount - Amount of token used for this order
     * @param _minOutputAmount - Amount of token user demands to receive
     * @param _owner - Address of the order's owner 
     * @param _witness - Witness account - Usually protocol predefined addresses 
     * @param _deadline - Order deadline
     * @return bytes32 - order's key
     */
    function keyOf(
        IERC20 _inputToken, 
        IERC20 _outputToken,
        uint256 _inputAmount,
        uint256 _minOutputAmount, 
        address _owner, 
        address _witness, 
        uint32 _deadline
    ) public pure returns (bytes32) {
        return keccak256(
            abi.encode(
                _inputToken,
                _outputToken,
                _inputAmount,
                _minOutputAmount, 
                _owner, 
                _witness, 
                _deadline
            )
        );
    }
}