"use server";

import {
  updateGoodreads,
  type GoodreadsRefreshState,
} from "@/lib/admin/goodreads-refresh";

export async function refreshGoodreadsAction(
  _previous: GoodreadsRefreshState,
  formData: FormData,
): Promise<GoodreadsRefreshState> {
  return updateGoodreads(
    formData.get("intent") === "publish" ? "publish" : "refresh",
  );
}
