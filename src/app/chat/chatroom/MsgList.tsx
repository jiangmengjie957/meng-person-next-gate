'use client'
import ReactMarkdown from 'react-markdown'
// @ts-ignore
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
// @ts-ignore
import { tomorrow } from 'react-syntax-highlighter/dist/esm/styles/prism'
import 'highlight.js/styles/atom-one-dark-reasonable.css'
import { GptMsgs } from '@/service/streamGpt'

import styles from '../page.module.css'

interface IMsgListProps {
    msgList?: GptMsgs
    streamingText?: string
    streaming?: boolean
}

const MsgList = ({ msgList = [], streamingText, streaming }: IMsgListProps) => {
    console.log(msgList,'msgList999')
    return (
        <div className={styles.msgList}>
            {msgList.map((msg, index) => (
                <div key={index} className={msg.role === 'user' ? styles.user : styles.assistant}>
                    <div className={msg.role === 'user' ? styles.userContent : ''}>
                        {msg.role === 'assistant' ? (
                            <ReactMarkdown
                                components={{
                                    // @ts-ignore
                                    code({node, inline, className, children, ...props}) {
                                        const match = /language-(\w+)/.exec(className || '')
                                        return !inline && match ? (
                                            <SyntaxHighlighter
                                                {...props}
                                                // eslint-disable-next-line react/no-children-prop
                                                children={String(children).replace(/\n$/, '')}
                                                style={tomorrow}
                                                language={match[1]}
                                                PreTag="div"
                                            />
                                        ) : (
                                            <code {...props} className={className}>
                                                {children}
                                            </code>
                                        )
                                    },
                                }}
                            >
                                {msg.content}
                            </ReactMarkdown>
                        ) : (
                            msg.content
                        )}
                    </div>
                </div>
            ))}
            {streaming && (
                <div className={`${styles.assistant} ${styles.assistantLoading}`}>
                    <div>
                        <ReactMarkdown
                            components={{
                                // @ts-ignore
                                code({node, inline, className, children, ...props}) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return !inline && match ? (
                                        <SyntaxHighlighter
                                            {...props}
                                            // eslint-disable-next-line react/no-children-prop
                                            children={String(children).replace(/\n$/, '')}
                                            style={tomorrow}
                                            language={match[1]}
                                            PreTag="div"
                                        />
                                    ) : (
                                        <code {...props} className={className}>
                                            {children}
                                        </code>
                                    )
                                },
                            }}
                        >
                            {streamingText || ''}
                        </ReactMarkdown>
                    </div>
                </div>
            )}
        </div>
    )
}

export default MsgList
