import { postStream } from '@/utils/http'

const pre = 'https://www.mengmenga.com/api/v1'

// 获取聊天
export const getChat = async (params: any) => postStream(`${pre}/chat`, params)