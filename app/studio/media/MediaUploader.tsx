"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import ImageUploader from "../components/ImageUploader";
import { useToast } from "../components/Toast";

export default function MediaUploader() {
  const router = useRouter();
  const [, start] = useTransition();
  const { show } = useToast();
  return (
    <ImageUploader
      folder="library"
      multiple
      onUploaded={() => {
        show("Uploaded", "success");
        start(() => router.refresh());
      }}
    />
  );
}
