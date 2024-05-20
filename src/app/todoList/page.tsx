// "use client"
import mFetch from '@/utils/fetch'
import styles from './page.module.css'
import Comps from './comps'
import { getRandomSentence } from '@/apis/out'
export default async function Home() {
    // useEffect(() => {},[])
    // const res = await fetch('https://api.github.com/repos/vercel/next.js')
    // console.log(res,'res')
    // const res: any = await fetch('https://api.oick.cn/api/yiyan', {
    //     method: 'GET'
    // })
    // const data = await res.json()
    const data: any = await getRandomSentence()
    console.log(data,'data')
    // const text: any = await mFetch.get('https://api.oick.cn/api/yiyan')
    
    return <div className="pageContainer">
        <Comps text={data} />
    </div>
}