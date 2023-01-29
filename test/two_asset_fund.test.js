const path = require('path')

const INDEXFUND_AA_PATH = '../src/two_asset_fund.oscript'
const SHARE_DECIMALS = 1e6
const BTC_DECIMALS = 1e8
const ETH_DECIMALS = 1e6

describe('Index Fund', function () {
    this.timeout(120000)

    const responseTo = async (trigger) => this.respondTo(trigger)
    const witness = async (witnessable) => this.witness(witnessable)

    const deployFund = async (params) => witness(this.network.deployer.deployAgent(
        `{
            base_aa: "TUWQTY2FEFVQCMSEENG7T6ZK3KQRNC2T",
            params: ${JSON.stringify({...params, nonce: Date.now()})}
        }`))

    const initializeFund = async (fund) => witness(this.network.deployer.sendBytes({
        toAddress: fund,
        amount: 10000
    }))

    const alice = (title, assertions) => it('Alice ' + title, async () => await assertions(this.network.wallet.alice))
    const bob = (title, assertions) => it('Bob ' + title, async () => await assertions(this.network.wallet.bob))

    before(async () => {
        this.network = await Network.create().with
            .agent({indexfund: path.join(__dirname, INDEXFUND_AA_PATH)})
            .asset({btc: {cap: 1_000 * BTC_DECIMALS}})
            .asset({eth: {cap: 1_000 * ETH_DECIMALS}})
            .wallet({alice: {base: 1e6, btc: 100 * BTC_DECIMALS, eth: 100 * ETH_DECIMALS}})
            .wallet({bob: {base: 1e6, btc: 100 * BTC_DECIMALS, eth: 100 * ETH_DECIMALS}})
            .wallet({oracle: 1e6})
            .run()

        expect(this.network.agent.indexfund).to.be.validAddress
    })

    after(async () => {
        await this.network.stop()
    })

    describe('Initialization', () => {

        it('initializes new fund', async () => {
            const fund = await deployFund({
                portfolio: [
                    {
                        asset: this.network.asset.btc,
                        decimals: 8,
                        feed: 'BTC_USD'
                    },
                    {
                        asset: this.network.asset.eth,
                        decimals: 6,
                        feed: 'ETH_USD'
                    }
                ],
                oracle: await this.network.wallet.oracle.getAddress()
            });
            expect(fund).to.be.deployed

            const initialization = await initializeFund(fund.address)
            expect(await responseTo(initialization)).to.be.successful

            const state = await this.network.deployer.readAAStateVars(fund.address)
            expect(state.vars).to.have.a.property('asset')
        })
    })

    describe('Investing', () => {

        let fund;
        let sharesAsset;

        before(async () => {
            fund = await deployFund({
                portfolio: [
                    {
                        asset: this.network.asset.btc,
                        decimals: 8,
                        feed: 'BTC_USD'
                    },
                    {
                        asset: this.network.asset.eth,
                        decimals: 6,
                        feed: 'ETH_USD'
                    }
                ],
                oracle: await this.network.wallet.oracle.getAddress()
            });
            expect(fund).to.be.deployed
            const initialization = await initializeFund(fund.address)
            expect(await responseTo(initialization)).to.be.successful

            const state = await this.network.deployer.readAAStateVars(fund.address)
            sharesAsset = state.vars['asset']

            const priceDataFeed = await this.network.wallet.oracle.sendMulti({
                messages: [{
                    app: 'data_feed',
                    payload: {
                        BTC_USD: '10000.0',
                        ETH_USD: '1000.0'
                    }
                }]
            })
            expect(priceDataFeed.error).to.be.null
            await witness(priceDataFeed)
        })

        alice('invests 6 BTC for 60,000 share', async (wallet) => {
            const investment = await wallet.invest({
                asset: this.network.asset.btc,
                address: fund.address,
                amount: 6 * BTC_DECIMALS,
            })

            expect(investment.error).to.be.null
            expect(await responseTo(investment)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(60_000 * SHARE_DECIMALS)

            const balance = await wallet.getBalance()
            expect(balance[state.vars['asset']].pending).to.equal(60_000 * SHARE_DECIMALS)
        })

        bob('invests 20 ETH for 20,000 shares', async (wallet) => {
            const investment = await wallet.invest({
                asset: this.network.asset.eth,
                address: fund.address,
                amount: 20 * ETH_DECIMALS,
            })

            expect(investment.error).to.be.null
            expect(await responseTo(investment)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(80_000 * SHARE_DECIMALS)

            const balance = await wallet.getBalance()
            expect(balance[state.vars['asset']].pending).to.equal(20_000 * SHARE_DECIMALS)
        })

        alice('redeems 40,000 shares for 3 BTC and 10 ETH', async (wallet) => {
            const redemption = await wallet.redeem({
                address: fund.address,
                asset: sharesAsset,
                amount: 40_000 * SHARE_DECIMALS
            })

            expect(redemption.error).to.be.null
            expect(await responseTo(redemption)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(40_000 * SHARE_DECIMALS)

            const balance = await wallet.getBalance()
            expect(balance[this.network.asset.btc].pending).to.equal(3_00000000)
            expect(balance[this.network.asset.eth].pending).to.equal(10_000000)
        })

        bob('redeems 20,000 shares for 1.5 BTC and 5 ETH', async (wallet) => {
            const redemption = await wallet.redeem({
                address: fund.address,
                asset: sharesAsset,
                amount: 20_000 * SHARE_DECIMALS
            })

            expect(redemption.error).to.be.null
            expect(await responseTo(redemption)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(20_000 * SHARE_DECIMALS)

            const balance = await wallet.getBalance()
            expect(balance[this.network.asset.btc].pending).to.equal(1_50000000)
            expect(balance[this.network.asset.eth].pending).to.equal(5_000000)
        })

        alice('redeems 20,000 shares for 1.5 BTC and 5 ETH', async (wallet) => {
            const redemption = await wallet.redeem({
                address: fund.address,
                asset: sharesAsset,
                amount: 20_000 * SHARE_DECIMALS
            })

            expect(redemption.error).to.be.null
            expect(await responseTo(redemption)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(0)

            const balance = await wallet.getBalance()
            expect(balance[this.network.asset.btc].pending).to.equal(1_50000000)
            expect(balance[this.network.asset.eth].pending).to.equal(5_000000)
        })

    })
})
