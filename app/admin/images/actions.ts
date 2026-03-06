"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function requireSuperadmin() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_superadmin")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_superadmin !== true) {
    redirect("/admin");
  }

  return supabase;
}

export async function createImageAction(formData: FormData) {
  const supabase = await requireSuperadmin();

  const payload = {
    image_url: String(formData.get("image_url") || "").trim(),
  };

  if (!payload.image_url) {
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
  const supabase = await requireSuperadmin();

  const payload = {
    image_url: String(formData.get("image_url") || "").trim(),
  };

  if (!payload.image_url) {
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
  const supabase = await requireSuperadmin();

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
