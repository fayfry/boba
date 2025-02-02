// runner script, to create

/**
 * a simple script runner, to test the bundler and API.
 * for a simple target method, we just call the "nonce" method of the wallet itself.
 */

import { BigNumber, getDefaultProvider, Signer, Wallet } from 'ethers'
import { JsonRpcProvider } from '@ethersproject/providers'
import { SimpleAccountDeployer__factory } from '@boba/accountabstraction'
import { formatEther, keccak256, parseEther } from 'ethers/lib/utils'
import { Command } from 'commander'
import { erc4337RuntimeVersion } from '@boba/bundler_utils'
import fs from 'fs'
import { HttpRpcClient } from '@boba/bundler_sdk/dist/src/HttpRpcClient'
import { SimpleAccountAPI } from '@boba/bundler_sdk'
import { DeterministicDeployer } from '@boba/bundler_sdk/dist/src/DeterministicDeployer'
import { runBundler } from '../runBundler'
import { BundlerServer } from '../BundlerServer'

const ENTRY_POINT = '0x2DF1592238420ecFe7f2431360e224707e77fA0E'

class Runner {
  bundlerProvider!: HttpRpcClient
  walletApi!: SimpleAccountAPI

  /**
   *
   * @param provider - a provider for initialization. This account is used to fund the created wallet, but it is not the wallet or its owner.
   * @param bundlerUrl - a URL to a running bundler. must point to the same network the provider is.
   * @param walletOwner - the wallet signer account. used only as signer (not as transaction sender)
   * @param entryPointAddress - the entrypoint address to use.
   * @param index - unique salt, to allow multiple wallets with the same owner
   */
  constructor (
    readonly provider: JsonRpcProvider,
    readonly bundlerUrl: string,
    readonly walletOwner: Signer,
    readonly entryPointAddress = ENTRY_POINT,
    readonly index = 0
  ) {}

  async getAddress (): Promise<string> {
    return await this.walletApi.getCounterFactualAddress()
  }

  async init (deploymentSigner?: Signer): Promise<this> {
    const net = await this.provider.getNetwork()
    const chainId = net.chainId
    const dep = new DeterministicDeployer(this.provider)
    const walletDeployer = await dep.getDeterministicDeployAddress(
      SimpleAccountDeployer__factory.bytecode
    )
    // const walletDeployer = await new SimpleAccountDeployer__factory(this.provider.getSigner()).deploy().then(d=>d.address)
    if (!(await dep.isContractDeployed(walletDeployer))) {
      if (deploymentSigner == null) {
        console.log(
          `WalletDeployer not deployed at ${walletDeployer}. run with --deployDeployer`
        )
        process.exit(1)
      }
      const dep1 = new DeterministicDeployer(deploymentSigner.provider as any)
      await dep1.deterministicDeploy(SimpleAccountDeployer__factory.bytecode)
    }
    this.bundlerProvider = new HttpRpcClient(
      this.bundlerUrl,
      this.entryPointAddress,
      chainId
    )
    this.walletApi = new SimpleAccountAPI({
      provider: this.provider,
      entryPointAddress: this.entryPointAddress,
      factoryAddress: walletDeployer,
      owner: this.walletOwner,
      index: this.index,
      overheads: {
        // perUserOp: 100000
      }
    })
    return this
  }

  parseExpectedGas (e: Error): Error {
    // parse a custom error generated by the BundlerHelper, which gives a hint of how much payment is missing
    const match = e.message?.match(/paid (\d+) expected (\d+)/)
    if (match != null) {
      const paid = Math.floor(parseInt(match[1]) / 1e9)
      const expected = Math.floor(parseInt(match[2]) / 1e9)
      return new Error(
        `Error: Paid ${paid}, expected ${expected} . Paid ${Math.floor(
          (paid / expected) * 100
        )}%, missing ${expected - paid} `
      )
    }
    return e
  }

  async runUserOp (target: string, data: string): Promise<void> {
    const userOp = await this.walletApi.createSignedUserOp({
      target,
      data
    })
    try {
      const userOpHash = await this.bundlerProvider.sendUserOpToBundler(userOp)
      const txid = await this.walletApi.getUserOpReceipt(userOpHash)
      console.log('reqId', userOpHash, 'txid=', txid)
    } catch (e: any) {
      throw this.parseExpectedGas(e)
    }
  }
}

async function main (): Promise<void> {
  const program = new Command()
    .version(erc4337RuntimeVersion)
    .option(
      '--network <string>',
      'network name or url',
      'http://localhost:8545'
    )
    .option(
      '--mnemonic <file>',
      'mnemonic/private-key file of signer account (to fund wallet)'
    )
    .option('--bundlerUrl <url>', 'bundler URL', 'http://localhost:3000/rpc')
    .option(
      '--entryPoint <string>',
      'address of the supported EntryPoint contract',
      ENTRY_POINT
    )
    .option(
      '--deployDeployer',
      'Deploy the "wallet deployer" on this network (default for testnet)'
    )
    .option('--show-stack-traces', 'Show stack traces.')
    .option(
      '--selfBundler',
      'run bundler in-process (for debugging the bundler)'
    )

  const opts = program.parse().opts()
  const provider = getDefaultProvider(opts.network) as JsonRpcProvider
  let signer: Signer
  const deployDeployer: boolean = opts.deployDeployer
  let bundler: BundlerServer | undefined

  if (opts.selfBundler != null) {
    // todo: if node is geth, we need to fund our bundler's account:
    const signer = provider.getSigner()

    const signerBalance = await provider.getBalance(signer.getAddress())
    const account = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
    const bal = await provider.getBalance(account)
    if (bal.lt(parseEther('1')) && signerBalance.gte(parseEther('10000'))) {
      console.log('funding hardhat account', account)
      await signer.sendTransaction({
        to: account,
        value: parseEther('1').sub(bal)
      })
    }

    const argv = [
      'node',
      'exec',
      '--config',
      './localconfig/bundler.config.json'
    ]
    if (opts.entryPoint != null) {
      argv.push('--entryPoint', opts.entryPoint)
    }
    bundler = await runBundler(argv)
    await bundler.asyncStart()
  }
  if (opts.mnemonic != null) {
    signer = Wallet.fromMnemonic(
      fs.readFileSync(opts.mnemonic, 'ascii').trim()
    ).connect(provider)
  } else {
    try {
      const accounts = await provider.listAccounts()
      if (accounts.length === 0) {
        console.log('fatal: no account. use --mnemonic (needed to fund wallet)')
        process.exit(1)
      }
      // for hardhat/node, use account[0]
      signer = provider.getSigner()
      // deployDeployer = true
    } catch (e) {
      throw new Error('must specify --mnemonic')
    }
  }
  const walletOwner = new Wallet('0x'.padEnd(66, '7'))

  const index = Date.now()
  const client = await new Runner(
    provider,
    opts.bundlerUrl,
    walletOwner,
    opts.entryPoint,
    index
  ).init(deployDeployer ? signer : undefined)

  const addr = await client.getAddress()

  async function isDeployed (addr: string): Promise<boolean> {
    return await provider.getCode(addr).then((code) => code !== '0x')
  }

  async function getBalance (addr: string): Promise<BigNumber> {
    return await provider.getBalance(addr)
  }

  const bal = await getBalance(addr)
  console.log(
    'wallet address',
    addr,
    'deployed=',
    await isDeployed(addr),
    'bal=',
    formatEther(bal)
  )
  // TODO: actual required val
  const requiredBalance = parseEther('0.5')
  if (bal.lt(requiredBalance.div(2))) {
    console.log('funding wallet to', requiredBalance)
    await signer.sendTransaction({
      to: addr,
      value: requiredBalance.sub(bal)
    })
  } else {
    console.log('not funding wallet. balance is enough')
  }

  const dest = addr
  const data = keccak256(Buffer.from('nonce()')).slice(0, 10)
  console.log('data=', data)
  await client.runUserOp(dest, data)
  console.log('after run1')
  // client.walletApi.overheads!.perUserOp = 30000
  await client.runUserOp(dest, data)
  console.log('after run2')
  await bundler?.stop()
}

void main()
