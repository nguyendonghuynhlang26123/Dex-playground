// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0; 

library OrderUtils {
    function encodeOrder(
        address _inputToken,
        address _outputToken,
        uint256 _inputAmount,
        uint256 _minOutputAmount, 
        address _owner, 
        address _witness,
        uint32 _deadline
    ) internal pure returns (bytes memory) {
        return abi.encode(
                _inputToken,
                _outputToken,
                _inputAmount,
                _minOutputAmount, 
                _owner, 
                _witness, 
                _deadline
            );
    }

    function decodeOrder(
        bytes calldata _data
    ) internal pure returns (
        address inputToken,
        address outputToken,
        uint256 inputAmount,
        uint256 minOutputAmount, 
        address owner, 
        address witness,
        uint32 deadline
    ) {
        (
            inputToken,
            outputToken,
            inputAmount,
            minOutputAmount, 
            owner, 
            witness,
            deadline
        ) = abi.decode(
            _data, (
                address,
                address,
                uint256,
                uint256, 
                address, 
                address,
                uint32 
            )
        );
    }
}