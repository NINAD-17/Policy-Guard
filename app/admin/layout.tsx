import { Sidebar } from "@/components/sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-dvh w-screen flex overflow-hidden relative bg-background">
            {/* Background ambient glows */}
            <div className="absolute top-1/4 left-1/4 w-[800px] h-[800px] bg-primary/15 rounded-full blur-[130px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[110px] pointer-events-none -z-10" />

            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 h-full relative z-0 overflow-y-auto max-w-7xl mx-auto w-full p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
