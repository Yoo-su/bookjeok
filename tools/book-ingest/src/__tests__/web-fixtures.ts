export const ISBN = "9788937449673";

/** Synthetic pages retain the structures observed on the public sites. */
export function aladinHtml() {
  return `<meta property="books:isbn" content="${ISBN}">
    <meta property="og:image" content="https://image.aladin.co.kr/product/40350/74/cover500/8937449676_1.jpg">
    <script type="application/ld+json">${JSON.stringify({
      "@type": "Book",
      name: "검증용 도서",
      genre: "한국소설",
      url: "https://www.aladin.co.kr/shop/wproduct.aspx?ItemId=403507480",
      offers: { price: 16200 },
      workExample: [
        {
          isbn: ISBN,
          bookFormat: "https://schema.org/Paperback",
          datePublished: "2026-10-02",
        },
      ],
    })}</script>
    <span class="Ere_bo_title">검증용 도서</span>
    <li class="Ere_sub2_title"><a href="?AuthorSearch=a">저자 하나</a>, <a href="?AuthorSearch=b">저자 둘</a> (지은이),
      <a href="?AuthorSearch=c">역자</a> (옮긴이)<span></span><a href="?PublisherSearch=p">민음사</a>2026-10-02</li>
    <div class="info_list"><ul><li><div class="Litem">정가</div><div class="Ritem"><del>18,000원</del></div></li></ul></div>
    <div id="wa_product_top1_wa_Top_Ranking_pnlRanking">Sales Point : <strong>2,540</strong></div>
    <input class="hd_ISBN" value="8937449676">
    <div class="conts_info_list1"><ul><li>416쪽</li><li>135*205mm</li><li>541g</li><li>ISBN : ${ISBN}</li></ul></div>`;
}

export const descriptionHtml = `<div>출판사 광고·최근작</div>
  <div id="div_PublisherDesc_Short">잘린 소개</div>
  <div id="div_PublisherDesc_All"><a href="javascript:fn_hide_introduce('PublisherDesc')">전문 첫 문장 &amp; 둘째.<br>다음 문단.</a>
  <a class="Ere_sub_gray8" href="javascript:fn_hide_introduce('PublisherDesc')">접기</a></div>`;

export const yes24SearchHtml = `<ul id="yesSchList"><li data-goods-no="197318629"><span class="gd_res">[도서]</span>
  <a href="/product/goods/197318629">검증용 도서</a></li></ul>`;

export function yes24Html(isbn = ISBN, size = "135*205*30mm") {
  return `<div id="infoset_specific"><table>
    <tr><th>쪽수, 무게, 크기</th><td>416쪽 | 426g | ${size}</td></tr>
    <tr><th>ISBN13</th><td>${isbn}</td></tr></table></div>`;
}
