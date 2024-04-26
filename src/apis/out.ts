import http from '@/utils/fetch'
// free
// https://api.oick.cn/api/netcard
export const getIpSign = async () => http.get('https://api.oick.cn/api/netcard')

// https://api.oick.cn/api/yiyan
// 随机输出一句话
export const getRandomSentence = async () => http.get('https://api.oick.cn/api/yiyan')
