"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export function useDocuments(userId?: string, category?: string) {
  const documents = useQuery(api.documents.listDocuments, {
    userId: userId ? (userId as any) : undefined,
    documentType: category || undefined,
  }) || [];

  const createDocMut = useMutation(api.documents.createDocument);
  const replaceDocMut = useMutation(api.documents.replaceDocumentFile);
  const deleteDocMut = useMutation(api.documents.deleteDocument);
  const generateUploadUrlMut = useMutation(api.documents.generateUploadUrl);

  return {
    documents,
    createDocument: createDocMut,
    replaceDocument: replaceDocMut,
    deleteDocument: deleteDocMut,
    generateUploadUrl: generateUploadUrlMut,
  };
}
