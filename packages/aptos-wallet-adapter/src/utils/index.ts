/**
 * Check Page is Loaded in Telegram
 */
export const IsTelegram = !!window?.TelegramWebviewProxy;

/**
 * Check Page has Open Link
 */
export const HasOpenLink = !!window?.Telegram?.WebApp?.openTelegramLink;

