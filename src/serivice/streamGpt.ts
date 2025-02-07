import { getChat } from '@/apis/chat'
import { parsePack } from '@/utils/chat'

export interface GptMsg {
    role: string
    content: string
}
export type GptMsgs = Array<GptMsg>
export class StreamGpt {
    onStart: (prompt: string) => void
    onCreated: () => void
    onDone: () => void
    onPatch: (text: string) => void
    onError: (error: any) => void
    constructor(options: {
        onStart: (prompt: string) => void
        onCreated: () => void
        onDone: () => void
        onPatch: (text: string) => void
        onError: (error: any) => void
    }) {
        const { onStart, onCreated, onDone, onPatch, onError } = options
        this.onStart = onStart
        this.onCreated = onCreated
        this.onPatch = onPatch
        this.onDone = onDone
        this.onError = onError
    }
    async stream(prompt: string, history: GptMsgs = []) {
        let count = 0
        // 触发onStart
        this.onStart(prompt)
        try {
            // 发起请求
            const response: any = await this.fetch(prompt, history)
            const reader: any = response.body?.getReader()
            const decoder: TextDecoder = new TextDecoder()
            const that = this
            reader.read().then(function processText({ done, value }: any) {
                if (done) {
                    that.onDone()
                    return
                }
                count++
                
                const result = decoder.decode(value, { stream: true })
                if(result.split('/%/')?.[0] === 'requireError') {
                    that.onError({
                        status: result.split('/%/')?.[1] || 500,
                        message: result.split('/%/')?.[2] || ''
                    })
                    return
                }
                if (count === 1) {
                    that.onCreated()
                }
                console.log(result,'result12300')
                result?.split(';-;').map((item: string) => {
                    const json = JSON.parse(item || '{}')
                    const content = json?.delta?.content || ''
                    that.onPatch(content)
                })
                return reader.read().then(processText)
            })
        } catch (error: any) {
            this.onError({
                status: 500,
                message: '服务器错误'
            })
            console.error('error: ', error)
        }
    }
    private async fetch(messages: string, history?: any) {
        const result = await getChat({
            question: messages,
            isVisitor: true,
            history,
        })
        console.log(result, 'result123')
        return result
    }
}
