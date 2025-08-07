// "use client";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";
import "dayjs/locale/zh-cn";
import dayjs from "dayjs";
import { Metadata } from "next";

// 设置dayjs全局语言为中文
dayjs.locale('zh-cn');

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "梦梦小屋",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" 
        />
      </head>
      <body className={inter.className}>
        <ConfigProvider 
          locale={zhCN}
          theme={{
            token: {
              // 可以在这里自定义主题
            },
          }}
        >
          <AntdRegistry>{children}</AntdRegistry>
        </ConfigProvider>
      </body>
    </html>
  );
}
