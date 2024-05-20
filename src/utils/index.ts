import { message } from "antd";

// 生成唯一标识
export const guid = () => {
  return "axxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// 复制到剪贴板
export async function copyToClipboard(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
    message.success("复制成功!");
  } catch (err) {
    message.error("无法复制到剪贴板!" + err);
  }
}
