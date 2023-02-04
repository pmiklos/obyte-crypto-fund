const {HeadlessWallet} = require("aa-testkit/src/nodes");

/**
 * @typedef {Object} AssetPayment
 * @property {string} address
 * @property {string} asset
 * @property {number} amount
 */

/**
 * @param {AssetPayment} payment
 * @returns {Promise<*>}
 */
HeadlessWallet.prototype.invest = async function (payment) {
    const walletAddress = await this.getAddress()
    return this.sendMulti({
        change_address: walletAddress,
        asset: payment.asset,
        asset_outputs: [{
            address: payment.address,
            amount: payment.amount,
        }],
        base_outputs: [{
            address: payment.address,
            amount: 10000,
        }],
        messages: [{
            app: 'data',
            payload: {
                intent: 'invest'
            }
        }]
    })
}

/**
 * @param {AssetPayment} payment
 * @returns {Promise<*>}
 */
HeadlessWallet.prototype.redeem = async function (payment) {
    const walletAddress = await this.getAddress()
    return this.sendMulti({
        change_address: walletAddress,
        asset: payment.asset,
        asset_outputs: [{
            address: payment.address,
            amount: payment.amount,
        }],
        base_outputs: [{
            address: payment.address,
            amount: 10000,
        }],
        messages: [{
            app: 'data',
            payload: {
                intent: 'redeem'
            }
        }]
    })
}
