const path = require('path')

const INDEXFUND_AA_PATH = '../src/indexfund.oscript'

describe('Index Fund', function () {
    this.timeout(120000)

    const responseTo = async (trigger) => this.respondTo(trigger)
    const witness = async (witnessable) => this.witness(witnessable)

    const deployFund = async (params) => witness(this.network.deployer.deployAgent(
        `{
			base_aa: "TQLH6GCJ3HRZLZDTQB2HT4DY2OPLUJHT",
			params: ${JSON.stringify({ ...params, nonce: Date.now() })}
		}`))

    const initializeFund = async (fund) => witness(this.network.deployer.sendBytes({
        toAddress: fund,
        amount: 10000
    }))

    before(async () => {
        this.network = await Network.create().with
            .agent({indexfund: path.join(__dirname, INDEXFUND_AA_PATH)})
            .asset({btc: {cap: 1000}})
            .asset({eth: {cap: 1000}})
            .wallet({investor1: {base: 1e6, btc: 100, eth: 100}})
            .wallet({investor2: {base: 1e6, btc: 100, eth: 100}})
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
                        BTC_USD: '20909.0',
                        ETH_USD: '1536.03'
                    }
                }]
            })
            expect(priceDataFeed.error).to.be.null
            await witness(priceDataFeed)
        })

        it('first investor buys shares', async () => {
            const investorAddress = await this.network.wallet.investor1.getAddress()

            const payment = await this.network.wallet.investor1.sendMulti({
                change_address: investorAddress,
                asset: this.network.asset.btc,
                asset_outputs: [{
                    address: fund.address,
                    amount: 10,
                }],
                base_outputs: [{
                    address: fund.address,
                    amount: 10000,
                }],
                messages: [{
                    app: 'data',
                    payload: {
                        intent: 'invest'
                    }
                }]
            })

            expect(payment.error).to.be.null

            const response = await responseTo(payment)
            expect(response).to.be.successful

            const state = await this.network.wallet.investor1.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(1e8)

            const investorBalance = await this.network.wallet.investor1.getBalance()
            expect(investorBalance[state.vars['asset']].pending).to.equal(1e8)
        })

        it('next investor buys shares', async () => {
            const investorAddress = await this.network.wallet.investor2.getAddress()

            const payment = await this.network.wallet.investor2.sendMulti({
                change_address: investorAddress,
                asset: this.network.asset.btc,
                asset_outputs: [{
                    address: fund.address,
                    amount: 5,
                }],
                base_outputs: [{
                    address: fund.address,
                    amount: 10000,
                }],
                messages: [{
                    app: 'data',
                    payload: {
                        intent: 'invest'
                    }
                }]
            })

            expect(payment.error).to.be.null

            const response = await responseTo(payment)
            expect(response).to.be.successful

            const state = await this.network.wallet.investor2.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(1.5 * 1e8)

            const investorBalance = await this.network.wallet.investor2.getBalance()
            expect(investorBalance[state.vars['asset']].pending).to.equal(0.5 * 1e8)
        })

        it('investor redeems underlying assets', async () => {
            const investorAddress = await this.network.wallet.investor1.getAddress()

            const payment = await this.network.wallet.investor1.sendMulti({
                change_address: investorAddress,
                asset: sharesAsset,
                asset_outputs: [{
                    address: fund.address,
                    amount: 0.3 * 1e8,
                }],
                base_outputs: [{
                    address: fund.address,
                    amount: 10000,
                }],
                messages: [{
                    app: 'data',
                    payload: {
                        intent: 'redeem'
                    }
                }]
            })

            expect(payment.error).to.be.null

            const response = await responseTo(payment)
            expect(response).to.be.successful

            const state = await this.network.wallet.investor1.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(1.2 * 1e8)

            const investorBalance = await this.network.wallet.investor1.getBalance()
            expect(investorBalance[this.network.asset.btc].pending).to.equal(3)
        })

    })
})