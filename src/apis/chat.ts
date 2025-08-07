import { postStream, post } from '@/utils/http'

const pre = 'https://www.mengmenga.com/api/v1'

// 获取聊天
export const getChat = async (params: any) => postStream(`${pre}/chat`, params)

export const getAnswer = async (params: any) => post(`${pre}/chat`, params)