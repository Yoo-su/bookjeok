/** 공지 소개 모달이 받는 props. AnnouncementHost가 열고 닫는다 */
export interface AnnouncementProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}
