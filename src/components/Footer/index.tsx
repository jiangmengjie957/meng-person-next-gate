import styles from './page.module.css'

const Footer = () => {
    return (
        <div className={styles.footer}>
            <div className={styles.copyright}>
            <img width={16} height={16} alt="copyright" src="https://lf3-cdn-tos.bytescm.com/obj/static/xitu_juejin_web/img/police.d0289dc.png" />
            <a
                style={{ color: "#000" }}
                href="https://beian.miit.gov.cn"
                target="_blank"
            >
                浙ICP备2024086363号
            </a>
            </div>
      </div>
    )
}

export default Footer