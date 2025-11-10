'use client';

import { useEffect, useRef } from 'react';
import { useDeviceStore } from '@/store/DeviceStore';
import { useShallow } from 'zustand/react/shallow';
import useDevice from '../useDevice';

interface UsePeerConnectionProps {
  onTrack: (targetId: string, stream: MediaStream) => void;
}

const usePeerConnection = ({ onTrack }: UsePeerConnectionProps) => {
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());

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

    const peerConnection = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        onIceCandidate(targetId, event.candidate);
      }
    };

    peerConnection.ontrack = (event) => {
      const remoteStream = event.streams[0];
      onTrack(targetId, remoteStream);
    };

    if (stream) {
      stream.getTracks().forEach((track) => peerConnection.addTrack(track, stream));
    }

    peerConnections.current.set(targetId, peerConnection);
  };

  const createOfferSdp = async (targetId: string): Promise<RTCSessionDescriptionInit> => {
    const peerConnection = peerConnections.current.get(targetId);

    if (!peerConnection) {
      throw new Error('해당 id의 peerConnection이 없음');
    }

    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);

    return offer;
  };

  const registerRemoteSdp = async (targetId: string, targetSdp: RTCSessionDescription) => {
    const peerConnection = peerConnections.current.get(targetId);
    if (!peerConnection) {
      throw new Error('해당 id의 peerConnection이 없음');
    }

    await peerConnection.setRemoteDescription(targetSdp);
  };

  const registerRemoteIce = async (targetId: string, targetIce: RTCLocalIceCandidateInit) => {
    const peerConnection = peerConnections.current.get(targetId);

    if (!peerConnection) {
      throw new Error('해당 id의 peerConnection이 없음');
    }

    await peerConnection.addIceCandidate(new RTCIceCandidate(targetIce));
  };

  const disconnectPeerConection = (targetId: string) => {
    const peerConnection = peerConnections.current.get(targetId);
    peerConnection?.getSenders().forEach((sender) => sender.track?.stop());
    peerConnection?.close();

    peerConnections.current.delete(targetId);
  };

  const disconnectAllPeerConnection = () => {
    peerConnections.current.forEach((peerConnection) => {
      peerConnection.getSenders().forEach((sender) => sender.track?.stop());
      peerConnection.close();
    });
    peerConnections.current.clear();
  };

  useEffect(() => {
    if (!stream || peerConnections.current.size === 0) {
      return;
    }

    peerConnections.current.forEach((peerConnection) => {
      peerConnection.getSenders().forEach((sender) => {
        if (sender.track?.kind === 'video') {
          const newTrack = stream.getVideoTracks()[0];
          if (newTrack) {
            sender.replaceTrack(newTrack);
          }
        } else if (sender.track?.kind === 'audio') {
          const newTrack = stream.getAudioTracks()[0];
          if (newTrack) {
            sender.replaceTrack(newTrack);
          }
        }
      });
    });
  }, [stream]);

  useEffect(() => {
    if (peerConnections.current.size === 0) {
      return;
    }

    peerConnections.current.forEach((pc) => {
      pc.getSenders().forEach((sender) => {
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
    registerRemoteSdp,
    registerRemoteIce,
    peerConnections,
    disconnectPeerConection,
    disconnectAllPeerConnection,
  };
};

export default usePeerConnection;
