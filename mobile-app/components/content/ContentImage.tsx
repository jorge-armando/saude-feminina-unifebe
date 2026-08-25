import { Image, ImageProps } from "expo-image";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

interface ContentImageProps extends Omit<ImageProps, "source"> {
  alt?: string;
  fallbackText?: boolean;
  url: string;
}

export function ContentImage({
  alt = "Imagem do artigo",
  fallbackText = false,
  onError,
  url,
  ...props
}: ContentImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (failed) {
    return fallbackText && alt ? (
      <View accessibilityRole="alert">
        <Text>{alt}</Text>
      </View>
    ) : null;
  }

  return (
    <Image
      {...props}
      accessibilityLabel={alt}
      source={{ uri: url }}
      onError={(event) => {
        setFailed(true);
        onError?.(event);
      }}
    />
  );
}
