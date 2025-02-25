import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { db } from "../../db/firebase";
import { useAppContext } from "../../../AppProvider";
import ListScreen from "../components/ListScreen";
import ProfileImageScreen from "../components/ProfileImage";
import {
  addNotif,
  get,
  serverTimestamp,
  specificLoadingProcess,
  update,
  updateAllAsSeen,
  useSelector,
} from "../../helpers/databaseHelper";
import { DateTimeConverter } from "../../db/DateTimeConverter";
import EmptyScreen from "../components/EmptyScreen";

const MessageScreen = ({ route, navigation }) => {
  const [messages, setMessages] = useState([]);

  const [newMessage, setNewMessage] = useState("");
  const { userId, userName, userImage } = useAppContext();
  const isLoading = useSelector((state) => state.loading.specific);

  const { otherUserId, otherUserName, otherUserImage } = route.params;
  // useFocusEffect(useCallback(() => {

  const scrollViewRef = useRef(null);

  const updateMessagesAsSeen = async () => {
    const snap = await get(
      "messages",
      where("senderId", "==", otherUserId),
      where("participants", "array-contains", userId),
      where("seen", "==", false)
    );
    snap.docs.forEach((doc) => {
      console.log(doc.id, doc.data().message, "updating as seen message");

      update("messages", doc.id, { seen: true });
    });
  };

  useEffect(() => {
    // const uri = require(otherUserImage)
    console.log(otherUserImage);

    // console.log(imageRef.current);

    const messageQuery = query(
      collection(db, "messages"),
      where("participants", "array-contains", userId),
      orderBy("sentAt", "asc")
    );
    const unsubscribe = onSnapshot(messageQuery, (snapshot) => {
      updateAllAsSeen(userId, "Message");
      updateMessagesAsSeen();

      let temp = [];
      snapshot.docs.forEach((dc) => {
        const message = dc.data();

        if (message.participants.some((mess) => mess == otherUserId)) {
          let strDatetime = DateTimeConverter(message.sentAt);

          temp.push({
            id: dc.id,
            message: message.message,
            isUserSender: message.senderId == userId,
            seen: message.seen,
            sentAt: strDatetime,
          });
        }
      });
      if (temp.length == 0) return;

      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: false });
      }
      setMessages(temp);
    });

    return () => {
      console.log("unsubs message");
      unsubscribe();
    };
  }, []);

  const sendMessage = () => {
    if (isLoading || newMessage.trim() == "") return;

    specificLoadingProcess(async () => {
      const newMsg = {
        participants: [userId, otherUserId],
        message: newMessage,
        seen: false,
        sentAt: serverTimestamp(),
        senderId: userId,
      };
      setNewMessage("");
      await addDoc(collection(db, "messages"), newMsg);
      let params = { otherUserId: userId, otherUserName: userName };
      if (userImage) params["otherUserImage"] = userImage;
      addNotif(
        otherUserId,
        `Message from ${otherUserName}`,
        newMessage,
        "Message",
        params
      );
    });
  };

  // function getDateTime() {
  //   const date = new Date();
  //   const day = String(date.getDate()).padStart(2, "0");
  //   const month = String(date.getMonth() + 1).padStart(2, "0");
  //   const year = date.getFullYear();
  //   const hours = String(date.getHours()).padStart(2, "0");
  //   const minutes = String(date.getMinutes()).padStart(2, "0");
  //   const seconds = String(date.getSeconds()).padStart(2, "0");

  //   return `${month}-${day}-${year} ${hours}:${minutes}:${seconds}`;
  // }

  const renderItem = (item) => (
    <View
      key={item.id}
      style={[
        styles.messageRow,
        item.isUserSender ? styles.sentMessageRow : styles.receivedMessageRow,
      ]}
    >
      {!item.isUserSender && (
        <ProfileImageScreen
          image={otherUserImage}
          name={otherUserName}
          style={{
            width: 36,
            height: 36,
            borderRadius: 28,
            // backgroundColor: "#F0F0F0",
            // justifyContent: "center",
            // alignItems: "center",
            marginRight: 8,
          }}
          textSize={18}
        />

        // <Image
        //   source={{ uri: otherUserImage }}
        //   style={{
        //     width: 36,
        //     height: 36,
        //     borderRadius: 28,
        //     backgroundColor: "#F0F0F0",
        //     justifyContent: "center",
        //     alignItems: "center",
        //     marginRight: 8,
        //   }}
        // />
      )}
      {/* <View style={styles.avatar}> */}
      {/* <Text style={styles.avatarText}>{otherUserName.charAt(0)}</Text> */}
      {/* </View> */}
      <View
        style={[
          styles.messageBubble,
          item.isUserSender
            ? styles.sentMessageBubble
            : styles.receivedMessageBubble,
        ]}
      >
        {!item.isUserSender && (
          <Text style={styles.senderName}>{otherUserName}</Text>
        )}
        <Text
          style={[
            styles.messageText,
            item.isUserSender && styles.sentMessageText,
          ]}
        >
          {item.message}
        </Text>
        <Text style={[styles.timeText]}>{item.sentAt ?? "Sending..."}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUserName}</Text>
        <Icon name="dots-vertical" size={24} color="#333" />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        {/* <ListScreen
        contentContainerStyle={styles.messageList}
        data={messages}
        renderItem={renderItem}
      /> */}
        {messages.length == 0 ? (
          <EmptyScreen message="No messages found." />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messageList}
            scrollEventThrottle={16}
          >
            {messages.map((message) => renderItem(message))}
          </ScrollView>
        )}

        {/* <FlatList
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.messageList}
        initialNumToRender={15} 
        maxToRenderPerBatch={5} 
        windowSize={21}
      /> */}

        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Icon name="plus" size={24} color="#666" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#999"
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Icon name="send" size={22} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

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
    borderBottomWidth: 1,
    borderBottomColor: "#EEEEEE",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  messageList: {
    padding: 16,
    paddingBottom: 60,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
  },
  receivedMessageRow: {
    justifyContent: "flex-start",
  },
  sentMessageRow: {
    justifyContent: "flex-end",
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFB800",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  avatarText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  messageBubble: {
    maxWidth: "75%",
    padding: 12,
    borderRadius: 20,
  },
  receivedMessageBubble: {
    backgroundColor: "#F0F0F0",
  },
  sentMessageBubble: {
    backgroundColor: "#FFB800",
  },
  senderName: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: "#333",
    lineHeight: 20,
  },
  sentMessageText: {
    color: "#FFFFFF",
  },
  timeText: {
    fontSize: 11,
    color: "#999",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  sentTimeText: {
    color: "#FFFFFF",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEEEEE",
    backgroundColor: "#FFFFFF",
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    marginHorizontal: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    fontSize: 15,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: "#FFB800",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default MessageScreen;
