import { NavLink } from "react-router-dom";
import { clsx } from "clsx";
import { Upload, Users, Workflow, ListChecks } from "lucide-react";

const links = [
  { to: "/", label: "Upload", icon: Upload },
  { to: "/judges", label: "Judges", icon: Users },
  { to: "/workflow", label: "Workflow", icon: Workflow },
  { to: "/results", label: "Results", icon: ListChecks }
];

const Sidebar = () => {
  return (
    <aside className="w-60 bg-panel border-r border-slate/40 h-screen sticky top-0 text-sm">
      <div className="px-6 py-6 border-b border-slate/40">
        <div className="text-2xl tracking-[0.4rem] font-semibold">JUDGE</div>
        <p className="text-xs text-zinc-400 mt-2">AI verdicts for human annotations</p>
      </div>
      <nav className="px-4 py-6 space-y-2">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              className={({ isActive }) =>
                clsx(
                  "flex items-center gap-3 rounded-md px-3 py-2 transition",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-zinc-300 hover:bg-slate/40"
                )
              }
            >
              <Icon className="h-4 w-4" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
