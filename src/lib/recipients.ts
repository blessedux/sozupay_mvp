/**
 * Recipients (providers/employees) – persisted in Supabase.
 * Use db/recipients for direct DB access; this module re-exports for API compatibility.
 */

export type { Recipient } from "@/lib/db/recipients";
export {
  createRecipientDb as createRecipient,
  getRecipientDb as getRecipient,
  listRecipientsDb as listRecipients,
  updateRecipientDb as updateRecipient,
  deleteRecipientDb as deleteRecipient,
} from "@/lib/db/recipients";
