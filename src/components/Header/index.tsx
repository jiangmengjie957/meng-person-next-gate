import { useEffect } from "react"
import styles from './style.module.css'
import Image from "next/image"
import muma from '../../assets/muma.png'
import baozi from '../../../public/baozi.svg'

const Header = () => {
    return (
        <div className={styles.headerContainer}>
            <Image className={styles.logo} src={muma} alt="muma" />
            {/* <div className={styles.title}></div> */}
        </div>
    )
}

export default Header