import { Home, DollarSign, LayoutDashboard, PlusCircle, MinusCircle, History, BarChart2, CalendarDays, UserCircle, Users2 } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Início", url: "/", icon: Home },
  { title: "Leads", url: "/leads", icon: Users2 },
  { title: "Agenda", url: "/financeiro/agenda", icon: CalendarDays },
  { title: "Meu Perfil", url: "/perfil", icon: UserCircle },
];

const financeiroItems = [
  { title: "Dashboard", url: "/financeiro/dashboard", icon: LayoutDashboard },
  { title: "Nova Receita", url: "/financeiro/nova-receita", icon: PlusCircle },
  { title: "Novo Gasto", url: "/financeiro/novo-gasto", icon: MinusCircle },
  { title: "Histórico", url: "/financeiro/historico", icon: History },
  { title: "Relatórios", url: "/financeiro/relatorios", icon: BarChart2 },
];

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;

  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive ? "bg-muted text-primary font-medium" : "hover:bg-muted/50";

  return (
    <Sidebar collapsible="icon" side="left" variant="sidebar">
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Meu Executivo Gramado</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} end={item.url === "/"} className={({ isActive }) => getNavCls({ isActive })}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <DollarSign className="mr-1 h-4 w-4" />
            Financeiro
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {financeiroItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink to={item.url} className={({ isActive }) => getNavCls({ isActive })}>
                      <item.icon className="mr-2 h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
