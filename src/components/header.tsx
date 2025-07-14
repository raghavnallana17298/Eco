
"use client";

import { useAuth } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { CircleUser, LogOut, Recycle, User, Bell, CheckCheck, MessageSquare } from "lucide-react";
import Link from "next/link";
import { Badge } from "./ui/badge";
import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, doc, writeBatch } from "firebase/firestore";
import type { Notification, Conversation } from "@/lib/types";
import { Separator } from "./ui/separator";

export function Header() {
  const { userProfile, signOut, user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

  // Listener for notifications
  useEffect(() => {
    if (!user) return;

    const notifsRef = collection(db, "notifications");
    const q = query(
      notifsRef,
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Notification));
      notifsData.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setNotifications(notifsData);
    });

    return () => unsubscribe();
  }, [user]);

  // Listener for unread messages
  useEffect(() => {
    if (!user) return;

    const convosRef = collection(db, "conversations");
    const q = query(convosRef, where("participants", "array-contains", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      snapshot.forEach(doc => {
        const convo = doc.data() as Conversation;
        total += convo.unreadCounts?.[user.uid] || 0;
      });
      setTotalUnreadMessages(total);
    });

    return () => unsubscribe();
  }, [user]);


  const handleOpenChange = async (open: boolean) => {
    setIsSheetOpen(open);
    if (open && unreadCount > 0) {
      // Mark all as read
      const batch = writeBatch(db);
      notifications.forEach(notif => {
        if (!notif.read) {
          const notifRef = doc(db, "notifications", notif.id);
          batch.update(notifRef, { read: true });
        }
      });
      await batch.commit();
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6">
      <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
        <Recycle className="h-6 w-6 text-accent" />
        <span className="text-lg font-bold font-headline">Eco<span className="text-primary">Nexus</span></span>
      </Link>
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <div className="ml-auto flex items-center gap-4">
           <Button variant="ghost" size="icon" className="rounded-full relative" asChild>
                <Link href="/dashboard/chat">
                    <MessageSquare className="h-5 w-5" />
                    <span className="sr-only">Messages</span>
                    {totalUnreadMessages > 0 && (
                      <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-xs">
                        {totalUnreadMessages}
                      </Badge>
                    )}
                </Link>
           </Button>
           <Sheet open={isSheetOpen} onOpenChange={handleOpenChange}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full relative">
                <Bell className="h-5 w-5" />
                <span className="sr-only">Toggle notifications</span>
                 {unreadCount > 0 && (
                   <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 justify-center p-0 text-xs">
                     {unreadCount}
                   </Badge>
                 )}
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Notifications</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-4">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div key={notif.id} className="flex flex-col gap-2">
                       <Link href={notif.link || "#"} className="space-y-1" onClick={() => setIsSheetOpen(false)}>
                        <p className={`text-sm font-medium ${!notif.read ? 'text-foreground' : 'text-muted-foreground'}`}>{notif.message}</p>
                        <p className="text-xs text-muted-foreground">
                          {notif.createdAt ? new Date(notif.createdAt.seconds * 1000).toLocaleString() : ''}
                        </p>
                      </Link>
                      <Separator />
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center text-center h-48">
                    <Bell className="h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-muted-foreground">You have no new notifications.</p>
                  </div>
                )}
              </div>
               {notifications.length > 0 && (
                <SheetFooter className="mt-4">
                  <Button variant="outline" size="sm" disabled={unreadCount === 0} onClick={() => handleOpenChange(true)}>
                    <CheckCheck className="mr-2 h-4 w-4" />
                    Mark all as read
                  </Button>
                </SheetFooter>
              )}
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>
                {userProfile?.displayName || "My Account"}
                <p className="text-xs font-normal text-muted-foreground">{userProfile?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                <Link href="/dashboard/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
