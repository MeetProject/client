'use client';

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '@/store/DeviceStore';
import { useShallow } from 'zustand/react/shallow';
import useDevice from '../useDevice';

interface UsePeerConnectionProps {
  onTrack: (targetId: string, stream: MediaStream) => void;
}

interface PeerConnectionData {
  pc: RTCPeerConnection;
  iceQueue: RTCIceCandidateInit[];
  remoteSet: boolean;
}

const usePeerConnection = ({ onTrack }: UsePeerConnectionProps) => {
  const peerConnections = useRef<Map<string, PeerConnectionData>>(new Map());

  const { stream } = useDevice();
  const { deviceEnable } = useDeviceStore(
    useShallow((state) => ({
      deviceEnable: state.deviceEnable,
    })),
  );

  const createPeerConnection = (
    targetId: string,
    onIceCandidate: (targetId: string, candidate: RTCIceCandidate) => void,
  ) => {
    if (peerConnections.current.has(targetId)) {
      return;
    }

    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    const data = {
      pc,
      iceQueue: [],
      remoteSet: false,
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(targetId, event.candidate);
      }
    };

    pc.ontrack = (event) => {
      console.log('연결 완료');
      const remoteStream = event.streams[0];
      const audilEl = document.createElement('audio');
      audilEl.srcObject = remoteStream;
      audilEl.autoplay = true;
      document.body.appendChild(audilEl);
      console.log(remoteStream);
      onTrack(targetId, remoteStream);
    };

    if (stream) {
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));
    }

    peerConnections.current.set(targetId, data);
  };

  const createOfferSdp = async (targetId: string): Promise<RTCSessionDescriptionInit> => {
    const peerConnection = peerConnections.current.get(targetId);

    if (!peerConnection) {
      return;
    }

    const offer = await peerConnection.pc.createOffer();
    return offer;
  };

  const createAnswerSdp = async (targetId: string): Promise<RTCSessionDescriptionInit> => {
    const peerConnection = peerConnections.current.get(targetId);

    if (!peerConnection) {
      return;
    }

    const answer = await peerConnection.pc.createAnswer();
    return answer;
  };

  const registerOfferSdp = async (targetId: string, sdp: RTCSessionDescriptionInit) => {
    const data = peerConnections.current.get(targetId);
    if (!data) throw new Error('해당 id의 peerConnection이 없음');

    await data.pc.setLocalDescription(sdp);
  };

  const registerAnswerSdp = async (targetId: string, targetSdp: RTCSessionDescriptionInit) => {
    const data = peerConnections.current.get(targetId);
    if (!data) throw new Error('해당 id의 peerConnection이 없음');

    await data.pc.setRemoteDescription(targetSdp);
    data.remoteSet = true;

    data.iceQueue.forEach(async (ice) => {
      await data.pc.addIceCandidate(new RTCIceCandidate(ice));
    });
    data.iceQueue = [];
  };

  const registerRemoteIce = async (targetId: string, targetIce: RTCIceCandidateInit) => {
    const data = peerConnections.current.get(targetId);
    if (!data) return;

    if (!data.remoteSet) {
      data.iceQueue.push(targetIce);
    } else {
      await data.pc.addIceCandidate(new RTCIceCandidate(targetIce));
    }
  };

  const disconnectPeerConection = (targetId: string) => {
    const data = peerConnections.current.get(targetId);
    if (!data) return;

    data.pc.getSenders().forEach((sender) => sender.track?.stop());
    data.pc.close();
    peerConnections.current.delete(targetId);
  };

  const disconnectAllPeerConnection = () => {
    peerConnections.current.forEach((data) => {
      data.pc.getSenders().forEach((sender) => sender.track?.stop());
      data.pc.close();
    });
    peerConnections.current.clear();
  };

  useEffect(() => {
    if (!stream || peerConnections.current.size === 0) return;

    peerConnections.current.forEach((data) => {
      data.pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video') {
          const newTrack = stream.getVideoTracks()[0];
          if (newTrack) sender.replaceTrack(newTrack);
        } else if (sender.track?.kind === 'audio') {
          const newTrack = stream.getAudioTracks()[0];
          if (newTrack) sender.replaceTrack(newTrack);
        }
      });
    });
  }, [stream]);

  useEffect(() => {
    if (peerConnections.current.size === 0) return;

    peerConnections.current.forEach((data) => {
      data.pc.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video') {
          sender.track.enabled = deviceEnable.video;
        } else if (sender.track?.kind === 'audio') {
          sender.track.enabled = deviceEnable.audio;
        }
      });
    });
  }, [deviceEnable]);

  return {
    createPeerConnection,
    createOfferSdp,
    createAnswerSdp,
    registerOfferSdp,
    registerAnswerSdp,
    registerRemoteIce,
    peerConnections,
    disconnectPeerConection,
    disconnectAllPeerConnection,
  };
};

export default usePeerConnection;
