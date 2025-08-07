import { getAnswer } from "@/apis/chat";
import { defaultPromptWithCustom } from "@/constants/prompt";
import { CustomPromptProps } from "@/type/prompt";
import { message } from "antd";

export const getBranch = async (question: string, params: CustomPromptProps) => {
const { branchFormat = 'feature-xxx-xxx', customPrompt } = params
  const res = await getAnswer({
    isSingleChat: true,
    systemPrompt: defaultPromptWithCustom({ branchFormat, customPrompt }),
    question
  })
  if (res.code === 200) {
    return res.data?.result || ''
  }
  message.error('接口请求失败，请联系蒋梦杰')
  return ''
}