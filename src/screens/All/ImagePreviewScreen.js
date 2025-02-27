import { View, StyleSheet, Text, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width, height } = Dimensions.get("window");

export const ImagePreviewScreen = ({ image, navigation }) => {
  return (
    <Image
      source={{ uri: image }}
      resizeMode="contain"
      style={{
        aspectRatio: 1,
        maxWidth: 130,
        maxHeight: 150,
        borderRadius: 5,
      }}
    />
  );
};
