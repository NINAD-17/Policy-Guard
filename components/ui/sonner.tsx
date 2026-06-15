"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-400" />,
        info: <InfoIcon className="size-4 text-blue-400" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400" />,
        error: <OctagonXIcon className="size-4 text-red-400" />,
        loading: <Loader2Icon className="size-4 animate-spin text-primary" />,
      }}
      toastOptions={{
        classNames: {
          toast: "group toast group-[.toaster]:!bg-card/40 group-[.toaster]:!backdrop-blur-xl group-[.toaster]:!border-white/10 group-[.toaster]:!shadow-[0_8px_32px_rgba(0,0,0,0.5)] group-[.toaster]:!rounded-full group-[.toaster]:!px-6 group-[.toaster]:!py-3.5 group-[.toaster]:text-sm group-[.toaster]:text-foreground group-[.toaster]:flex group-[.toaster]:items-center group-[.toaster]:gap-3 group-[.toaster]:border group-[.toaster]:pointer-events-auto",
          title: "group-[.toast]:text-foreground group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "group-[.toaster]:!border-emerald-500/25 group-[.toaster]:!bg-emerald-950/20",
          error: "group-[.toaster]:!border-red-500/25 group-[.toaster]:!bg-red-950/20",
          info: "group-[.toaster]:!border-blue-500/25 group-[.toaster]:!bg-blue-950/20",
          warning: "group-[.toaster]:!border-amber-500/25 group-[.toaster]:!bg-amber-950/20",
        },
      }}
      style={
        {
          "--normal-bg": "rgba(20, 20, 20, 0.4)",
          "--normal-border": "rgba(255, 255, 255, 0.1)",
          "--normal-text": "var(--foreground)",
          "--border-radius": "9999px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
