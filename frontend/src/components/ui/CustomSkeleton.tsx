import React, { createContext, useContext } from 'react'
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

// ------------------
// Context
// ------------------
interface SkeletonContextType {
    groupShow: boolean
}

const SkeletonContext = createContext<SkeletonContextType>({ groupShow: true })
const useSkeletonGroupShow = () => useContext(SkeletonContext).groupShow

// ------------------
// Props
// ------------------
export interface CustomSkeletonProps {
    height?: number | string
    width?: number | string
    radius?: number | 'square' | 'round'
    show?: boolean
    className?: string
    style?: React.CSSProperties
    children?: React.ReactNode
}

// ------------------
// Component
// ------------------
export default function CustomSkeleton({
    height,
    width,
    radius,
    show,
    className = '',
    style,
    children
}: CustomSkeletonProps) {
    const groupShow = useSkeletonGroupShow()
    const finalShow = show ?? groupShow

    if (!finalShow) {
        return <>{children}</>
    }

    // Parse radius
    let borderRadiusStyle: React.CSSProperties = {}
    if (radius === 'square') {
        borderRadiusStyle = { borderRadius: '0px' }
    } else if (radius === 'round') {
        borderRadiusStyle = { borderRadius: '9999px' }
    } else if (typeof radius === 'number') {
        borderRadiusStyle = { borderRadius: `${radius}px` }
    }

    const mergedStyle: React.CSSProperties = {
        ...borderRadiusStyle,
        ...style
    }

    return (
        <span className={`inline-block w-full leading-none ${className}`} style={mergedStyle}>
            <Skeleton
                height={height}
                width={width}
                borderRadius={radius === 'square' ? '0px' : radius === 'round' ? '9999px' : radius}
                baseColor="var(--color-bg-secondary)"
                highlightColor="var(--color-bg-tertiary)"
            />
        </span>
    )
}

// ------------------
// Group wrapper
// ------------------
interface GroupProps {
    show?: boolean
    children: React.ReactNode
}

CustomSkeleton.Group = function CustomSkeletonGroup({ show = true, children }: GroupProps) {
    return (
        <SkeletonContext.Provider value={{ groupShow: show }}>
            <SkeletonTheme
                baseColor="var(--color-bg-secondary)"
                highlightColor="var(--color-bg-tertiary)"
            >
                {children}
            </SkeletonTheme>
        </SkeletonContext.Provider>
    )
}