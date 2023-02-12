const path = require('path')

const INDEXFUND_AA_PATH = '../src/TwoAssetFixedAllocationFund.oscript'
const BTC_DECIMALS = 1e8
const ETH_DECIMALS = 1e6
const BNB_DECIMALS = 1e6

describe('Two Asset Fixed Allocation Fund', function () {
    this.timeout(120000)

    const responseTo = async (trigger) => this.respondTo(trigger)
    const witness = async (witnessable) => this.witness(witnessable)

    const deployer = (title, assertions) => it('Deployer ' + title, async () => await assertions(this.network.deployer))
    const alice = (title, assertions) => it('Alice ' + title, async () => await assertions(this.network.wallet.alice))
    const bob = (title, assertions) => it('Bob ' + title, async () => await assertions(this.network.wallet.bob))

    before(async () => {
        this.network = await Network.create().with
            .agent({baseFund: path.join(__dirname, INDEXFUND_AA_PATH)})
            .asset({btc: {cap: 1_000 * BTC_DECIMALS}})
            .asset({eth: {cap: 1_000 * ETH_DECIMALS}})
            .asset({bnb: {cap: 1_000 * BNB_DECIMALS}})
            .wallet({alice: {base: 1e6, btc: 500 * BTC_DECIMALS, eth: 500 * ETH_DECIMALS, bnb: 500 * BNB_DECIMALS}})
            .wallet({bob: {base: 1e6, btc: 500 * BTC_DECIMALS, eth: 500 * ETH_DECIMALS}})
            .run()

        expect(this.network.agent.baseFund).to.be.validAddress
        this.baseFund = this.network.agent.baseFund

        this.bitcoinEthereumPortfolio = {
            portfolio: [
                {
                    asset: this.network.asset.btc,
                    percentage: 21_000_000 * BTC_DECIMALS / (21_000_000 * BTC_DECIMALS + 119_000_000 * ETH_DECIMALS)
                },
                {
                    asset: this.network.asset.eth,
                    percentage: 119_000_000 * ETH_DECIMALS / (21_000_000 * BTC_DECIMALS + 119_000_000 * ETH_DECIMALS)
                }
            ]
        }
    })

    after(async () => {
        await this.network.stop()
    })

    describe('Initialization', () => {

        let fund

        deployer('deploys new fund', async (wallet) => {
            fund = await witness(wallet.deployFund(this.baseFund, this.bitcoinEthereumPortfolio))
            expect(fund).to.be.deployed
        })

        deployer('initializes new fund', async (wallet) => {
            const initialization = await witness(wallet.initializeFund(fund.address))
            expect(await responseTo(initialization)).to.be.successful

            const state = await this.network.deployer.readAAStateVars(fund.address)
            expect(state.vars).to.have.a.property('asset')
        })
    })

    describe('Issuing and Redeeming', () => {

        let fund, sharesAsset

        before(async () => {
            fund = await witness(this.network.deployer.deployFund(this.baseFund, this.bitcoinEthereumPortfolio))
            expect(fund).to.be.deployed
            const initialization = await witness(this.network.deployer.initializeFund(fund.address))
            expect(await responseTo(initialization)).to.be.successful

            const state = await this.network.deployer.readAAStateVars(fund.address)
            sharesAsset = state.vars['asset']
        })

        alice('issues shares for 15 BTC and 85 ETH', async (wallet) => {
            const issuance = await wallet.issue({
                address: fund.address,
                outputs: {
                    [this.network.asset.btc]: 15 * BTC_DECIMALS,
                    [this.network.asset.eth]: 85 * ETH_DECIMALS
                }
            })

            expect(issuance.error).to.be.null
            expect(await responseTo(issuance)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(1585000000)

            const balance = await wallet.getBalance()
            expect(balance[state.vars['asset']].pending).to.equal(1585000000)
        })

        bob('issues shares 30 BTC and 170 ETH', async (wallet) => {
            const issuance = await wallet.issue({
                address: fund.address,
                outputs: {
                    [this.network.asset.btc]: 30 * BTC_DECIMALS,
                    [this.network.asset.eth]: 170 * ETH_DECIMALS
                }
            })

            expect(issuance.error).to.be.null
            expect(await responseTo(issuance)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(4755000000)

            const balance = await wallet.getBalance()
            expect(balance[state.vars['asset']].pending).to.equal(3170000000)
        })

        alice('burns 20% of her shares to redeem 3 BTC and 17 ETH', async (wallet) => {
            const redemption = await wallet.redeem({
                address: fund.address,
                asset: sharesAsset,
                amount: 317000000
            })

            expect(redemption.error).to.be.null
            expect(await responseTo(redemption)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(4438000000)

            const balance = await wallet.getBalance()
            expect(balance[this.network.asset.btc].pending).to.equal(3_00000000)
            expect(balance[this.network.asset.eth].pending).to.equal(17_000000)
        })

        bob('burns all his shares to redeem 30 BTC and 170 ETH', async (wallet) => {
            const redemption = await wallet.redeem({
                address: fund.address,
                asset: sharesAsset,
                amount: 3170000000
            })

            expect(redemption.error).to.be.null
            expect(await responseTo(redemption)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(1268000000)

            const balance = await wallet.getBalance()
            expect(balance[this.network.asset.btc].pending).to.equal(30_00000000)
            expect(balance[this.network.asset.eth].pending).to.equal(170_000000)
        })

        alice('burns rest of her shares to redeem 12 BTC and 68 ETH', async (wallet) => {
            const redemption = await wallet.redeem({
                address: fund.address,
                asset: sharesAsset,
                amount: 1268000000
            })

            expect(redemption.error).to.be.null
            expect(await responseTo(redemption)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(0)

            const balance = await wallet.getBalance()
            expect(balance[this.network.asset.btc].pending).to.equal(12_00000000)
            expect(balance[this.network.asset.eth].pending).to.equal(68_000000)
        })

    })

    describe('Assets should be fully redeemable', () => {

        let fund, sharesAsset

        before(async () => {
            fund = await witness(this.network.deployer.deployFund(this.baseFund, this.bitcoinEthereumPortfolio))
            expect(fund).to.be.deployed
            const initialization = await witness(this.network.deployer.initializeFund(fund.address))
            expect(await responseTo(initialization)).to.be.successful

            const state = await this.network.deployer.readAAStateVars(fund.address)
            sharesAsset = state.vars['asset']
        })

        alice('issues shares for 15 BTC and 85 ETH', async (wallet) => {
            const issuance = await wallet.issue({
                address: fund.address,
                outputs: {
                    [this.network.asset.btc]: 15 * BTC_DECIMALS,
                    [this.network.asset.eth]: 85 * ETH_DECIMALS
                }
            })

            expect(issuance.error).to.be.null
            const issuanceResponse = await responseTo(issuance)
            expect(issuanceResponse).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(1585000000)

            const balance = await wallet.getBalance()
            expect(balance[state.vars['asset']].pending).to.equal(1585000000)

            await this.network.witnessUntilStable(issuanceResponse.response_unit)
        })

        alice('burns all but 1 share', async (wallet) => {
            const redemption = await wallet.redeem({
                address: fund.address,
                asset: sharesAsset,
                amount: 1585000000 - 1
            })

            expect(redemption.error).to.be.null
            expect(await responseTo(redemption)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(1)

            const balance = await wallet.getBalance()
            expect(balance[this.network.asset.btc].pending).to.equal(14_99999999)
            expect(balance[this.network.asset.eth].pending).to.equal(84_999999)
        })


        alice('burns last share', async (wallet) => {
            const redemption = await wallet.redeem({
                address: fund.address,
                asset: sharesAsset,
                amount: 1
            })

            expect(redemption.error).to.be.null
            expect(await responseTo(redemption)).to.be.successful

            const state = await wallet.readAAStateVars(fund.address)
            expect(state.vars['total_shares']).to.equal(0)

            const balance = await wallet.getBalance()
            expect(balance[this.network.asset.btc].pending).to.equal(1)
            expect(balance[this.network.asset.eth].pending).to.equal(1)
        })
    })

    describe('Assets should be added in fixed ratio', () => {

        let fund

        before(async () => {
            fund = await witness(this.network.deployer.deployFund(this.baseFund, this.bitcoinEthereumPortfolio))
            expect(fund).to.be.deployed
            const initialization = await witness(this.network.deployer.initializeFund(fund.address))
            expect(await responseTo(initialization)).to.be.successful
        })

        alice('pays in the wrong ratio', async (wallet) => {
            const issuance = await wallet.issue({
                address: fund.address,
                outputs: {
                    [this.network.asset.btc]: 14 * BTC_DECIMALS,
                    [this.network.asset.eth]: 85 * ETH_DECIMALS
                }
            })
            expect(issuance.error).to.be.null
            expect(await responseTo(issuance)).to.be.bounced('Incorrect ratio of assets coins received')
        })

        alice('pays in wrong assets', async (wallet) => {
            const issuance = await wallet.issue({
                address: fund.address,
                outputs: {
                    [this.network.asset.bnb]: 100
                }
            })
            expect(issuance.error).to.be.null
            expect(await responseTo(issuance)).to.be.bounced('No portfolio assets received')
        })

        alice('redeems with wrong token', async (wallet) => {
            const redemption = await wallet.redeem({
                address: fund.address,
                asset: this.network.asset.bnb,
                amount: 1
            })

            expect(redemption.error).to.be.null
            expect(await responseTo(redemption)).to.be.bounced('No shares returned')
        })
    })
})