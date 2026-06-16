import styles from './style.module.css'
import muma from '../../assets/muma.png'

const Header = () => {
    return (
        <div className={styles.headerContainer}>
            <img className={styles.logo} src={muma} alt="muma" />
        </div>
    )
}

export default Header