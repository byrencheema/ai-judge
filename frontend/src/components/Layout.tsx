import { PropsWithChildren } from "react";
import Sidebar from "./Sidebar";

const Layout = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-screen flex bg-background text-zinc-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-10">{children}</div>
      </main>
    </div>
  );
};

export default Layout;
