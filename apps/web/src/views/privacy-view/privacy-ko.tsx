export const PrivacyKo = () => {
  return (
    <>
      <div className="mb-8 border-b border-stone-200 pb-8 text-sm text-stone-500">
        <p>시행일자: 2026년 1월 1일</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          제 1 조 (개인정보의 처리 목적)
        </h2>
        <p>
          북적(bookjeok)(이하 ‘서비스’)은 개인정보를 다음의 목적을 위해
          처리합니다. 처리한 개인정보는 다음의 목적 이외의 용도로는 사용되지
          않으며 이용 목적이 변경될 시에는 사전 동의를 구할 예정입니다.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>회원 가입 및 관리:</strong> 회원 식별, 서비스 부정 이용
            방지, 각종 고지 및 통지
          </li>
          <li>
            <strong>서비스 제공:</strong> 도서 리뷰 작성, 중고책 거래 기능 제공
            등 서비스의 핵심 기능 운영
          </li>
          <li>
            <strong>문의·제보 처리:</strong> 책 요청·버그 제보·기능 제안 등 문의
            내용 확인, 처리 결과 안내, 서비스 개선
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          제 2 조 (수집하는 개인정보의 항목 및 수집 방법)
        </h2>
        <p>
          서비스는 회원가입 및 원활한 서비스 제공을 위해 아래와 같은 개인정보를
          수집하고 있습니다.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>이메일 직접 회원가입 시:</strong> 이메일 주소, 비밀번호,
            닉네임
          </li>
          <li>
            <strong>소셜 로그인(카카오, 네이버) 연동 회원가입 시:</strong> 소셜
            식별자(providerID), 프로필 이미지 URL, 닉네임 (※ 소셜 계정의
            이메일은 수집·저장하지 않습니다.)
          </li>
          <li>
            <strong>문의·제보 시:</strong> 문의 종류와 내용, 요청한 도서
            정보(제목·저자·출판사), 문의를 보낸 화면의 주소
          </li>
          <li>
            <strong>서비스 이용 과정에서 자동 수집되는 항목:</strong> 접속 IP
            정보, 쿠키, 서비스 이용 기록(방문 일시, 활동 로그 등), 기기 정보 및
            브라우저 종류
          </li>
          <li>
            <strong>수집 방법:</strong> 회원가입 시 사용자의 직접 입력, 연동된
            소셜 로그인 API를 통한 자동 수집, 서비스 이용 중 생성 로그 수집
            도구에 의한 자동 수집
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          제 3 조 (개인정보의 처리 및 보유 기간)
        </h2>
        <p>
          원칙적으로, 개인정보 수집 및 이용 목적이 달성된 후에는 해당 정보를
          지체 없이 파기합니다.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>보유 기간:</strong> 회원 가입일로부터 회원 탈퇴 시까지
          </li>
          <li>
            <strong>파기 절차:</strong> 수집 및 이용 목적이 달성된 개인정보(회원
            탈퇴 등)는 목적 달성 즉시 파기합니다.
          </li>
          <li>
            <strong>파기 방법:</strong> 전자적 파일 형태로 저장된 개인정보는
            기록을 재생할 수 없는 기술적 방법을 사용하여 영구 삭제하며, 종이
            등에 출력된 개인정보는 분쇄하거나 소각하여 파기합니다.
          </li>
          <li>
            <strong>탈퇴 시 데이터 처리:</strong> 회원 탈퇴 시 사용자의 직접적인
            식별 정보는 익명화되거나 즉각 파기됩니다. 작성하신 독서 기록 및
            리뷰는 영구 삭제되며, 타인의 글에 단 댓글은 개인정보 연결 해제 후
            익명 상태로 유지됩니다. 보내신 문의·제보도 작성자 연결을 해제한 뒤
            서비스 개선 기록으로 보관됩니다.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          제 4 조 (개인정보의 제3자 제공 여부)
        </h2>
        <p>
          본 서비스는 사용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다.
          사용자 데이터를 상업적으로 활용하거나 제3자에게 매각하지 않습니다.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          제 5 조 (정보주체의 권리, 의무 및 그 행사방법)
        </h2>
        <p>사용자는 다음과 같은 권리를 행사할 수 있습니다.</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            이용자는 언제든지 '마이페이지'를 통해 자신의 개인정보를 조회하거나
            수정할 수 있습니다.
          </li>
          <li>
            이용자는 마이페이지 내의 '회원 탈퇴' 기능을 통해 개인정보의 수집 및
            이용 동의를 철회할 수 있습니다.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          제 6 조 (개인정보의 안전성 확보 조치)
        </h2>
        <p>
          서비스는 개인정보의 안전성 확보를 위해 다음과 같은 기술적, 관리적
          조치를 취하고 있습니다.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>비밀번호 단방향 암호화:</strong> 직접 회원가입 시 입력한
            비밀번호는 일방향 해시 알고리즘(bcrypt)으로 암호화되어 저장되므로
            관리자도 이를 복호화할 수 없습니다.
          </li>
          <li>
            <strong>개인정보 송수신 암호화:</strong> 서비스의 모든 데이터 통신은
            SSL/TLS 보안 프로토콜을 통과하여 암호화 전송됩니다.
          </li>
          <li>
            <strong>접근 통제:</strong> 데이터베이스 및 운영 시스템의
            물리적·기술적 접근 권한을 통제하여 비인가 접근을 예방합니다.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          제 7 조 (개인정보 관리 책임자)
        </h2>
        <p>
          개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한
          정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보
          보호책임자를 지정하고 있습니다.
        </p>
        <div className="bg-stone-50 p-4 rounded-lg text-sm">
          <ul className="space-y-1">
            <li>
              <strong>이메일:</strong> rhan0871@naver.com
            </li>
            <li>
              <strong>책임자:</strong> 북적 서비스 운영자
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          제 8 조 (개인정보 처리방침의 변경)
        </h2>
        <p>
          본 개인정보 처리방침은 시행일로부터 적용되며, 관련 법령 및 서비스의
          필요성에 의해 개정 내용이 추가, 삭제 또는 정정되는 경우에는 변경사항
          시행 최소 7일 전부터 서비스 내 공지를 통해 알릴 것입니다.
        </p>
      </section>
    </>
  );
};
