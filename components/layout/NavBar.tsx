"use client"
import { Video } from "lucide-react"
import { useRouter } from "next/navigation"
import Container from "./Containner"
import { useAuth, UserButton } from "@clerk/nextjs"
import { Button } from "../ui/button"

const NavBar = () =>{
    const router = useRouter();
    const { userId } = useAuth()

    return (
        <div className="sticky top-0 border-b-primary/10">
            <Container>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1 cursor-pointer" onClick={() => 
                        router.push('/')}>
                        
                        <div className="font-bold text-2xl">Finver</div>
                    </div>
                    <div className="flex gap-3 items-center">
                        <UserButton/>
                        { !userId && <>
                            <Button onClick={()=> router.push('/sign-in')} size='sm' variant='outline'>Sign in</Button>
                            <Button onClick={()=> router.push('/sign-up')} size='sm' >Sign up</Button>
                        </>}
                    </div>
                </div>
            </Container>
        </div>
    )
}

export default NavBar ;