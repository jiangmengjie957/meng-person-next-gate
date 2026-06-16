import { Outlet } from 'react-router-dom'
import Layout from '@/components/Layout'

export default function PageLayout() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
