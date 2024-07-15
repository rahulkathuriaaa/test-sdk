export const ShortAddress = (
  address: string,
  opts: { prefixLen: number; suffixLen: number } = { prefixLen: 6, suffixLen: 4 },
) => {
  const reg: RegExp = new RegExp(`(^\\S{${opts.prefixLen}})(\\S*)(\\S{${opts.suffixLen}})$`);
  return address && address !== '0' ? address.replace(reg, '$1...$3') : '';
};

export const copy = (text: string) => {
  window.navigator.clipboard.writeText(text);
  alert('Copied');
};

