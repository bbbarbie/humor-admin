"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSuperadminForAction } from "@/lib/admin/require-superadmin-action";

export async function createImageAction(formData: FormData) {
  const { supabase, profileId } = await requireSuperadminForAction();

  const payload = {
    url: String(formData.get("url") || "").trim(),
    created_by_user_id: profileId,
    modified_by_user_id: profileId,
  };

  if (!payload.url) {
    throw new Error("Image URL is required");
  }

  const { error } = await supabase.from("images").insert(payload);

  if (error) {
    throw new Error(`Failed to create image: ${error.message}`);
  }

  revalidatePath("/admin/images");
  revalidatePath("/admin");
  redirect("/admin/images");
}

export async function updateImageAction(id: string, formData: FormData) {
  const { supabase, profileId } = await requireSuperadminForAction();

  const payload = {
    url: String(formData.get("url") || "").trim(),
    modified_by_user_id: profileId,
  };

  if (!payload.url) {
    throw new Error("Image URL is required");
  }

  const { error } = await supabase.from("images").update(payload).eq("id", id);

  if (error) {
    throw new Error(`Failed to update image: ${error.message}`);
  }

  revalidatePath("/admin/images");
  revalidatePath(`/admin/images/${id}`);
  revalidatePath("/admin");
  redirect(`/admin/images/${id}`);
}

export async function deleteImageAction(formData: FormData) {
  const { supabase } = await requireSuperadminForAction();

  const id = String(formData.get("id") || "").trim();
  if (!id) {
    throw new Error("Missing image id");
  }

  const { error } = await supabase.from("images").delete().eq("id", id);

  if (error) {
    throw new Error(`Failed to delete image: ${error.message}`);
  }

  revalidatePath("/admin/images");
  revalidatePath("/admin");
  redirect("/admin/images");
}
