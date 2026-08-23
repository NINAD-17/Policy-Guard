import { Sidebar } from "@/components/sidebar";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-dvh lg:h-dvh w-full flex flex-col lg:flex-row relative overflow-x-hidden">
            {/* Background ambient glows matching dashboard */}
            <div className="fixed top-1/4 left-1/4 w-[800px] h-[800px] bg-primary/20 rounded-full blur-[150px] pointer-events-none -z-10" />
            <div className="fixed bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/20 rounded-full blur-[120px] pointer-events-none -z-10" />

            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0 w-full relative z-0 overflow-y-auto max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                {children}
            </main>
        </div>
    );
}
