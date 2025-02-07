import { GptMsgs, StreamGpt } from '@/serivice/streamGpt'
import { Typewriter } from '@/serivice/typewriter'
import { message } from 'antd'
import { useEffect, useRef, useState } from 'react'

const STORAGE_KEY = 'chat_history'
const MAX_HISTORY = 10

export const useGpt = (key?: string, history: boolean = false) => {
    const [streamingText, setStreamingText] = useState("")
    // const streaming = useRef(false)
    const [streaming, setStreaming] = useState(false)
    const [,forceUpdate] = useState({})
    const msgList = useRef<GptMsgs>([])
    const typewriter = useRef<any>(null)
    const gpt = useRef<any>(null)
    const streamingTextRef = useRef<string>(streamingText)

    // 从localStorage加载历史记录
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsedHistory = JSON.parse(stored) as GptMsgs
                msgList.current = parsedHistory.slice(-MAX_HISTORY * 2) // 保留最近的10轮对话
                forceUpdate({})
            }
        }
    }, [])

    // 保存消息到localStorage
    const saveToStorage = (messages: GptMsgs) => {
        if (typeof window !== 'undefined') {
            const historyToSave = messages.slice(-MAX_HISTORY * 2)
            localStorage.setItem(STORAGE_KEY, JSON.stringify(historyToSave))
        }
    }

    if(!typewriter.current) {
        typewriter.current = new Typewriter((str: string) => {
            setStreamingText((text: string) => {
                const res = text + str
                streamingTextRef.current = res
                return res
            })
        })
    }
    if(!gpt.current) {
        gpt.current = new StreamGpt({
            onStart: (prompt: string) => {
                setStreaming(true)
                msgList.current.push({
                    role: 'user',
                    content: prompt,
                })
                saveToStorage(msgList.current) // 保存用户问题
                setStreamingText('')
            },
            onPatch: (text: string) => {
                console.log('onPatch', text)
                typewriter.current?.add(text)
            },
            onCreated: () => {
                typewriter.current?.start()
            },
            onDone: () => {
                typewriter.current?.done()
                setTimeout(() => {
                    msgList.current.push({
                        role: 'assistant',
                        content: streamingTextRef.current,
                    })
                    saveToStorage(msgList.current) // 保存AI回复
                    setStreaming(false)
                }, 500)
                // setStreamingText('')
            },
            onError: (error: any) => {
                setStreaming(false)
                console.log(error, 'messageError')
                message.error(error?.message || '')
            }
        })
    }
    

    // 如果是history模式，则在stream时将msgList传入
    const stream = (prompt: string) => {
        if(!gpt.current) return
        gpt.current.stream(prompt, history ? msgList.current : undefined)
    }
    return {
        streamingText,
        streaming: streaming,
        msgList: msgList.current,
        stream,
    }
}
