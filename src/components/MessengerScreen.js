import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Platform,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../firebase";
import {
  collection,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
  doc,
} from "firebase/firestore";
import { useAppContext } from "../../AppProvider";
import ListScreen from "./ListScreen";
import ProfileImageScreen from "./ProfileImage";
import { setIsLoading } from "../databaseHelper";
import { DateTimeConverter } from "../db/DateTimeConverter";

export default function MessengerScreen({ navigation }) {
  const [chatHeads, setChatHeads] = useState([]);
  const [messengers, setMessengers] = useState([]);
  const loaded = useRef(false);

  const { userId, userRole } = useAppContext();

  const callback = () => {
    setIsLoading(true);
    loaded.current = false;
    let users = {};
    let unsubscribeMess = null;

    const messengerQuery =
      userRole == "Provider"
        ? query(collection(db, "users"))
        : query(collection(db, "users"), where("role", "!=", "Admin"));

    const unsubscribeActive = onSnapshot(messengerQuery, (snapshot) => {
      let activeUsers = [];
      // let temp = messengers;
      users = {};
      console.log("users snap messager");

      snapshot.docs.forEach((doc) => {
        if (doc.id == userId) return;

        const user = doc.data();

        users[doc.id] = {
          name: user.name,
          image: user.image ?? null,
          isOnline: user.isOnline ?? false,
        };
        // for (let i in temp) {
        //   let mess = temp[i];
        //   if (mess.otherUserId != doc.id) continue;

        //   temp[i] = {
        //     ...mess,
        //     otherUserName: user.name,
        //     otherUserImage: user.image,
        //     isOnline: user.isOnline,
        //   };
        //   break;
        // }

        if (!user.isOnline) return;

        activeUsers.push({
          name: user.name,
          otherUserId: doc.id,
          otherUserName: user.name,
          otherUserImage: user.image ?? null,
        });
      });
      console.log("setting of user");

      // setMessengers(temp);
      setChatHeads(activeUsers);

      if (unsubscribeMess) return;

      const messageQuery = query(
        collection(db, "messages"),
        where("participants", "array-contains", userId),
        orderBy("sentAt", "desc")
      );

      unsubscribeMess = onSnapshot(messageQuery, (snapshot) => {
        let temp = [];
        let checked = {};
        // console.log(users);

        try {
          for (let i in snapshot.docs) {
            const message = snapshot.docs[i].data();

            const otherUserId =
              message.participants[0] == userId
                ? message.participants[1]
                : message.participants[0];

            if (checked[otherUserId] || !otherUserId || userId == otherUserId)
              continue;

            checked[otherUserId] = true;
            const userData = users[otherUserId];

            temp.push({
              sentAt: DateTimeConverter(message.sentAt),
              lastMessage: message.message,
              name: userData.name,
              otherUserId: otherUserId,
              otherUserName: userData.name,
              otherUserImage: userData.image,
              isOnline: userData.isOnline,
              seen: message.senderId == userId ? true : message.seen,
            });
          }

          setMessengers(temp);
        } catch (e) {
          console.log(e, "error sa getting messages");
        } finally {
          console.log("snap message");
          if (loaded.current) return;

          console.log("close loading message");

          loaded.current = true;
          setIsLoading(false);
        }
      });
    });

    return () => {
      console.log("unsubs");
      loaded.current = false;
      unsubscribeActive();
      if (unsubscribeMess) unsubscribeMess();
    };
  };

  useFocusEffect(useCallback(callback, []));

  const renderChatHead = (item) => (
    <View style={styles.chatHeadWrapper}>
      <TouchableOpacity
        style={styles.chatHeadContainer}
        onPress={() =>
          navigation.navigate("Message", {
            otherUserId: item.otherUserId,
            otherUserName: item.otherUserName,
            otherUserImage: item.otherUserImage,
          })
        }
      >
        <View style={styles.chatHeadImageContainer}>
          <ProfileImageScreen
            image={item.otherUserImage}
            name={item.otherUserName}
            style={styles.chatHeadImage}
          />
          {/* <Image
            source={{
              uri: item.otherUserImage,
            }}
            style={styles.chatHeadImage}
          /> */}
          <View style={styles.onlineIndicator} />
        </View>
        <Text style={styles.chatHeadName} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderChatItem = (item) => (
    <TouchableOpacity
      style={styles.chatItemContainer}
      onPress={() =>
        navigation.navigate("Message", {
          otherUserId: item.otherUserId,
          otherUserName: item.otherUserName,
          otherUserImage: item.otherUserImage,
        })
      }
    >
      <View style={styles.chatItemLeft}>
        <View style={styles.avatarContainer}>
          <ProfileImageScreen
            image={item.otherUserImage}
            name={item.otherUserName}
            style={styles.avatar}
          />
          {/* <Image source={{ uri: item.otherUserImage }} style={styles.avatar} /> */}
          {/* {item.isOnline && <View style={styles.onlineIndicator} />} */}
        </View>
        <View style={styles.chatItemInfo}>
          <Text style={styles.chatItemName}>{item.name}</Text>
          <Text
            style={{
              ...styles.chatItemService,
              fontWeight: item.seen ? "400" : "800",
            }}
          >
            {item.lastMessage}
          </Text>
          <Text style={styles.chatItemMessage}>{item.sentAt}</Text>

          {!item.seen ? (
            <View style={styles.notSeenIndicator} />
          ) : (
            <Text style={styles.seenText}>seen</Text>
          )}
        </View>
      </View>
      <Text style={styles.chatItemTime}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity onPress={() => navigation.navigate("UserSearch")}>
          <Icon name="magnify" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Chat Heads */}
      <View style={styles.chatHeadsContainer}>
        <ListScreen
          data={chatHeads}
          keyExtractor={(item) => item.otherUserId}
          contentContainerStyle={styles.chatHeadsScroll}
          horizontal
          showsHorizontalScrollIndicator={false}
          renderItem={renderChatHead}
        />
        {/* <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chatHeadsScroll}
        >
          {chatHeads.map((chatHead) => (
            <View key={chatHead.otherUserId} style={styles.chatHeadWrapper}>
              {renderChatHead({ item: chatHead })}
            </View>
          ))}
        </ScrollView> */}
      </View>

      {/* Chat List */}
      {/* <FlatList
        data={messengers}
        renderItem={renderChatItem}
        keyExtractor={(item) => item.otherUserId?.toString()}
        contentContainerStyle={styles.chatList}
      /> */}

      <ListScreen
        data={messengers}
        keyExtractor={(item) => item.otherUserId}
        contentContainerStyle={styles.chatList}
        renderItem={renderChatItem}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: Platform.OS === "android" ? 40 : 16, // Added padding for Android
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
  },
  chatHeadsContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  chatHeadsScroll: {
    padding: 16,
  },
  chatHeadWrapper: {
    marginRight: 20,
  },
  chatHeadContainer: {
    alignItems: "center",
    width: 70,
  },
  chatHeadImageContainer: {
    position: "relative",
    marginBottom: 8,
  },
  chatHeadImage: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: "#F0F0F0",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notSeenIndicator: {
    position: "absolute",
    top: 24,
    right: 2,
    width: 10,
    height: 10,
    borderRadius: 7,
    backgroundColor: "#2022ff",
  },
  seenText: {
    position: "absolute",
    top: 24,
    right: 2,
    paddingRight: 5,
    paddingLeft: 5,
    paddingBottom: 2,
    color:"#094512",
    borderRadius: 5,
    fontSize: 12,
    backgroundColor: "#98f2a5"
  },
  chatHeadName: {
    fontSize: 13,
    color: "#333",
    textAlign: "center",
    width: 70,
    fontWeight: "500",
  },
  chatItemContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  chatItemLeft: {
    flexDirection: "row",
    flex: 1,
  },
  avatarContainer: {
    position: "relative",
    marginRight: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#F0F0F0",
  },
  chatItemInfo: {
    flex: 1,
    justifyContent: "center",
  },
  chatItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 2,
  },
  chatItemService: {
    fontSize: 15,
    color: "#666",
    marginBottom: 4,
    fontWeight: "500",
  },
  chatItemMessage: {
    fontSize: 14,
    color: "#999",
  },
  chatItemTime: {
    fontSize: 12,
    color: "#999",
    marginLeft: 8,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  chatList: {
    flexGrow: 1,
  },
});
