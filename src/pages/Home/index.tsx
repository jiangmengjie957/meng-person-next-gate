import { useState, useEffect } from 'react'
import styles from './index.module.css'
import Comps from './Comps'
import { getRandomSentence } from '@/apis/out'
import mFetch from '@/utils/fetch'

export default function Home() {
  const [data, setData] = useState<any>(null)
  const [text, setText] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getRandomSentence(),
      mFetch.get('https://api.oick.cn/api/yiyan')
    ]).then(([dataRes, textRes]) => {
      console.log(dataRes, 'data')
      setData(dataRes)
      setText(textRes)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  if (loading) return <div>加载中...</div>

  return (
    <div className={styles.container}>
      <Comps text={text} />
    </div>
  )
}
