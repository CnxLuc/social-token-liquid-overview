import { useHashLocation } from "wouter/use-hash-location";
import { LayoutDashboard, Image, Grid3X3, Skull } from "lucide-react";
import { tokens, nfts, killedTokens, killedNfts } from "@/lib/data";
import logoSrc from "@assets/re7social-logo.jpg";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const navItems = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Matrix", path: "/matrix", icon: Grid3X3, count: tokens.length + nfts.length },
  { label: "NFTs", path: "/nfts", icon: Image, count: nfts.length },
  { label: "Killed", path: "/killed", icon: Skull, count: killedTokens.length + killedNfts.length },
];

export function AppSidebar() {
  const [location, setLocation] = useHashLocation();

  return (
    <Sidebar data-testid="app-sidebar">
      <SidebarHeader className="px-4 py-5">
        <div className="flex items-center gap-3">
          <img src={logoSrc} alt="Re7Social" className="h-7 w-auto" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5 leading-tight font-medium tracking-wide uppercase">
          Social Token Liquid Overview
        </p>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={location === item.path}
                    onClick={() => setLocation(item.path)}
                    data-testid={`nav-${item.label.toLowerCase()}`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.count != null && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        {item.count}
                      </span>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 py-3">
        <p className="text-xs text-muted-foreground">Data as of Mar 12, 2026</p>
      </SidebarFooter>
    </Sidebar>
  );
}
