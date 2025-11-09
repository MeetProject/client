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

## 구현 목표
- 시그널 서버와 웹 소켓 통신
  - join, offer, answer, ice 통신
  - chat, reaction 통신(broadcast)
  
- 기존 openvidu대신, WebRTC mesh 방식으로 직접 구현
  - sdp정보 가져오기
  - asnwer에 대한 PeerConnection
  
