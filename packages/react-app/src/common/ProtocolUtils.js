/**
 * Check order:
 * - If X token => Y WETH
 *   => Match when token X = Y + exec_cost
 *   => State:
 *        . exec_cost >= Y => WARNING: Amount receive may smaller than paid cost
 *        . exec_cost < Y =>
 * 1 ONE => 0.1 ETH + 0.06 fee
 *   => weth_received = f{x->y}(token) -
 *
 * - X Token => Y Token
 * X => E' ETH; (E' - exec_cost) => Y
 *
 */
