"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { ReviewFormValues } from "@/features/review/types";
import { PATHS } from "@/shared/constants/paths";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getAuthHeader(): Promise<HeadersInit> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function createReview(data: ReviewFormValues) {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}${PATHS.REVIEWS}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to create review",
      };
    }

    revalidatePath("/my-page");
    return { success: true };
  } catch (error) {
    console.error("Create review error:", error);
    return { success: false, error: "Network error occurred" };
  }
}

export async function updateReview(id: number, data: ReviewFormValues) {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}${PATHS.REVIEW_DETAIL(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || "Failed to update review",
      };
    }

    revalidatePath(`/review/${id}`);
    revalidatePath("/my-page");
    return { success: true };
  } catch (error) {
    console.error("Update review error:", error);
    return { success: false, error: "Network error occurred" };
  }
}

export async function getReview(id: number) {
  try {
    const headers = await getAuthHeader();
    const response = await fetch(`${API_URL}${PATHS.REVIEW_DETAIL(id)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
    });

    if (!response.ok) {
      return { success: false, error: "Failed to fetch review" };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error("Get review error:", error);
    return { success: false, error: "Network error occurred" };
  }
}
