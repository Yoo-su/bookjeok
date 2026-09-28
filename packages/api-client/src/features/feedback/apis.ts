import {
  AdminFeedback,
  API_PATHS,
  CreateFeedbackParams,
  CreateFeedbackResponse,
  FeedbackListResponse,
  GetAdminFeedbackParams,
  MyFeedback,
  UpdateFeedbackParams,
} from "@bookjeok/core";

import { privateApiClient } from "../../client";

/**
 * 문의·제보를 보냅니다.
 */
export const createFeedback = async (
  params: CreateFeedbackParams,
): Promise<CreateFeedbackResponse> => {
  const { data } = await privateApiClient.post<CreateFeedbackResponse>(
    API_PATHS.feedback.base,
    params,
  );
  return data;
};

/**
 * 내가 보낸 문의를 조회합니다.
 */
export const getMyFeedback = async (
  cursor?: number,
): Promise<FeedbackListResponse<MyFeedback>> => {
  const { data } = await privateApiClient.get<FeedbackListResponse<MyFeedback>>(
    API_PATHS.feedback.my,
    { params: { cursor } },
  );
  return data;
};

/**
 * 운영자: 문의 목록을 조회합니다.
 */
export const getAdminFeedback = async (
  params: GetAdminFeedbackParams & { cursor?: number },
): Promise<FeedbackListResponse<AdminFeedback>> => {
  const { data } = await privateApiClient.get<
    FeedbackListResponse<AdminFeedback>
  >(API_PATHS.feedback.admin, { params });
  return data;
};

/**
 * 운영자: 상태·답변·메모를 바꿉니다.
 */
export const updateFeedback = async (
  id: number,
  params: UpdateFeedbackParams,
): Promise<AdminFeedback> => {
  const { data } = await privateApiClient.patch<AdminFeedback>(
    API_PATHS.feedback.adminDetail(id),
    params,
  );
  return data;
};
