import {
  AccountInfo,
  AdapterPlugin,
  AptosWalletErrorResult,
  Network,
  NetworkInfo,
  SignMessagePayload,
  SignMessageResponse,
  Types,
  WalletName,
  WalletReadyState,
} from '@aptos-labs/wallet-adapter-core';
import Postmate from 'postmate';
import { Mizu } from '../../../core/dist';
import { WALLET_ICON, WALLET_NAME, WALLET_WEB_URL } from '../config';

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

export const MizuWalletName = 'Mizu Wallet' as WalletName<'Mizu Wallet'>;
const ORIGIN = 'https://mizu.io';

let faviconData: any = '';
const initFavicon = async () => {
  // TODO: optimize favicon fetching
  let fav = document?.querySelector('link[rel=icon]')?.getAttribute('href');

  fav = fav ? `${window.location?.origin}${fav}` : '';
  console.log(fav);

  const readImageToBase64 = (url: string) =>
    fetch(url)
      .then((response) => response.blob())
      .then(
        (blob) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = reject;
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          }),
      );
  if (fav) {
    faviconData = await readImageToBase64(fav);
  }
};
initFavicon();

let authCode: string = '';

export class MizuWallet implements AdapterPlugin {
  readonly url = WALLET_WEB_URL;
  readonly name = WALLET_NAME;
  readonly icon = WALLET_ICON;

  provider: Mizu | undefined;
  readyState: WalletReadyState = WalletReadyState.Installed;

  constructor(args: { appId: string; network: Network.MAINNET | Network.TESTNET }) {
    if (!args.appId) throw new Error('MizuWallet: appId is required');
    if (!args.network) throw new Error('MizuWallet: network is required');

    this.provider = new Mizu({
      appId: args.appId,
      network: args.network,
    });

    initStyles();
  }

  async connect(): Promise<AccountInfo> {
    try {
      if (document.querySelector('[name=mizu-wallet-login]')) {
        return Promise.reject('Already start login process');
      }
      /**
       * Init Postmate iframe
       *
       * Check if user is logged in first.
       */
      const handshake = await new Postmate({
        container: document.body, // Element to inject frame into
        url: `${ORIGIN}/wallet/checkLogin?network=${this.provider?.network}`,
        name: 'mizu-wallet-login',
        classListArray: ['mizu-wallet-frame', 'mizu-wallet-login-frame'],
        model: {
          connectInfo: {
            appId: this.provider?.appId,
            network: this.provider?.network,
          },
          website: {
            favicon: faviconData,
            origin: window.location?.origin,
            name: window.document.title,
          },
        },
      });

      /**
       * Wait for handshake to complete
       * And listen for events to get user data(sessionID, address, etc.)
       */
      handshake.on('close-frame', () => {
        handshake.destroy();
      });

      return new Promise((resolve, _) => {
        handshake.on('login', (data: any) => {
          authCode = data.code;

          resolve({
            address: data.address,
            publicKey: '',
          });
        });
      });
    } catch (error: any) {
      console.log(error);
      throw error;
    }
  }

  async account(): Promise<AccountInfo> {
    const address = await this.provider?.getUserWalletAddress();
    if (!address) throw `${MizuWalletName} Account Error`;
    return {
      address,
      publicKey: '',
    };
  }

  async disconnect(): Promise<void> {
    try {
      authCode = '';

      /**
       * Init Postmate iframe
       * Remove session
       */
      const handshake = await new Postmate({
        container: document.body, // Element to inject frame into
        url: `${ORIGIN}/wallet/logout?network=${this.provider?.network}`,
        name: 'mizu-wallet-logout',
        classListArray: ['mizu-wallet-frame', 'mizu-wallet-logout-frame'],
        model: {
          connectInfo: {
            appId: this.provider?.appId,
            network: this.provider?.network,
          },
        },
      });

      /**
       * Wait for handshake to complete
       * And listen for events to get user data(sessionID, address, etc.)
       */
      handshake.on('close-frame', () => {
        handshake.destroy();
      });

      await this.provider?.logout();
    } catch (error: any) {
      throw error;
    }
  }

  // this should be sdk maybe
  // mutation MyMutation($appId: String = "", $appId1: String = "", $authCode: String = "", $payload: String = "") {
  //   createOrderWithCode(appId: $appId1, authCode: $authCode, payload: $payload)
  // }

  async signAndSubmitTransaction(
    transaction: Types.TransactionPayload,
    options?: any,
  ): Promise<{ hash: Types.HexEncodedBytes }> {
    console.log(options);
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
      const orderId = await this.provider?.createOrderWithCode({
        code: authCode,
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
        url: `${ORIGIN}/wallet/checkLogin?redirect_url=${encodeURIComponent('/wallet/transaction')}&network=${this.provider?.network}`,
        name: 'mizu-wallet-login',
        classListArray: ['mizu-wallet-frame', 'mizu-wallet-sign-frame'],
        model: {
          connectInfo: {
            appId: this.provider?.appId,
            network: this.provider?.network,
          },
          website: {
            favicon: faviconData,
            origin: window.location?.origin,
            name: window.document.title,
          },
          transactionInfo: {
            orderId: orderId,
            payload: transaction,
          },
        },
      });

      handshake.on('close-frame', () => {
        handshake.destroy();
      });

      return new Promise((resolve, reject) => {
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
      console.log(error);
      throw error;
    }
  }

  async signMessage(message: SignMessagePayload): Promise<SignMessageResponse> {
    console.log(message);
    throw new Error('Not implemented yet') as AptosWalletErrorResult;
  }

  async signTransaction(
    transaction: Types.TransactionPayload,
    options?: any,
  ): Promise<Uint8Array | AptosWalletErrorResult> {
    console.log(transaction, options);
    throw new Error('Not implemented yet') as AptosWalletErrorResult;
  }

  async network(): Promise<NetworkInfo> {
    return {
      name: this.provider?.network!,
      chainId: '',
    };
  }

  async onNetworkChange(callback: any): Promise<void> {
    console.log(callback);
    throw new Error('Not implemented yet');
  }

  async onAccountChange(callback: any): Promise<void> {
    console.log(callback);
    throw new Error('Not implemented yet');
  }
}

