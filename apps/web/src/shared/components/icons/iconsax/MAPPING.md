# lucide → iconsax 매핑

`scripts/iconsax/mapping.mjs`에서 생성됩니다. 아이콘을 추가하려면 매핑 테이블에 한 줄 넣고 `pnpm --filter @bookjeok/web icons:gen`을 실행하세요.

| 컴포넌트              | 별칭                 | 출처                                             | 비고                                                                            |
| --------------------- | -------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------- |
| `AlertCircle`         | —                    | iconsax · warning-2 (outline)                    | —                                                                               |
| `AlertTriangle`       | `TriangleAlertIcon`  | iconsax · danger (outline)                       | —                                                                               |
| `Info`                | `InfoIcon`           | iconsax · info-circle (outline)                  | —                                                                               |
| `CheckCircle2`        | `CircleCheckIcon`    | iconsax · tick-circle (outline)                  | —                                                                               |
| `XCircle`             | `OctagonXIcon`       | iconsax · close-circle (outline)                 | —                                                                               |
| `ShieldAlert`         | —                    | iconsax · shield-cross (outline)                 | —                                                                               |
| `Bell`                | —                    | iconsax · notification (outline)                 | —                                                                               |
| `ArrowUp`             | —                    | iconsax · arrow-up-01 (outline)                  | —                                                                               |
| `ArrowDown`           | —                    | iconsax · arrow-down-01 (outline)                | —                                                                               |
| `ArrowLeft`           | —                    | iconsax · arrow-left-01 (outline)                | —                                                                               |
| `ArrowRight`          | —                    | iconsax · arrow-right-01 (outline)               | —                                                                               |
| `ChevronUp`           | `ChevronUpIcon`      | iconsax · arrow-up-02 (outline)                  | —                                                                               |
| `ChevronDown`         | `ChevronDownIcon`    | iconsax · arrow-down-02 (outline)                | —                                                                               |
| `ChevronLeft`         | —                    | iconsax · arrow-left-02 (outline)                | —                                                                               |
| `ChevronRight`        | `ChevronRightIcon`   | iconsax · arrow-right-02 (outline)               | —                                                                               |
| `ArrowUpRight`        | —                    | iconsax · export-arrow-01 (outline)              | iconsax free에 대각선 화살표가 없어 '외부로 나가는 화살표'로 대체               |
| `ExternalLink`        | —                    | iconsax · export-circle-01 (outline)             | —                                                                               |
| `Plus`                | —                    | iconsax · add (outline)                          | —                                                                               |
| `Minus`               | —                    | iconsax · minus (outline)                        | —                                                                               |
| `Check`               | `CheckIcon`          | iconsax · tick-square (outline, 일부 path 추출)  | tick-square에서 체크 표시만 추출 (테두리 없는 체크가 free 세트에 없음)          |
| `X`                   | `XIcon`              | iconsax · close-circle (outline, 일부 path 추출) | close-circle에서 X만 추출                                                       |
| `Search`              | —                    | iconsax · search-normal (outline)                | —                                                                               |
| `Menu`                | —                    | iconsax · textalign-justifycenter (outline)      | iconsax의 'menu'는 2x2 점 격자라 햄버거 형태인 textalign-justifycenter를 사용   |
| `MoreVertical`        | —                    | iconsax · 3-dots-more (outline)                  | iconsax free에 세로 점 3개가 없어 가로 버전 사용                                |
| `Trash2`              | —                    | iconsax · trash (outline)                        | —                                                                               |
| `Edit`                | —                    | iconsax · edit (outline)                         | —                                                                               |
| `Pencil`              | `PenLine`            | iconsax · edit-2 (outline)                       | —                                                                               |
| `Eye`                 | —                    | iconsax · eye (outline)                          | —                                                                               |
| `Lock`                | —                    | iconsax · lock (outline)                         | —                                                                               |
| `LogIn`               | —                    | iconsax · login-01 (outline)                     | —                                                                               |
| `LogOut`              | —                    | iconsax · logout-01 (outline)                    | —                                                                               |
| `Share2`              | —                    | iconsax · share (outline)                        | —                                                                               |
| `Send`                | —                    | iconsax · send-2 (outline)                       | —                                                                               |
| `CircleIcon`          | —                    | iconsax · record (outline + bold)                | 라디오 버튼 점 — bold로 채움                                                    |
| `RefreshCw`           | —                    | iconsax · refresh-right (outline)                | —                                                                               |
| `RefreshCcw`          | —                    | iconsax · refresh-left (outline)                 | —                                                                               |
| `RotateCcw`           | —                    | iconsax · rotate-left (outline)                  | —                                                                               |
| `Repeat`              | —                    | iconsax · repeat-arrow (outline)                 | 'repeat'은 outline 스타일이 없어 repeat-arrow 사용                              |
| `Repeat1`             | —                    | iconsax · repeate-one (outline)                  | —                                                                               |
| `History`             | —                    | iconsax · timer (outline)                        | —                                                                               |
| `BookOpen`            | —                    | iconsax · book-open (outline)                    | —                                                                               |
| `Home`                | —                    | iconsax · home-2 (outline)                       | —                                                                               |
| `User`                | —                    | iconsax · user (outline)                         | —                                                                               |
| `Heart`               | —                    | iconsax · heart (outline + bold)                 | —                                                                               |
| `Star`                | —                    | iconsax · star (outline + bold)                  | —                                                                               |
| `ThumbsUp`            | —                    | iconsax · like (outline + bold)                  | —                                                                               |
| `ThumbsDown`          | —                    | iconsax · dislike (outline + bold)               | —                                                                               |
| `MapPin`              | —                    | iconsax · location (outline + bold)              | —                                                                               |
| `Navigation`          | —                    | iconsax · discover (outline)                     | —                                                                               |
| `Calendar`            | —                    | iconsax · calendar (outline)                     | —                                                                               |
| `CalendarDays`        | —                    | iconsax · calendar-date (outline)                | —                                                                               |
| `Clock`               | `ClockIcon`          | iconsax · clock (outline)                        | —                                                                               |
| `Camera`              | —                    | iconsax · camera (outline)                       | —                                                                               |
| `ImageIcon`           | —                    | iconsax · image (outline)                        | —                                                                               |
| `ImagePlus`           | —                    | iconsax · gallery-add (outline)                  | —                                                                               |
| `Tag`                 | —                    | iconsax · tag (outline)                          | —                                                                               |
| `Truck`               | —                    | iconsax · truck (outline)                        | —                                                                               |
| `PackageCheck`        | —                    | iconsax · box-tick (outline)                     | —                                                                               |
| `ShoppingBag`         | `ShoppingBagIcon`    | iconsax · shopping-bag (outline)                 | —                                                                               |
| `Wallet`              | —                    | iconsax · wallet (outline)                       | —                                                                               |
| `DollarSign`          | —                    | iconsax · dollar-circle (outline)                | —                                                                               |
| `BarChart3`           | —                    | iconsax · chart-2 (outline)                      | —                                                                               |
| `TrendingUp`          | —                    | iconsax · trend-up (outline)                     | —                                                                               |
| `Handshake`           | —                    | iconsax · arrow-swap-01 (outline)                | iconsax free에 악수 아이콘이 없음 — 직거래(교환) 맥락에 맞는 교환 화살표로 대체 |
| `Sparkles`            | —                    | iconsax · magic-star (outline)                   | —                                                                               |
| `Lightbulb`           | —                    | iconsax · lamp-on (outline)                      | —                                                                               |
| `Languages`           | —                    | iconsax · translate (outline)                    | —                                                                               |
| `Palette`             | —                    | iconsax · color-swatch (outline)                 | —                                                                               |
| `StickyNote`          | —                    | iconsax · stickynote (outline)                   | —                                                                               |
| `Quote`               | `QuoteUpIcon`        | iconsax · quote-up (outline)                     | —                                                                               |
| `Disc3`               | —                    | iconsax · cd (outline)                           | —                                                                               |
| `Mail`                | —                    | iconsax · sms (outline)                          | —                                                                               |
| `Phone`               | —                    | iconsax · call (outline)                         | —                                                                               |
| `MessageCircle`       | —                    | iconsax · message-circle (outline)               | —                                                                               |
| `MessageSquare`       | —                    | iconsax · message-square (outline)               | —                                                                               |
| `MessageSquareText`   | —                    | iconsax · message-text (outline)                 | —                                                                               |
| `MessageSquareX`      | —                    | iconsax · message-remove (outline)               | —                                                                               |
| `MessageSquareDashed` | —                    | iconsax · message-bubble (outline)               | 점선 말풍선이 없어 일반 말풍선으로 대체                                         |
| `MessagesSquare`      | —                    | iconsax · messages-2 (outline)                   | —                                                                               |
| `Play`                | —                    | iconsax · play (outline + bold)                  | —                                                                               |
| `Pause`               | —                    | iconsax · pause (outline + bold)                 | —                                                                               |
| `SkipForward`         | —                    | iconsax · next (outline + bold)                  | —                                                                               |
| `SkipBack`            | —                    | iconsax · previous (outline + bold)              | —                                                                               |
| `Volume2`             | —                    | iconsax · volume-high (outline)                  | —                                                                               |
| `VolumeX`             | —                    | iconsax · volume-slash (outline)                 | —                                                                               |
| `Bold`                | —                    | iconsax · text-bold (outline)                    | —                                                                               |
| `Italic`              | —                    | iconsax · text-italic (outline)                  | —                                                                               |
| `Underline`           | —                    | iconsax · text-underline (outline)               | —                                                                               |
| `Code`                | —                    | iconsax · code (outline)                         | —                                                                               |
| `Highlighter`         | —                    | iconsax · brush (outline)                        | —                                                                               |
| `LinkIcon`            | `Link`               | iconsax · link (outline)                         | —                                                                               |
| `Link2`               | —                    | iconsax · link-2 (outline)                       | —                                                                               |
| `List`                | —                    | iconsax · task (outline)                         | —                                                                               |
| `ListOrdered`         | —                    | iconsax · firstline (outline)                    | —                                                                               |
| `AlignLeft`           | —                    | iconsax · textalign-left (outline)               | —                                                                               |
| `AlignCenter`         | —                    | iconsax · textalign-center (outline)             | —                                                                               |
| `AlignRight`          | —                    | iconsax · textalign-right (outline)              | —                                                                               |
| `Book`                | `BookIcon`           | iconsax · book (outline)                         | —                                                                               |
| `Box`                 | `BoxIcon`            | iconsax · box (outline)                          | —                                                                               |
| `CardPos`             | `CardPosIcon`        | iconsax · card-pos (outline)                     | —                                                                               |
| `CopySuccess`         | `CopySuccessIcon`    | iconsax · copy-success (outline)                 | —                                                                               |
| `DocumentCopy`        | `DocumentCopyIcon`   | iconsax · document-copy (outline)                | —                                                                               |
| `QuoteUpCircle`       | `QuoteUpCircleIcon`  | iconsax · quote-up-circle (outline)              | —                                                                               |
| `TruckFast`           | `TruckFastIcon`      | iconsax · truck-fast (outline)                   | —                                                                               |
| `ShieldSecurity`      | `ShieldSecurityIcon` | iconsax · shield-security (outline)              | —                                                                               |
| `Loader2`             | `Loader2Icon`        | custom                                           | 스피너는 아이콘 팩에 없음 — 270° 호로 직접 그림 (animate-spin 전제)             |
| `Strikethrough`       | —                    | custom                                           | iconsax에 취소선이 없음 — text-underline의 글자꼴에 가운데 선을 그어 구성       |
| `Heading1`            | —                    | custom                                           | iconsax에 제목 단계 아이콘이 없음 — H 자형(면) + 숫자(선)로 직접 그림           |
| `Heading2`            | —                    | custom                                           | iconsax에 제목 단계 아이콘이 없음 — H 자형(면) + 숫자(선)로 직접 그림           |
| `Heading3`            | —                    | custom                                           | iconsax에 제목 단계 아이콘이 없음 — H 자형(면) + 숫자(선)로 직접 그림           |
