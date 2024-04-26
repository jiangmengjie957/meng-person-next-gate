"use client"
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import Footer from "@/components/Footer";
import dayjs from "dayjs";

export default function Home() {
  const [a, b] = useState('123');
  const [startTime, setStartTime] = useState('');
  useEffect(() => {
    setStartTime(dayjs().format('YYYY-MM-DD HH:mm:ss'))
  },[])
  return (
    <div className={styles.container}>
      <div style={{
        color: '#fff',
        fontSize: '30px',
      }}>进入时间：{startTime}</div>
      <Footer />
    </div>
  );
}
