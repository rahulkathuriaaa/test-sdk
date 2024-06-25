import {
  AccountInfo,
  AdapterPlugin,
  AptosWalletErrorResult,
  NetworkInfo,
  NetworkName,
  SignMessagePayload,
  SignMessageResponse,
  Types,
  WalletName,
  WalletReadyState,
} from '@aptos-labs/wallet-adapter-core';
import { Mizu, ORDER_STATUS } from '../../../core/dist';
import { WALLET_ICON, WALLET_NAME, WALLET_WEB_URL } from '../config';

export const MizuWalletName = 'Mizu Wallet' as WalletName<'Mizu Wallet'>;

export class MizuWallet implements AdapterPlugin {
  readonly url = WALLET_WEB_URL;
  readonly name = WALLET_NAME;
  readonly icon = WALLET_ICON;

  provider: Mizu | undefined;
  readyState: WalletReadyState = WalletReadyState.Installed;

  constructor(args: { appId: string; network: Extract<NetworkName, 'Mainnet' | 'Testnet'> }) {
    if (!args.appId) throw new Error('MizuWallet: appId is required');
    if (!args.network) throw new Error('MizuWallet: network is required');

    this.provider = new Mizu({
      appId: args.appId,
      network: args.network,
    });
  }

  async connect(): Promise<AccountInfo> {
    try {
      // TODO: for our login
      await this.provider?.loginInTG(
        'user=%7B%22id%22%3A6310457231%2C%22first_name%22%3A%22Ice%20%7C%20mizu%22%2C%22last_name%22%3A%22%22%2C%22username%22%3A%22mizu_ice%22%2C%22language_code%22%3A%22zh-hans%22%2C%22allows_write_to_pm%22%3Atrue%7D&chat_instance=3182547347491720100&chat_type=sender&auth_date=1719219854&hash=829fb06341c60297efd108f27edc9648c93839b03faa8d27d7d14f8db91411a3',
      );
      return {
        address: await this.provider?.getUserWalletAddress(),
        publicKey: '',
      };
    } catch (error: any) {
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
      await this.provider?.logout();
    } catch (error: any) {
      throw error;
    }
  }

  async signAndSubmitTransaction(
    transaction: Types.TransactionPayload,
    options?: any,
  ): Promise<{ hash: Types.HexEncodedBytes }> {
    try {
      const { type, ...rest } = transaction;
      console.log(options);
      const payload = {
        function: (rest as any).function,
        functionArguments: (rest as any).arguments || (rest as any).functionArguments,
        typeArguments: (rest as any).type_arguments || (rest as any).typeArguments,
      };

      const MAX_POLL_COUNT = 10;
      const POLL_INTERVAL = 1000;
      let pollCount = 0;

      const orderId: string = await this.provider?.createOrder({
        payload,
      });
      const confirmed: boolean = await this.provider?.confirmOrder({
        orderId,
      });

      if (confirmed) {
        while (pollCount < MAX_POLL_COUNT) {
          // polling
          const order: any = await this.provider?.fetchOrder({
            id: orderId,
          });

          if (order.status == ORDER_STATUS.SUCCESS) {
            const transaction = order.transactions.find((tx: any) => tx.type == 2);
            if (transaction) {
              return {
                hash: transaction.hash,
              };
            }
          } else if (order.status == ORDER_STATUS.FAIL) {
            throw new Error('Transaction failed');
          }

          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
          pollCount++;
        }

        if (pollCount >= MAX_POLL_COUNT) {
          throw new Error('Transaction timeout');
        }
      } else {
        throw new Error('Transaction failed');
      }

      return { hash: '' };
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

