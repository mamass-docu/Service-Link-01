import { get, update, where, serverTimestamp } from "../databaseHelper";
import { getAuth } from "firebase/auth";
import { app } from "../firebase";

export const updateCustomerUserName = async (id, name) => {
  try {
    const snapshot = await get("bookings", where("customerId", "==", id));

    const updatePromises = snapshot.docs.map(async (bookingDoc) =>
      update("bookings", bookingDoc.id, { customerName: name })
    );

    await Promise.all(updatePromises);
    console.log("All usernames updated successfully!");
  } catch (error) {
    console.error("Error updating usernames:", error);
  }
};

export const updateProviderUserName = async (id, name) => {
  try {
    const snapshot = await get("bookings", where("providerId", "==", id));

    const updatePromises = snapshot.docs.map(async (bookingDoc) =>
      update("bookings", bookingDoc.id, { providerName: name })
    );

    await Promise.all(updatePromises);

    const snap = await get("providerServices", where("providerId", "==", id));

    const updateServicePromises = snap.docs.map(async (doc) =>
      update("providerServices", doc.id, { providerName: name })
    );

    await Promise.all(updateServicePromises);
    console.log("All usernames updated successfully!");
  } catch (error) {
    console.error("Error updating usernames:", error);
  }
};

export const updateProviderUserImage = async (id, image) => {
  try {
    const snap = await get("providerServices", where("providerId", "==", id));

    const updateServicePromises = snap.docs.map(async (doc) =>
      update("providerServices", doc.id, { providerImage: image })
    );

    await Promise.all(updateServicePromises);
    console.log("All usernames updated successfully!");
  } catch (error) {
    console.error("Error updating usernames:", error);
  }
};

export const logout = async (userId, setUserId) => {
  const auth = getAuth(app);
  await update("users", userId, {
    isOnline: false,
    lastSeen: serverTimestamp(),
  });

  await auth.signOut();

  setUserId(null);
};
