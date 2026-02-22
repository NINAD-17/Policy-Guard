import { Sidebar } from "@/components/sidebar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="h-screen flex overflow-hidden bg-background">
            <Sidebar />
            <main className="flex-1 flex flex-col min-w-0">{children}</main>
        </div>
    );
}
