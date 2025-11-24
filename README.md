# Meet Project

<p align="center">
  <img src='https://github.com/user-attachments/assets/7166b841-24e8-456c-8222-698226b00ed0'/>
</p>

#### 개발 기간: 2024.11.09 ~ </br>

## 프로젝트 소개
이 프로젝트는 Google Meet의 기능/레이아웃을 참고한 프로젝트입니다.<br>
다음과 같이 WebRTC를 mesh방식으로 구현하였습니다.<br>

- 시그널 서버와 웹소켓 통신
- 1:1 PeerConnection

본 프로젝트는 로컬에서만 실행가능하며, 별도의 db연겨이나 배포를 진행하지 않았습니다.

## 기존 구현 내용
기존 구현했던 내용들은 다음과 같습니다<br>
- 사용자가 사용 가능한 장치 정보 모두 불러오기
- 사용자가 선택한 장치로 입력/출력
- 세션 생성 및 참가/퇴장
- 화면 공유
- 채팅

## 구조
```scss
src/
 ├── hooks/
 │    ├── useWebRTC.ts           # WebRTC 연결 및 트랙 교환 로직
 │    ├── useSignalSocket.ts     # STOMP 연결/구독/메시지 처리
 │    ├── usePeerConnection.ts   # 1:1 peerConnection 관리
 │    ├── useDeviceUpdate.ts     # 장치 권한 및 MediaStream 관리
 │    └── ...
 ├── store/
 │    ├── useClientStore.ts    # STOMP 클라이언트 및 구독 상태
 │    ├── useWebRTCStore.ts    # 참가자 스트림, 화면 공유, 장치 상태
 │    └── useDeviceStore.ts    # 현재 사용자의 Media Device 상태
 └── app/
      └── [code]/
            └── meeting.tsx   # WebRTC 기반 미팅 화면
```

## 구현 목표
- STOMP(WebSocket)를 통한 Signal Server와의 실시간 통신
- WebRTC PeerConnection 생성 및 Offer/Answer/ICE 처리
- 참가자 스트림, 장치 상태, 화면 공유 상태의 중앙 관리
- 채팅, 손들기 등 실시간 UI 이벤트 처리
- 방 참가자 UI 렌더링 및 상태 동기화
  
## 주요 기능
### 연결 및 사용자 등록
- 클라이언트는 WebSocket 연결 이후 /app/register 요청을 보냄
- 서버는 사용자에게 고유 userId 발급 후 /user/queue/userId로 전달
- 클라이언트는 해당 ID를 기반으로 이후 모든 시그널 요청 처리

### 방 참가 및 사용자 목록 관리
- 특정 roomId로 입장
- 서버로부터 기존 참여자 정보 수신
- UI에 반영하여 참여자 목록 및 스트림 구성

### WebRTC Offer/Answer
- peerConnection을 생성하고 offer/answer 교환
- 클라이언트는 sdp 수신 후 peerConnection에 반영

### ICE Candidate 전달
- peerConnection의 ICE 후보를 생성하는 즉시 서버로 전달
- 양 클라이언트는 candidate를 peerConnection에 추가

### 장치 관리
- 마이크, 카메라 on/off 상태 관리
- 장치 변경 시 기존 트랙을 대체(replaceTrack)

### 화면 공유
- 별도의 /app/signal/screen 흐름을 통해 화면 공유자 새 ID 발급
- 화면 공유 스트림을 다른 참가자에게 Offer 형태로 전달
- 화면 공유자가 떠날 시 관련 스트림/상태 정리

### 채팅, 이모지 및 손들기
- /app/chat/{roomId}, /app/handUp 로 이벤트 전송
- 클라이언트는 store 업데이트 후 UI에 즉시 반영

## 실행 방법

```bash
# 클라이언트 디렉토리 이동
cd client

# 패키지 설치
npm install

# 개발 서버 실행
npm run dev
```
기본 설정에서는 http://localhost:3000에서 실행되며, Signal Server는 http://localhost:8080/ws로 연결됩니다.

## 구현 기능 목록
- [x] WebSocket 연결 및 userId 등록
  - [x] get api를 통한 사용자 등록 요청
  - [x] response로 받은 userId 전역 상태에 저장
  - [x] join, answer, offer, ice 구독
  - [x] client, subscription 전역 상태로 관리
- [x] 장치 스트림 관리
  - [x] 장치 업데이트 함수 구현
  - [x] 화면 공유 스트림 가져오는 함수 구현
  - [x] 장치 스트림 중지 함수 구현
  - [x] 화면 공유 중지 함수 구현
  - [x] 장치 상태 전역에 관리
- [x] 방 입장
  - [x] join 신호 전달
  - [x] offer 신호 전달
  - [x] answer 신호 전달
  - [x] ice 신호 전달
  - [x] 화면 공유 등록 신호 전달
  - [x] 참가자 정보 전역 상태로 관리
  - [x] 채팅, 손들기, 이모지, 장치 상태 신호 구독
- [x] peerConnection 생성
  - [x] 각 참가자에 대한 peerConnection 생성
  - [x] sdp 발급 함수 구현
  - [x] sdp 등록 함수 구현
  - [x] ice 등록 함수 구현
  - [x] ice 후보 핸들러 함수 구현
  - [x] 참가자 트랙 전역 상태 관리
  - [x] 장치 상태 변경에 따른 트랙 관리
- [x] 방 리액션 구현
  - [x] 채팅 신호 전달
  - [x] 이모지 신호 전달
  - [x] 손들기 신호 전달
  - [x] 장치 상태 변경 신호 전달
- [x] UI 반영
