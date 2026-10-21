"use client";

import { ChevronsUpDown, Globe, LogOut, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar } from "@/components/ui/misc";
import { authClient } from "@/lib/auth/client";
import { cn } from "@/lib/utils";

export type ShellUser = { name: string; email: string; roleLabel: string };

/** Avatar button that opens account links and log out. */
export function UserMenu({ user, compact = false, className }: { user: ShellUser; compact?: boolean; className?: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await authClient.signOut();
      router.push("/");
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex w-full min-w-0 items-center gap-2.5 rounded-lg p-1.5 text-left transition-colors duration-150 hover:bg-accent data-[state=open]:bg-accent",
          compact && "w-auto justify-center",
          className,
        )}
        aria-label={compact ? `Account menu for ${user.name}` : undefined}
      >
        <Avatar name={user.name} />
        {compact ? null : (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-foreground">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{user.roleLabel}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={compact ? "right" : "top"} align={compact ? "end" : "start"} className="w-60">
        <DropdownMenuLabel className="space-y-0.5">
          <span className="block truncate font-medium">{user.name}</span>
          <span className="block truncate text-xs font-normal text-muted-foreground">{user.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserRound /> Account settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/">
            <Globe /> Public site
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" disabled={pending} onSelect={signOut}>
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
