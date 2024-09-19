import {
  AccountInfo,
  AdapterPlugin,
  AptosWalletErrorResult,
  NetworkInfo,
  SignMessagePayload,
  SignMessageResponse,
  Types,
  WalletReadyState,
} from '@aptos-labs/wallet-adapter-core';
import { Mizu } from '@mizuwallet-sdk/core';
import {
  MizuSupportNetwork,
  MZ_MSG_TYPE,
  WALLET_ICON,
  WALLET_NAME,
  WALLET_WEB_URL,
} from '../src/config';
import TelegramMiniAppHelper from '../src/helpers/TelegramMiniAppHelper';
import WebsiteHelper from '../src/helpers/WebsiteHelper';
import { IsTelegram } from '../src/utils';

export class MizuWallet implements AdapterPlugin {
  readonly url = WALLET_WEB_URL;
  readonly name = WALLET_NAME;
  readonly icon = WALLET_ICON;

  provider: Mizu | undefined;
  telegramMiniAppHelper: TelegramMiniAppHelper | undefined;
  websiteHelper: WebsiteHelper | undefined;
  readyState: WalletReadyState = WalletReadyState.Installed;
  accountInfo: AccountInfo | undefined;

  /**
   * Initialize the MizuWallet
   *
   * @param args.telegram.manifestURL Manifest URL of your Telegram Mini App
   */

  constructor(args?: {
    network: MizuSupportNetwork;
    telegram: { manifestURL: string };
    mizuClient: Mizu;
  }) {
    this.accountInfo = {
      address: '',
      publicKey: '',
    };

    if (args?.telegram?.manifestURL) {
      this.telegramMiniAppHelper = new TelegramMiniAppHelper({
        manifestURL: args.telegram.manifestURL,
        network: args.network,
      });
    }

    if (args?.mizuClient) {
      this.websiteHelper = new WebsiteHelper({
        manifestURL: args.telegram?.manifestURL || '',
        network: args.network,
        mizuClient: args.mizuClient,
      });
    }
  }

  async connect(): Promise<AccountInfo> {
    try {
      // Check if the current environment is Telegram Mini App
      if (IsTelegram) {
        if (this.telegramMiniAppHelper) {
          this.accountInfo = await this.telegramMiniAppHelper.connect();
        } else {
          throw new Error(`${MZ_MSG_TYPE.CONNECT} Please pass a valid manifestURL`);
        }
      } else {
        this.accountInfo = this.websiteHelper?.connect() as any;
      }
      return (
        this.accountInfo || {
          address: '',
          publicKey: '',
        }
      );
    } catch (error: any) {
      console.log(error);
      throw error;
    }
  }

  async account(): Promise<AccountInfo> {
    return (
      this.accountInfo || {
        address: '',
        publicKey: '',
      }
    );
  }

  async disconnect(): Promise<void> {
    try {
      if (IsTelegram) {
        await this.telegramMiniAppHelper?.disconnect();
      } else {
        await this.websiteHelper?.disconnect();
      }
      this.accountInfo = undefined;
    } catch (error: any) {
      throw error;
    }
  }

  async signAndSubmitTransaction(
    transaction: Types.TransactionPayload, // Adjust to correct type
    options?: any,
  ): Promise<{ hash: Types.HexEncodedBytes }> {
    try {
      if (IsTelegram) {
        if (this.telegramMiniAppHelper) {
          return this.telegramMiniAppHelper.signAndSubmitTransaction(transaction as any);
        }
      }
      //  else {
      //   if (this.websiteHelper) {
      //     const adaptedTransaction: InputGenerateTransactionPayloadData = {
      //       // Adapt the transaction payload here
      //     };
      //     return this.websiteHelper.signAndSubmitTransaction(adaptedTransaction) as any;
      //   }
      // }
      console.log(options);
      throw new Error(`${MZ_MSG_TYPE.TRANSACTION} Failed`);
    } catch (err: any) {
      throw new Error(err);
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
      name: this.provider?.network! || 'testnet',
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
