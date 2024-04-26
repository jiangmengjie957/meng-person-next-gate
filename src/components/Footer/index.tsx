import Image from 'next/image'
import styles from './page.module.css'

const Footer = () => {
    return (
        <div className={styles.footer}>
            <div className={styles.copyright}>
            <Image width={16} height={16} alt="copyright" src="https://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web/img/police.d0289dc.png" />
            <a
                style={{ color: "#000" }}
                href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=浙ICP备2024086363号"
                target="_blank"
            >
                浙ICP备2024086363号
            </a>
            </div>
      </div>
    )
}

export default Footer