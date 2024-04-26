import { useEffect } from "react"

const Header = () => {
    useEffect(() => {
        console.log('header')
    },[])
    return (
        <div>header</div>
    )
}

export default Header