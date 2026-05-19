// Reads popup-type notices from the admin DB and renders the highest-priority
// active popup as an "Announcement" modal. Auto-dismissed via localStorage.
import { listNotices } from "../../lib/admin/repos/notices";
import PopupNoticeClient from "./PopupNoticeClient";

export default async function PopupNotice() {
  const all = await listNotices({ onlyLive: true, type: "popup" });
  const popup = all[0];
  if (!popup) return null;
  return <PopupNoticeClient notice={popup} />;
}
