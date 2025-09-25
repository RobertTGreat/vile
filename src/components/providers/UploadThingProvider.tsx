'use client'

import { NextSSRPlugin } from "@uploadthing/next/ssr-plugin";
import { generateComponents } from "@uploadthing/react";
import type { OurFileRouter } from "@/lib/uploadthing";

export const { UploadButton, UploadDropzone, Uploader } = generateComponents<OurFileRouter>();

export function UploadThingProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <NextSSRPlugin
        routerConfig={{
          ourFileRouter: require("@/lib/uploadthing").ourFileRouter,
        }}
      />
      {children}
    </>
  );
}
