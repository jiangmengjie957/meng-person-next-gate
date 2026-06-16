import { postStream, post } from '@/utils/http'

const pre = 'https://www.mengmenga.com/api/v1'

// 获取聊天
export const getChat = async (params: any) => postStream(`${pre}/chat`, params)

export const getAnswer = async (params: any) => post(`${pre}/chat`, params)

// 获取可用模型列表
export const getModels = async () => fetch(`${pre}/models`).then(res => res.json())