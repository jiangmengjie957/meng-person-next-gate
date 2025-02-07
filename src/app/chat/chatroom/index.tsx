'use client'
import { Button, Input } from 'antd'
import { useGpt } from '@/hooks/useChat'
import { useState, useRef, useEffect } from 'react'
import MsgList from './MsgList'
import styles from '../page.module.css'
import { 
    MessageOutlined, 
    RobotOutlined,
    ThunderboltOutlined,
    SafetyOutlined 
} from '@ant-design/icons'

const Chatroom = () => {
    const { streamingText, stream, streaming, msgList } = useGpt('', true)
    const [question, setQuestion] = useState('')
    const contentRef = useRef<HTMLDivElement>(null)

    const autoScroll = () => {
        if (contentRef.current) {
            contentRef.current.scrollTop = contentRef.current.scrollHeight
        }
    }

    // 添加自动滚动效果
    useEffect(() => {
        autoScroll()
    }, [streamingText, msgList])

    const onChat = () => {
        if (!question || streaming) return
        stream(question)
        setQuestion('')
    }

    const hasMessages = msgList.length > 0 || streamingText

    const features = [
        {
            icon: <RobotOutlined className={styles.featureIcon} />,
            title: '智能理解',
            desc: '精准理解需求，提供专业解答'
        },
        {
            icon: <ThunderboltOutlined className={styles.featureIcon} />,
            title: '快速响应',
            desc: '即时回复，对话更流畅'
        },
        {
            icon: <MessageOutlined className={styles.featureIcon} />,
            title: '自然交谈',
            desc: '如同与朋友聊天般轻松'
        },
        {
            icon: <SafetyOutlined className={styles.featureIcon} />,
            title: '可靠助手',
            desc: '用心解答每个问题'
        }
    ]

    return (
        <div className={styles.chatroom}>
            <div className={styles.title}>你好，我是小小梦</div>
            <div className={styles.subtitle}>
                让我来帮你解答问题，探索新知识
            </div>
            <div 
                ref={contentRef}
                className={`${styles.content} ${hasMessages ? '' : styles.empty}`}
            >
                {!hasMessages && (
                    <div className={styles.features}>
                        {features.map((feature, index) => (
                            <div key={index} className={styles.feature}>
                                {feature.icon}
                                <div className={styles.featureText}>
                                    <div className={styles.featureTitle}>{feature.title}</div>
                                    <div className={styles.featureDesc}>{feature.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                <MsgList
                    msgList={msgList}
                    streamingText={streamingText}
                    streaming={streaming}
                />
            </div>
            <div className={`${styles.inputBox} ${hasMessages ? styles.fixed : ''}`}>
                <Input
                    placeholder="和小小梦聊聊天吧，我很期待..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onPressEnter={onChat}
                />
                <Button onClick={onChat} type="primary" loading={streaming}>
                    发送
                </Button>
            </div>
        </div>
    )
}

export default Chatroom
