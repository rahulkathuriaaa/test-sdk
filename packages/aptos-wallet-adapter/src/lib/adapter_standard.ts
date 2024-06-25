import { Account, SigningScheme } from '@aptos-labs/ts-sdk';
import {
  AccountAuthenticator,
  AnyRawTransaction,
  NetworkName,
} from '@aptos-labs/wallet-adapter-core';
import {
  APTOS_CHAINS,
  AccountInfo,
  AptosConnectMethod,
  AptosDisconnectMethod,
  AptosFeatures,
  AptosGetAccountMethod,
  AptosGetNetworkMethod,
  AptosOnAccountChangeMethod,
  AptosOnNetworkChangeMethod,
  AptosSignMessageInput,
  AptosSignMessageMethod,
  AptosSignMessageOutput,
  AptosSignTransactionMethod,
  AptosWallet,
  AptosWalletAccount,
  AptosWalletError,
  AptosWalletErrorCode,
  IdentifierArray,
  NetworkInfo,
  UserResponse,
  UserResponseStatus,
  registerWallet,
} from '@aptos-labs/wallet-standard';
import { Mizu } from '../../../core/dist';
import { WALLET_ICON, WALLET_NAME, WALLET_WEB_URL } from '../config';

/**
 * A class to create a mock wallet for demonstration a wallet
 * implementation compatible with Aptos AIP-62 Wallet Standard
 */
export class MyWalletAccount implements AptosWalletAccount {
  address: string;
  publicKey: Uint8Array;
  chains: IdentifierArray = APTOS_CHAINS;
  features: IdentifierArray = [];
  signingScheme: SigningScheme;
  label?: string;
  icon?:
    | `data:image/svg+xml;base64,${string}`
    | `data:image/webp;base64,${string}`
    | `data:image/png;base64,${string}`
    | `data:image/gif;base64,${string}`
    | undefined;

  constructor(account: Account) {
    this.address = account.accountAddress.toString();
    this.publicKey = account.publicKey.toUint8Array();
    this.signingScheme = account.signingScheme;
  }
}

interface InitParams {
  appId: string;
  network: Extract<NetworkName, 'Mainnet' | 'Testnet'>;
}

class MizuWallet implements AptosWallet {
  readonly url: string = WALLET_WEB_URL;
  readonly version = '1.0.0';
  readonly name: string = WALLET_NAME;
  readonly icon = WALLET_ICON;
  chains = APTOS_CHAINS;
  accounts: MyWalletAccount[] = [];

  provider: Mizu | undefined;

  get features(): AptosFeatures {
    return {
      'aptos:connect': {
        version: '1.0.0',
        connect: this.connect,
      },
      'aptos:network': {
        version: '1.0.0',
        network: this.network,
      },
      'aptos:disconnect': {
        version: '1.0.0',
        disconnect: this.disconnect,
      },
      'aptos:signTransaction': {
        version: '1.0.0',
        signTransaction: this.signTransaction,
      },
      'aptos:signMessage': {
        version: '1.0.0',
        signMessage: this.signMessage,
      },
      'aptos:onAccountChange': {
        version: '1.0.0',
        onAccountChange: this.onAccountChange,
      },
      'aptos:onNetworkChange': {
        version: '1.0.0',
        onNetworkChange: this.onNetworkChange,
      },
      'aptos:account': {
        version: '1.0.0',
        account: this.account,
      },
    };
  }

  constructor(args: InitParams) {
    if (!args.appId) throw new Error('MizuWallet: appId is required');
    if (!args.network) throw new Error('MizuWallet: network is required');

    this.provider = new Mizu({
      appId: args.appId,
      network: args.network,
    });
  }

  account: AptosGetAccountMethod = async (): Promise<AccountInfo> => {
    const address = await this.provider?.getUserWalletAddress();
    if (!address) throw `${WALLET_NAME} Account Error`;

    return {
      address,
    } as AccountInfo;
  };

  connect: AptosConnectMethod = async (): Promise<UserResponse<AccountInfo>> => {
    try {
      // TODO: for our login
      await this.provider?.loginInTG('');
      return {
        args: {
          address: await this.provider?.getUserWalletAddress(),
        } as AccountInfo,
        status: UserResponseStatus.APPROVED,
      };
    } catch (error) {
      return {
        status: UserResponseStatus.REJECTED,
      };
    }
  };

  network: AptosGetNetworkMethod = async (): Promise<NetworkInfo> => {
    const networkInfo = this.provider!.networkInfo;
    return {
      ...networkInfo,
    };
  };

  disconnect: AptosDisconnectMethod = async (): Promise<void> => {
    //TODO: remove local storage
    return this.provider?.logout();
  };

  signTransaction: AptosSignTransactionMethod = async (
    transaction: AnyRawTransaction,
    asFeePayer?: boolean,
  ): Promise<UserResponse<AccountAuthenticator>> => {
    console.log(transaction, asFeePayer);
    throw new AptosWalletError(AptosWalletErrorCode.InternalError);
  };

  signMessage: AptosSignMessageMethod = async (
    input: AptosSignMessageInput,
  ): Promise<UserResponse<AptosSignMessageOutput>> => {
    console.log(input);
    throw new AptosWalletError(AptosWalletErrorCode.InternalError);
  };

  onAccountChange: AptosOnAccountChangeMethod = async (): Promise<void> => {
    return Promise.resolve();
  };

  onNetworkChange: AptosOnNetworkChangeMethod = async (): Promise<void> => {
    return Promise.resolve();
  };
}

export const MizuWalletRegister = (args: InitParams) => {
  if (args.appId && args.network) {
    const myWallet = new MizuWallet(args);
    registerWallet(myWallet);
  } else {
    console.error('[Mizu Wallet] window.MizuWalletConfig not found');
  }
};

