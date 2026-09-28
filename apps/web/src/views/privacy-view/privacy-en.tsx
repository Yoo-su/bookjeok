export const PrivacyEn = () => {
  return (
    <>
      <div className="mb-8 border-b border-stone-200 pb-8 text-sm text-stone-500">
        <p>Effective Date: January 1, 2026</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 1 (Purpose of Processing Personal Information)
        </h2>
        <p>
          Bookjeok (the "Service") processes personal information for the
          following purposes. The processed personal information will not be
          used for purposes other than the following, and prior consent will be
          sought if the purpose of use changes.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>Membership Registration and Management:</strong> User
            identification, prevention of fraudulent use of the service, and
            various notices.
          </li>
          <li>
            <strong>Service Provision:</strong> Operating core functions of the
            service such as writing book reviews and providing used book trading
            features.
          </li>
          <li>
            <strong>Handling Inquiries and Reports:</strong> Reviewing book
            requests, bug reports, and suggestions, informing you of the
            outcome, and improving the service.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 2 (Items of Personal Information Collected and Methods of
          Collection)
        </h2>
        <p>
          The Service collects personal information for membership registration
          and smooth service provision.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>Registration via Email:</strong> Email address, password,
            nickname.
          </li>
          <li>
            <strong>
              Registration via Social Login (Kakao, Naver) Integration:
            </strong>{" "}
            Social identifier (providerID), profile image URL, nickname (※ We do
            not collect or store the email address linked to your social
            account.)
          </li>
          <li>
            <strong>When Sending an Inquiry or Report:</strong> Inquiry type and
            content, requested book details (title, author, publisher), and the
            address of the page it was sent from.
          </li>
          <li>
            <strong>Automatically Collected Items during Service Use:</strong>{" "}
            Connection IP address, cookies, service usage records (date & time
            of visit, activity logs, etc.), device information, and browser
            type.
          </li>
          <li>
            <strong>Collection Method:</strong> User direct input during signup,
            automatic collection via integrated social login APIs, and automatic
            generation by activity logging systems during service use.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 3 (Processing and Retention Period of Personal Information)
        </h2>
        <p>
          In principle, personal information is destroyed without delay after
          the purpose of collection and use is achieved.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>Retention Period:</strong> From the date of membership
            registration until membership withdrawal.
          </li>
          <li>
            <strong>Destruction Procedure:</strong> Personal information that
            has achieved its collection and use purpose (such as on withdrawal)
            is destroyed immediately.
          </li>
          <li>
            <strong>Destruction Method:</strong> Personal information stored in
            electronic file formats is permanently deleted using technical
            methods that render records unrecoverable. Personal information
            printed on paper is shredded or incinerated.
          </li>
          <li>
            <strong>Data Handling on Withdrawal:</strong> Upon membership
            withdrawal, your direct identifying details are anonymized or
            immediately destroyed. Saved reading logs and reviews are
            permanently deleted, while comments written on other posts are
            anonymized by disconnecting the user link. Inquiries and reports you
            sent are also kept as service improvement records after the user
            link is removed.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 4 (Provision of Personal Information to Third Parties)
        </h2>
        <p>
          As a matter of principle, this Service does not provide the personal
          information of the user to outside parties. This Service does not
          commercially utilize user data or sell it to third parties.
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 5 (Rights and Duties of the Data Subject and Methods of
          Exercise)
        </h2>
        <p>Users may exercise the following rights:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            Users can view or modify their personal information at any time
            through 'My Page'.
          </li>
          <li>
            Users can withdraw their consent to the collection and use of
            personal information through the 'Withdrawal' feature in My Page.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 6 (Safety Measures for Protecting Personal Information)
        </h2>
        <p>
          The Service implements the following technical and administrative
          measures to secure personal information:
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            <strong>One-way Password Encryption:</strong> Passwords entered
            during email registration are encrypted using a one-way hashing
            algorithm (bcrypt) and cannot be decrypted even by administrators.
          </li>
          <li>
            <strong>Data Transmission Encryption:</strong> All communications of
            the service are encrypted and transmitted securely via SSL/TLS
            protocol.
          </li>
          <li>
            <strong>Access Control:</strong> Access rights to the database and
            operations systems are controlled and restricted to prevent
            unauthorized access.
          </li>
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 7 (Chief Privacy Officer)
        </h2>
        <p>
          To protect users' personal information and answer inquiries related to
          personal information, the Service designates following contact
          information for the Chief Privacy Officer.
        </p>
        <div className="bg-stone-50 p-4 rounded-lg text-sm">
          <ul className="space-y-1">
            <li>
              <strong>Email:</strong> rhan0871@naver.com
            </li>
            <li>
              <strong>Officer:</strong> Bookjeok Service Operator
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">
          Article 8 (Changes to the Privacy Policy)
        </h2>
        <p>
          This Privacy Policy is effective as of the effective date. If changes,
          additions, or deletions are made due to legislation or service policy
          adjustments, we will notify you through notice at least 7 days before
          the implementation of the changes.
        </p>
      </section>
    </>
  );
};
