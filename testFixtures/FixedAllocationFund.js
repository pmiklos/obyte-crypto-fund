const {HeadlessWallet} = require("aa-testkit/src/nodes");

/**
 * @typedef {Object<string, number>} AssetOutputs
 */

/**
 * @typedef {Object} AssetPayments
 * @property {string} address
 * @property {AssetOutputs} outputs
 */

/**
 * @param {AssetPayments} payment
 * @returns {Promise<*>}
 */
HeadlessWallet.prototype.issue = async function (payment) {
    const walletAddress = await this.getAddress()
    const assetOutputs = Object.fromEntries(Object.entries(payment.outputs).map(([asset, amount]) => {
        return [asset, [{address: payment.address, amount: amount}]]
    }))
    const unit = {
        change_address: walletAddress,
        outputs_by_asset: {
            ...assetOutputs,
            ...{base: [{address: payment.address, amount: 10000}]}
        },
        messages: [{
            app: 'data',
            payload: {
                intent: 'issue'
            }
        }]
    }
    return this.sendMulti(unit);
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
