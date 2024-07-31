import { InputGenerateTransactionPayloadData, Network } from '@aptos-labs/ts-sdk';
import { Mizu } from '@mizuwallet-sdk/core';
import Postmate from 'postmate';
import { MizuSupportNetwork } from '../config';

const PRO_ORIGIN = 'https://mizu.io';
// TODO: deploy testnet only env
const DEV_ORIGIN = 'https://dev.fuzzwallet.com:7654';

const initStyles = () => {
  const style = document.createElement('style');
  style.innerHTML = `
	  .mizu-wallet-frame {
		position: fixed;
		top: 0;
		left: 0;
		width: 100vw;
		height: 100vh;
		border: none;
		z-index: 999999999;
		inset: 0px;
		color-scheme: light;
	  }
	`;
  document.head.appendChild(style);
};

class WebsiteHelper {
  authCode: string;
  manifestURL: string;
  network: string;
  mizuClient: Mizu;
  provider: any;
  origin: string;

  /**
   *
   * @param args.manifestURL Manifest URL
   */
  constructor(args: { manifestURL: string; network: MizuSupportNetwork; mizuClient: Mizu }) {
    if (!args.manifestURL) throw new Error('manifestURL is required');

    // TODO: manifestURL check

    this.authCode = '';
    this.manifestURL = args.manifestURL;
    this.network = args.network;
    this.mizuClient = args.mizuClient;
    this.origin = args.network === Network.MAINNET ? PRO_ORIGIN : DEV_ORIGIN;

    initStyles();
  }

  async connect() {
    // In React, it will definitely run twice.
    // the reject will definitely triggered.

    // if (document.querySelector('[name=mizu-wallet-login]')) {
    //   return Promise.reject('Already start login process');
    // }

    /**
     * Init Postmate iframe
     *
     * Check if user is logged in first.
     */
    const handshake = await new Postmate({
      container: document.body, // Element to inject frame into
      url: `${this.origin}/wallet/checkLogin?network=${this.network}`,
      name: 'mizu-wallet-login',
      classListArray: ['mizu-wallet-frame', 'mizu-wallet-login-frame'],
      model: {
        manifestURL: this.manifestURL,
        network: this.network,
        appId: this.mizuClient.appId,
      },
    });

    /**
     * Wait for handshake to complete
     * And listen for events to get user data(sessionID, address, etc.)
     */
    handshake.on('close-frame', () => {
      handshake.destroy();
    });

    return new Promise<{ address: string; publicKey: string }>((resolve, _) => {
      handshake.on('login', (data: any) => {
        this.authCode = data.code;

        resolve({
          address: data.address,
          publicKey: '',
        });
      });
    });
  }

  async disconnect() {
    /**
     * Init Postmate iframe
     * Remove session
     */
    const handshake = await new Postmate({
      container: document.body, // Element to inject frame into
      url: `${this.origin}/wallet/logout?network=${this.network}`,
      name: 'mizu-wallet-logout',
      classListArray: ['mizu-wallet-frame', 'mizu-wallet-logout-frame'],
      model: {
        manifestURL: this.manifestURL,
        network: this.network,
        appId: this.mizuClient.appId,
      },
    });

    /**
     * Wait for handshake to complete
     * And listen for events to get user data(sessionID, address, etc.)
     */
    handshake.on('close-frame', () => {
      handshake.destroy();
    });

    await this.mizuClient?.logout();
  }

  async signAndSubmitTransaction(transaction: InputGenerateTransactionPayloadData) {
    /**
     * Init Postmate iframe
     * Check if user is logged in first.
     *
     * if it is, direct to create order.
     * Create order and confirm it.
     *
     * send code, payload
     */
    try {
      // create order by code
      const orderId = await this.mizuClient?.createOrderWithCode({
        code: this.authCode,
        payload: transaction,
      });

      if (!orderId) throw new Error('Transaction creation failed');

      /**
       * Init Postmate iframe
       *
       * Check if user is logged in first.
       */
      const handshake = await new Postmate({
        container: document.body, // Element to inject frame into
        url: `${this.origin}/wallet/checkLogin?redirect_url=${encodeURIComponent('/wallet/transaction')}&network=${this.network}`,
        name: 'mizu-wallet-login',
        classListArray: ['mizu-wallet-frame', 'mizu-wallet-sign-frame'],
        model: {
          manifestURL: this.manifestURL,
          network: this.network,
          appId: this.mizuClient.appId,
          transactionInfo: {
            orderId: orderId,
            payload: transaction,
          },
        },
      });

      handshake.on('close-frame', () => {
        handshake.destroy();
      });

      handshake.on('cancel', () => {
        throw new Error(`User Canceled`);
      });

      return new Promise<{ hash: string }>((resolve, reject) => {
        handshake.on('submitted', (data: any) => {
          if (data.error) {
            return reject(data.error);
          }

          resolve({
            hash: data.transactions?.filter((tx: any) => tx.type === 2)?.[0]?.hash || '',
          });
        });
      });
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  }
}

export default WebsiteHelper;

