import { CustomPromptProps } from "@/type/prompt"

export const defaultPromptWithCustom = (custom: CustomPromptProps) => {
    return `
    请帮我为需求名字取一个git分支名，分支名格式为${
        custom.branchFormat || 'feature-xxx-xxx'
    }，其中feature为固定词，xxx为从需求中取出的关键词的英文，要求xxx可以为多个，中间用-连接即可，要求不过超过6个单词，同时分支不要取过于简单，导致重复性过高，需求名字中的：前端、后端、BI、实时等类似这类标签不要作为关键词。 你只要给我输入分支名字即可，不要输出其他任何信息。${
        custom.customPrompt || ''
    }   
    `
}
