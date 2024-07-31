import { AccountAddress, InputGenerateTransactionPayloadData } from '@aptos-labs/ts-sdk';
import { SessionCrypto, SessionListener } from '@mizuwallet-sdk/protocol';
import { DEFAULT_MINI_APP_URL, MizuSupportNetwork, MZ_MSG_TYPE } from '../config';
import { HasOpenLink } from '../utils';
import ActionHelper from '../utils/ActionHelper';

const MZ_STORAGE_ADDRESS = 'mizuwallet-address';

class TelegramMiniAppHelper {
  /**
   * @param manifestURL
   */
  manifestURL: string;
  miniAppURL: string;

  /**
   *
   * @param args.manifestURL Manifest URL
   */
  constructor(args: { manifestURL: string; network: MizuSupportNetwork }) {
    if (!args.manifestURL) throw new Error('manifestURL is required');

    this.manifestURL = args.manifestURL;
    this.miniAppURL = DEFAULT_MINI_APP_URL(args.network);
  }

  /**
   * Connect
   *
   * Open MizuWallet MiniApp to connect
   * Try to get Address info back
   *
   *
   * @returns
   */
  async connect() {
    if (window?.localStorage && window.localStorage?.getItem(MZ_STORAGE_ADDRESS)) {
      return {
        address: window.localStorage.getItem(MZ_STORAGE_ADDRESS)!.toString(),
        publicKey: '',
      };
    }

    const sc = new SessionCrypto();
    const startapp = ActionHelper.buildAction({
      prefix: 'R_',
      action: 'miniapp-connect',
      params: [sc.sessionId, this.manifestURL],
    });

    if (HasOpenLink) {
      window?.Telegram.WebApp.openTelegramLink(`${this.miniAppURL}?startapp=${startapp}`, '_blank');
    } else {
      window?.open(`${this.miniAppURL}?startapp=${startapp}`, '_blank');
    }

    const result: any = await SessionListener({
      keypair: sc.stringifyKeypair(),
    });

    if (
      window?.localStorage &&
      AccountAddress.isValid({
        input: result?.address,
        strict: true,
      })
    ) {
      window.localStorage.setItem(MZ_STORAGE_ADDRESS, result?.address);
      return {
        address: result?.address,
        publicKey: '',
      };
    } else {
      throw new Error(`${MZ_MSG_TYPE.CONNECT} Error`);
    }
  }

  disconnect() {
    if (window?.localStorage.getItem(MZ_STORAGE_ADDRESS)) {
      window?.localStorage.removeItem(MZ_STORAGE_ADDRESS);
    }
  }

  async signAndSubmitTransaction(transaction: InputGenerateTransactionPayloadData) {
    if (window?.localStorage.getItem(MZ_STORAGE_ADDRESS)) {
      const sc = new SessionCrypto();
      const startapp = ActionHelper.buildAction({
        prefix: 'R_',
        action: 'miniapp-transaction',
        params: [sc.sessionId, this.manifestURL, window?.btoa(JSON.stringify(transaction))],
      });

      if (HasOpenLink) {
        window?.Telegram?.WebApp?.openTelegramLink(
          `${this.miniAppURL}?startapp=${startapp}`,
          '_blank',
        );
      } else {
        window?.open(`${this.miniAppURL}?startapp=${startapp}`, '_blank');
      }

      const result: any = await SessionListener({
        keypair: sc.stringifyKeypair(),
      });

      if (result.cancel) {
        throw new Error('User Canceled');
      }

      return {
        hash: result.transactions?.filter((tx: any) => tx.type === 2)?.[0]?.hash || '',
      };
    } else {
      throw new Error(`${MZ_MSG_TYPE.TRANSACTION} No address found`);
    }
  }
}

export default TelegramMiniAppHelper;

