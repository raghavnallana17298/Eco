
"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import type { Conversation } from '@/lib/types';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, MessageSquare } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

function getInitials(name: string = '') {
    return name.split(' ').map(n => n[0]).join('');
}

export default function ChatListPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
        setLoading(false);
        return;
    }

    setLoading(true);
    const conversationsRef = collection(db, 'conversations');
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
      setConversations(convos);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching conversations: ", error);
        setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
       <h1 className="text-3xl font-bold tracking-tight">My Conversations</h1>
       <Card>
         <CardContent className="p-0">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
                <MessageSquare className="w-16 h-16 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No Conversations Yet</h3>
                <p className="text-muted-foreground mt-2">
                    Start a conversation by finding a recycler or transporter and clicking the "Message" button.
                </p>
            </div>
          ) : (
            <ul className="divide-y">
                {conversations.map(convo => {
                    const otherParticipantId = convo.participants.find(p => p !== user?.uid);
                    if (!otherParticipantId) return null;

                    const otherProfile = convo.participantProfiles[otherParticipantId];
                    const displayName = otherProfile?.plantName || otherProfile?.displayName || "User";

                    return (
                         <li key={convo.id}>
                            <Link href={`/dashboard/chat/${convo.id}`} className="flex items-center gap-4 p-4 hover:bg-muted/50 transition-colors">
                                <Avatar>
                                    <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-grow">
                                    <h4 className="font-semibold">{displayName}</h4>
                                    <p className="text-sm text-muted-foreground truncate max-w-md">
                                        {convo.lastMessage ? (
                                             <span className={convo.lastMessage.senderId === user?.uid ? "" : "font-bold"}>
                                                {convo.lastMessage.senderId === user?.uid ? "You: " : ""}
                                                {convo.lastMessage.text}
                                             </span>
                                        ) : "No messages yet."}
                                    </p>
                                </div>
                                {convo.lastMessage?.createdAt && (
                                    <time className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(convo.lastMessage.createdAt.toDate(), { addSuffix: true })}
                                    </time>
                                )}
                            </Link>
                         </li>
                    )
                })}
            </ul>
          )}
         </CardContent>
       </Card>
    </div>
  );
}
