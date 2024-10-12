"use client";

import React from "react";
import { useRouter } from "next/navigation";

interface ModalProps {
    title: string;
    link: string;
}

const styles:React.CSSProperties = {
    border: "solid",
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    margin: 5,
    boxShadow: "1px 1px 1px 1px"
}

const Modal = ({ title, link}: ModalProps) => {
    const router = useRouter();

    return (
        <div 
            style={styles}
            onClick={()=>{router.push(link)}}
        >
            <h1>{title}</h1>
        </div>
    )
}

export default Modal;