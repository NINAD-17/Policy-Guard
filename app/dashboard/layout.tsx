import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen w-screen flex overflow-hidden relative">
            {/* Background ambient glows - enhanced for stronger frost effect */}
            <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none -z-10" />
            
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 h-full relative z-0">{children}</main>
        </div>
    );
}
