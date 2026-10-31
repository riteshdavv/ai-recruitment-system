"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import Logo from "@/components/Logo";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { SideBarOptions } from "@/services/Constants";
import { LogOutIcon, Plus } from "lucide-react";
import { UserAuth } from "@/context/AuthContext";

export function AppSidebar() {
  const router = useRouter();
  const path = usePathname();
  const { signOut } = UserAuth();

  return (
    <Sidebar className="bg-surface border-r border-line shadow-xs">
      {/* Header Logo */}
      <SidebarHeader className="flex items-center justify-center py-5 px-4 border-b border-line">
        <Link href="/recruiter/dashboard" className="flex items-center justify-center">
          <Logo size="md" />
        </Link>
      </SidebarHeader>

      {/* Primary Action Button */}
      <div className="px-3.5 py-4">
        <Button
          className="w-full h-10 bg-sage-700 hover:bg-sage-800 text-white font-medium rounded-md transition-colors"
          onClick={() => router.push("/recruiter/dashboard/create-interview")}
        >
          <Plus className="mr-2 h-4 w-4" strokeWidth={2} />
          Create New Interview
        </Button>
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu className="space-y-1 px-3">
            {SideBarOptions.map((option, index) => {
              const isActive = path === option.path;
              return (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    asChild
                    className={`
                      w-full h-10 rounded-md px-3 py-2 transition-colors duration-150
                      ${isActive
                        ? "bg-sage-100 text-sage-900 font-semibold border-l-[3px] border-sage-700"
                        : "text-ink-muted hover:bg-sage-50 hover:text-ink border-l-[3px] border-transparent"
                      }
                    `}
                  >
                    <Link href={option.path} className="flex items-center gap-3">
                      <option.icon
                        className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-sage-700" : "text-ink-muted"}`}
                        strokeWidth={1.75}
                      />
                      <span className="text-sm">
                        {option.name}
                      </span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      {/* Logout */}
      <SidebarFooter className="p-3.5 border-t border-line">
        <button
          className="w-full h-10 px-3 flex items-center gap-2.5 rounded-md text-sm font-medium text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors duration-150 cursor-pointer"
          onClick={async () => {
            await signOut();
            router.push("/login");
          }}
        >
          <LogOutIcon className="h-4 w-4" strokeWidth={1.75} />
          Logout
        </button>
      </SidebarFooter>
    </Sidebar>
  );
}

export default AppSidebar;
