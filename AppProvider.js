import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import LoadingScreen from "./src/screens/components/LoadingScreen";
import { useNavigation } from "@react-navigation/native";
// import { AppState } from "react-native";
import { db } from "./src/db/firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { setNotifPrompt } from "./src/helpers/databaseHelper";
import { logout } from "./src/db/UpdateUser";
// import * as Permissions from 'expo-permissions';

// Create a context
const AppContext = createContext();

export const useAppContext = () => {
  return useContext(AppContext);
};

export const AppProvider = ({ children }) => {
  const [userId, setUserId] = useState(null);
  const [userName, setUserName] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userImage, setUserImage] = useState(null);
  // const [appState, setAppState] = useState(AppState.currentState);
  // const [notifCount, setNotifCount] = useState(0);

  const notificationListenerRef = useRef(null);
  const notifClickListenerRef = useRef(null);
  // const appStateListenerRef = useRef(null);

  const navigation = useNavigation();

  useEffect(() => {
    // async function getPermission() {
    //   const { status } = await Permissions.askAsync(Permissions.NOTIFICATIONS);
    //   if (status === 'granted') {
    //     console.log('Permission granted for notifications!');
    //   } else {
    //     console.log('Permission denied for notifications.');
    //   }
    // }

    // getPermission();
    console.log("nag mount");

    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== "granted") {
        console.log("permision not granted");
        return;
      }

      console.log("Permission granted for notifications");
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true, // Show notification alert
          shouldPlaySound: true, // Play sound
          shouldSetBadge: true, // Optionally set the badge on the app icon
        }),
      });
    }

    requestPermissions();

    // appStateListenerRef.current = AppState.addEventListener(
    //   "change",
    //   (nextState) => {
    //     console.log(nextState);

    //     setAppState(nextState);
    //   }
    // );

    return () => {
      const lg = async () => {
        if (userId) await logout(userId, setUserId);
      };
      lg();
      console.log("unmount the provider");

      removeListeners();
    };
  }, []);

  const removeListeners = () => {
    if (notifClickListenerRef.current) notifClickListenerRef.current.remove();
    // if (appStateListenerRef.current) appStateListenerRef.current.remove();
    if (notificationListenerRef.current) notificationListenerRef.current();
  };

  // const registerListener = () => {

  // }

  useEffect(() => {
    if (!userId) {
      removeListeners();
      return;
    }

    notifClickListenerRef.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log("sffs", userId);

        if (!userId) return;
        console.log("may user");

        const data = response.notification.request.content.data;
        console.log(data);

        const screen = data?.screen;
        if (!screen) return;

        // if (appState === "active") {
        //   navigation.navigate(screen, data.params);
        //   return;
        // }

        // console.log(AppState.currentState, "cur state", appState);

        // if (AppState.currentState !== "active") return;

        navigation.navigate(screen, data.params);
      });

    const q = query(
      collection(db, "notifications"),
      where("receiverId", "==", userId),
      where("prompt", "==", false),
      where("seen", "==", false),
      orderBy("sentAt", "desc")
    );
    notificationListenerRef.current = onSnapshot(q, (snapshot) => {
      snapshot.docs.forEach((dc) => {
        const notif = dc.data();

        setNotifPrompt(dc.id);

        Notifications.scheduleNotificationAsync({
          content: {
            title: notif.title,
            body: notif.body,
            data: {
              screen: notif.screen,
              notifId: dc.id,
              params: notif.params,
            },
          },
          trigger: null,
          sound: "default",
        });
      });
    });
  }, [userId]);

  return (
    <AppContext.Provider
      value={{
        userId,
        setUserId,
        userName,
        setUserName,
        userEmail,
        setUserEmail,
        userRole,
        setUserRole,
        userImage,
        setUserImage,
      }}
    >
      {children}
      <LoadingScreen />
    </AppContext.Provider>
  );
};
