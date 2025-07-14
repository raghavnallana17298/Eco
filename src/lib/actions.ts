
"use server";

import { auth, db } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { redirect } from "next/navigation";
import type { UserProfile, Conversation } from "./types";
import { getAuth } from "firebase/auth";

export async function startConversation(formData: FormData) {
  const senderId = formData.get("senderId") as string;
  if (!senderId) {
    throw new Error("You must be logged in to start a conversation.");
  }
  
  const recipientId = formData.get("recipientId") as string;
  if (!recipientId) {
    throw new Error("Recipient ID is missing.");
  }

  if (senderId === recipientId) {
    throw new Error("You cannot start a conversation with yourself.");
  }

  const participants = [senderId, recipientId].sort();

  // Check if a conversation already exists
  const conversationsRef = collection(db, "conversations");
  const q = query(
    conversationsRef,
    where("participants", "==", participants)
  );
  
  const querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    // Conversation exists, redirect to it
    const conversationId = querySnapshot.docs[0].id;
    redirect(`/dashboard/chat/${conversationId}`);
  } else {
    // Create a new conversation
    const currentUserDoc = await getDoc(doc(db, "users", senderId));
    const recipientDoc = await getDoc(doc(db, "users", recipientId));

    if (!currentUserDoc.exists() || !recipientDoc.exists()) {
        throw new Error("Could not find user profiles for conversation.");
    }
    const currentUserProfile = currentUserDoc.data() as UserProfile;
    const recipientProfile = recipientDoc.data() as UserProfile;


    const newConversation: Omit<Conversation, 'id'> = {
      participants,
      participantProfiles: {
        [senderId]: {
            displayName: currentUserProfile.displayName || "User",
            plantName: currentUserProfile.plantName || null,
            role: currentUserProfile.role,
        },
        [recipientId]: {
            displayName: recipientProfile.displayName || "User",
            plantName: recipientProfile.plantName || null,
            role: recipientProfile.role,
        }
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(conversationsRef, newConversation);
    redirect(`/dashboard/chat/${docRef.id}`);
  }
}
