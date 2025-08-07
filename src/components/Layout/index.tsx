import Footer from "../Footer";
import Header from "../Header";
import styles from './style.module.css'

export default function Layout({ children }: any) {
  return (
    <>
      <Header />
        <div className={styles.container}>
          <main>{children}</main>
        </div>
    </>
  )
}