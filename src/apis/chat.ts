import { postStream } from '@/utils/http'

const pre = 'http://127.0.0.1:4001'

// 获取聊天
export const getChat = async (params: any) => postStream(`${pre}/chat`, params)