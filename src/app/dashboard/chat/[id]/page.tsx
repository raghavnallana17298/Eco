
"use client";

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { db } from '@/lib/firebase';
import { collection, doc, query, onSnapshot, orderBy, addDoc, serverTimestamp, writeBatch, getDoc, updateDoc, increment } from 'firebase/firestore';
import type { Message, Conversation, UserProfile } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Loader2, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

function getInitials(name: string = '') {
    return name.split(' ').map(n => n[0]).join('');
}


export default function ChatPage() {
    const { user } = useAuth();
    const params = useParams();
    const router = useRouter();
    const conversationId = params.id as string;

    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);


    useEffect(() => {
        if (!conversationId || !user) return;

        // Mark messages as read when entering the chat
        const markAsRead = async () => {
             const convoDocRef = doc(db, 'conversations', conversationId);
             const updatePath = `unreadCounts.${user.uid}`;
             await updateDoc(convoDocRef, { [updatePath]: 0 });
        };
        markAsRead();


        const convoDocRef = doc(db, 'conversations', conversationId);
        const unsubscribeConvo = onSnapshot(convoDocRef, (doc) => {
            if (doc.exists()) {
                setConversation({ id: doc.id, ...doc.data() } as Conversation);
            } else {
                router.push('/dashboard/chat');
            }
        });

        const messagesRef = collection(db, 'conversations', conversationId, 'messages');
        const q = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribeMessages = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
            setMessages(msgs);
            setLoading(false);
        });

        return () => {
            unsubscribeConvo();
            unsubscribeMessages();
        };
    }, [conversationId, router, user]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() === "" || !user || !conversation) return;

        setSending(true);
        const text = newMessage;
        setNewMessage("");

        const otherParticipantId = conversation.participants.find(p => p !== user.uid);
        if (!otherParticipantId) {
            console.error("Could not find the other participant.");
            setSending(false);
            return;
        }

        try {
            const batch = writeBatch(db);

            // Add new message
            const messagesRef = collection(db, 'conversations', conversationId, 'messages');
            const newMessageDoc = doc(messagesRef); // create a new doc ref
             batch.set(newMessageDoc, {
                conversationId,
                senderId: user.uid,
                text,
                createdAt: serverTimestamp(),
            });

            // Update conversation's last message and increment unread count for the other user
            const convoDocRef = doc(db, 'conversations', conversationId);
            const unreadUpdatePath = `unreadCounts.${otherParticipantId}`;
            batch.update(convoDocRef, {
                lastMessage: {
                    text,
                    senderId: user.uid,
                    createdAt: serverTimestamp(),
                },
                updatedAt: serverTimestamp(),
                [unreadUpdatePath]: increment(1),
            });
            
            await batch.commit();

        } catch (error) {
            console.error("Error sending message:", error);
            setNewMessage(text); // put message back if sending failed
        } finally {
            setSending(false);
        }
    };
    
    if (loading) {
        return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!conversation) {
        return <div className="flex h-full items-center justify-center"><p>Conversation not found.</p></div>;
    }

    const otherParticipantId = conversation.participants.find(p => p !== user?.uid);
    const otherProfile = otherParticipantId ? conversation.participantProfiles[otherParticipantId] : null;
    const displayName = otherProfile?.plantName || otherProfile?.displayName || 'User';


    return (
        <div className="flex flex-col h-[calc(100vh-8rem)] bg-card rounded-lg border">
            <div className="flex items-center gap-4 p-4 border-b">
                 <Button variant="ghost" size="icon" className="md:hidden" asChild>
                    <Link href="/dashboard/chat">
                        <ArrowLeft />
                    </Link>
                </Button>
                <Avatar>
                     <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                </Avatar>
                <div>
                    <h3 className="font-semibold">{displayName}</h3>
                    <p className="text-sm text-muted-foreground">{otherProfile?.role}</p>
                </div>
            </div>
            <div className="flex-grow overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                    const isSender = message.senderId === user?.uid;
                    const showAvatar = index === 0 || messages[index - 1].senderId !== message.senderId;

                    return (
                         <div key={message.id} className={cn("flex items-end gap-2", isSender ? "justify-end" : "")}>
                             {!isSender && (
                                <Avatar className={cn("h-8 w-8", showAvatar ? "" : "invisible")}>
                                     <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
                                </Avatar>
                             )}
                            <div className={cn(
                                "max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2",
                                isSender ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}>
                                <p className="text-sm">{message.text}</p>
                            </div>
                         </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>
            <div className="p-4 border-t">
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type a message..."
                        autoComplete="off"
                        disabled={sending}
                    />
                    <Button type="submit" size="icon" disabled={sending || newMessage.trim() === ""}>
                       {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    </Button>
                </form>
            </div>
        </div>
    );
}
