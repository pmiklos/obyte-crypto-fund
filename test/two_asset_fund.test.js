const path = require('path')

const INDEXFUND_AA_PATH = '../src/two_asset_fund.oscript'

describe('Index Fund', function () {
    this.timeout(120000)

    const responseTo = async (trigger) => this.respondTo(trigger)
    const witness = async (witnessable) => this.witness(witnessable)

    const deployFund = async (params) => witness(this.network.deployer.deployAgent(
        `{
			base_aa: "TQLH6GCJ3HRZLZDTQB2HT4DY2OPLUJHT",
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
            .asset({btc: {cap: 1000}})
            .asset({eth: {cap: 1000}})
            .wallet({alice: {base: 1e6, btc: 100, eth: 100}})
            .wallet({bob: {base: 1e6, btc: 100, eth: 100}})
            .wallet({oracle: 1e6})
            .explorer({
                port: 6680
            })
            .run()

        expect(this.network.agent.indexfund).to.be.validAddress
    })

    describe('Initialization', () => {

        it('initializes new fund', async () => {
            const fund = await deployFund({
                portfolio: [
                    {
                        asset: this.network.asset.btc,
                        feed: 'BTC_USD'
                    },
                    {
                        asset: this.network.asset.eth,
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
                        feed: 'BTC_USD'
                    },
                    {
                        asset: this.network.asset.eth,
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

        alice('invests 10 BTC for 1 share', async (wallet) => {
            const investment = await wallet.invest({
                asset: this.network.asset.btc,
                address: fund.address,
                amount: 10,
            })

            expect(investment.error).to.be.null
            expect(await responseTo(investment)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(1e8)

            const balance = await wallet.getBalance()
            expect(balance[state.vars['asset']].pending).to.equal(1e8)
        })

        bob('invests 50 ETH for 0.5 shares', async (wallet) => {
            const investment = await wallet.invest({
                asset: this.network.asset.eth,
                address: fund.address,
                amount: 50,
            })

            expect(investment.error).to.be.null
            expect(await responseTo(investment)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(1.5 * 1e8)

            const balance = await wallet.getBalance()
            expect(balance[state.vars['asset']].pending).to.equal(0.5 * 1e8)
        })

        alice('redeems 0.3 shares for 2 BTC and 10 ETH', async (wallet) => {
            const redemption = await wallet.redeem({
                address: fund.address,
                asset: sharesAsset,
                amount: 0.3 * 1e8
            })

            expect(redemption.error).to.be.null
            expect(await responseTo(redemption)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(1.2 * 1e8)

            const balance = await wallet.getBalance()
            expect(balance[this.network.asset.btc].pending).to.equal(2)
            expect(balance[this.network.asset.eth].pending).to.equal(10)
        })

        bob('redeems all of his shares for 3 BTC and 16 ETH', async (wallet) => {
            const redemption = await wallet.redeem({
                address: fund.address,
                asset: sharesAsset,
                amount: 0.5 * 1e8
            })

            expect(redemption.error).to.be.null
            expect(await responseTo(redemption)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(0.7 * 1e8)

            const balance = await wallet.getBalance()
            expect(balance[this.network.asset.btc].pending).to.equal(3)
            expect(balance[this.network.asset.eth].pending).to.equal(16)
        })

        alice('redeems the rest of her shares for 5 BTC and 24 ETH', async (wallet) => {
            const redemption = await wallet.redeem({
                address: fund.address,
                asset: sharesAsset,
                amount: 0.7 * 1e8
            })

            expect(redemption.error).to.be.null
            expect(await responseTo(redemption)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(0)

            const balance = await wallet.getBalance()
            expect(balance[this.network.asset.btc].pending).to.equal(5)
            expect(balance[this.network.asset.eth].pending).to.equal(24)
        })

    })
})
