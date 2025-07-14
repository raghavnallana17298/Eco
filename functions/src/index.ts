/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

initializeApp();
const db = getFirestore();


// Function to create a notification when a waste request is accepted
export const onWasteRequestAccepted = onDocumentUpdated(
  "wasteRequests/{requestId}",
  async (event) => {
    logger.info("Function onWasteRequestAccepted triggered for request:", event.params.requestId);

    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Check if the status changed from 'pending' to 'accepted'
    if (beforeData?.status === "pending" && afterData?.status === "accepted") {
      const industrialistId = afterData.industrialistId;
      const recyclerId = afterData.acceptedByRecyclerId;
      const wasteType = afterData.type;

      if (!industrialistId || !recyclerId) {
        logger.error("Industrialist ID or Recycler ID is missing from the waste request.");
        return;
      }
      
      // Get recycler's profile to get their plant name
      const recyclerDoc = await db.collection("users").doc(recyclerId).get();
      const recyclerProfile = recyclerDoc.data();
      const recyclerName = recyclerProfile?.plantName || recyclerProfile?.displayName || "A recycler";
      
      const message = `Your request for ${wasteType} has been accepted by ${recyclerName}.`;

      // Create a notification document
      try {
        await db.collection("notifications").add({
          userId: industrialistId,
          message: message,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          link: `/dashboard` 
        });
        logger.info(`Notification created for user ${industrialistId}: ${message}`);
      } catch (error) {
        logger.error("Error creating notification:", error);
      }
    }
  }
);
