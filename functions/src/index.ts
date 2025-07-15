/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { onDocumentUpdated, onDocumentCreated } from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import { initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

initializeApp();
const db = getFirestore();


// Function to create a notification when a waste request is accepted by a recycler
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

      // Create a notification document for the industrialist
      try {
        await db.collection("notifications").add({
          userId: industrialistId,
          message: message,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          link: `/dashboard` 
        });
        logger.info(`Notification created for industrialist ${industrialistId}: ${message}`);
      } catch (error) {
        logger.error("Error creating notification for industrialist:", error);
      }
    }
  }
);

// Function to create notifications when a transporter accepts a job
export const onJobAccepted = onDocumentUpdated(
    "wasteRequests/{requestId}",
    async (event) => {
        logger.info("Function onJobAccepted triggered for request:", event.params.requestId);

        const beforeData = event.data?.before.data();
        const afterData = event.data?.after.data();

        // Check if the status changed from 'accepted' to 'in-transit'
        if (beforeData?.status === "accepted" && afterData?.status === "in-transit") {
            const industrialistId = afterData.industrialistId;
            const recyclerId = afterData.acceptedByRecyclerId;
            const transporterName = afterData.transporterName || "A transporter";
            const wasteType = afterData.type;

            if (!industrialistId || !recyclerId) {
                logger.error("Industrialist or Recycler ID is missing.");
                return;
            }

            const message = `${transporterName} is on their way to pick up the ${wasteType} waste.`;

            // Create notification for the industrialist
            const industrialistNotification = db.collection("notifications").add({
                userId: industrialistId,
                message: message,
                read: false,
                createdAt: FieldValue.serverTimestamp(),
                link: `/dashboard`
            });

            // Create notification for the recycler
            const recyclerNotification = db.collection("notifications").add({
                userId: recyclerId,
                message: message,
                read: false,
                createdAt: FieldValue.serverTimestamp(),
                link: `/dashboard`
            });

            try {
                await Promise.all([industrialistNotification, recyclerNotification]);
                logger.info(`Notifications sent to industrialist ${industrialistId} and recycler ${recyclerId}.`);
            } catch (error) {
                logger.error("Error creating notifications for job acceptance:", error);
            }
        }
    }
);


// Function to notify industrialists when a new recycled material is added
export const onNewRecycledMaterial = onDocumentCreated(
  "recycledMaterials/{materialId}",
  async (event) => {
    const materialData = event.data?.data();
    if (!materialData) {
      logger.info("No data associated with the event");
      return;
    }

    const materialType = materialData.type;
    const recyclerId = materialData.recyclerId;

    // Get recycler's profile to get their plant name
    const recyclerDoc = await db.collection("users").doc(recyclerId).get();
    const recyclerProfile = recyclerDoc.data();
    const recyclerName = recyclerProfile?.plantName || recyclerProfile?.displayName || "A recycler";

    const message = `New material available: ${materialType} from ${recyclerName}.`;

    // Get all industrialists
    try {
      const industrialistsSnapshot = await db.collection("users").where("role", "==", "Industrialist").get();
      if (industrialistsSnapshot.empty) {
        logger.info("No industrialists found to notify.");
        return;
      }

      const batch = db.batch();
      industrialistsSnapshot.forEach(doc => {
        const industrialistId = doc.id;
        const notificationRef = db.collection("notifications").doc();
        batch.set(notificationRef, {
          userId: industrialistId,
          message: message,
          read: false,
          createdAt: FieldValue.serverTimestamp(),
          link: "/dashboard" // Or a link to a marketplace page
        });
      });

      await batch.commit();
      logger.info(`Notifications sent to ${industrialistsSnapshot.size} industrialists.`);

    } catch (error) {
      logger.error("Error sending notifications to industrialists:", error);
    }
  }
);
