'use client'
import { useEffect } from 'react';
import Chatroom from './chatroom'
import styles from './page.module.css'

const MengAi = () => {

    useEffect(() => {
        const handleGestureStart = (e: any) => {
          e.preventDefault();
        };
    
        const handleDblClick = (e: any) => {
          e.preventDefault();
        };
    
        const handleTouchStart = (event: any) => {
          if (event.touches.length > 1) {
            event.preventDefault();
          }
        };
    
        let lastTouchEnd = 0;
        const handleTouchEnd = (event: any) => {
          const now = (new Date()).getTime();
          if (now - lastTouchEnd <= 300) {
            event.preventDefault();
          }
          lastTouchEnd = now;
        };
    
        document.addEventListener('gesturestart', handleGestureStart);
        document.addEventListener('dblclick', handleDblClick);
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchend', handleTouchEnd);
    
        // Cleanup event listeners on component unmount
        return () => {
          document.removeEventListener('gesturestart', handleGestureStart);
          document.removeEventListener('dblclick', handleDblClick);
          document.removeEventListener('touchstart', handleTouchStart);
          document.removeEventListener('touchend', handleTouchEnd);
        };
      }, []);

    return (
        <div className={styles.container}>
            <Chatroom />
        </div>
    )
}
export default MengAi
