/* eslint-disable chai-friendly/no-unused-expressions */
const path = require('path')
const chai = require('chai')
const { Suite } = require('mocha')
const expect = chai.expect
const deepEqualInAnyOrder = require('deep-equal-in-any-order')
const { Testkit } = require('aa-testkit')
const { Network, Nodes, Utils } = Testkit({
	TESTDATA_DIR: path.join(process.cwd(), 'testdata')
})

global.expect = expect
global.Testkit = Testkit

global.Network = Network
global.Nodes = Nodes
global.Utils = Utils

chai.use(deepEqualInAnyOrder)

chai.use((_chai, utils) => {
	chai.Assertion.addProperty('validAddress', function () {
		const address = utils.flag(this, 'object')
		const negate = utils.flag(this, 'negate')
		const check = Utils.isValidAddress(address)
		new chai.Assertion(check).to.be.equal(!negate, !check && `'${JSON.stringify(address)}' is not valid address`)
	})

	chai.Assertion.addProperty('validUnit', function () {
		const unit = utils.flag(this, 'object')
		const negate = utils.flag(this, 'negate')
		const check = Utils.isValidBase64(unit, 44) && unit.endsWith('=')
		new chai.Assertion(check).to.be.equal(!negate, !check && `'${JSON.stringify(unit)}' is not valid unit`)
	})

	chai.Assertion.addProperty('successful', function () {
		const responseUnit = utils.flag(this, 'object')
		new chai.Assertion(responseUnit.bounced).to.be.equal(false, `Bounced with ${JSON.stringify(responseUnit.response.error)}`)
	})

	chai.Assertion.addMethod('bounced', function (bounceMessage, message) {
		const responseUnit = utils.flag(this, 'object')
		new chai.Assertion(responseUnit.bounced).to.be.equal(true, `Response ${JSON.stringify(responseUnit.response)} is not bounced`)
		new chai.Assertion(responseUnit.response.error).to.be.string(bounceMessage, message)
	})

	chai.Assertion.addProperty('deployed', function () {
		const deployment = utils.flag(this, 'object')
		new chai.Assertion(deployment.error).to.be.null
		new chai.Assertion(deployment.unit).to.be.validUnit
		new chai.Assertion(deployment.address).to.be.validAddress
	})
})

Suite.prototype.witness = async function (witnessable) {
	const result = await witnessable
	expect(result.error).to.be.null
	expect(result.unit).to.be.validUnit
	await this.network.witnessUntilStable(result.unit)
	return result
}

Suite.prototype.respondTo = async function (trigger) {
	const { response } = await this.network.getAaResponseToUnit(trigger.unit)
	return response
}
