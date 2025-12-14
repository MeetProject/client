import { useWebRTCStore } from '@/store/WebRTCStore';

const getStream = (track: MediaStreamTrack, prevStream?: MediaStream) => {
	const mediaStream = new MediaStream();
	if (prevStream) {
		prevStream.getTracks().forEach((prevTrack) => {
			if (prevTrack.readyState === 'live') {
				mediaStream.addTrack(prevTrack);
			}
		});
	}
	mediaStream.addTrack(track);
	return mediaStream;
};

export const setUserStream = (userId: string, track: MediaStreamTrack) => {
	const { participantsMediaStream, updateParticipantsMediaStream } = useWebRTCStore.getState();
	if (participantsMediaStream.has(userId)) {
		updateParticipantsMediaStream(userId, getStream(track, participantsMediaStream.get(userId)));
		return;
	}

	updateParticipantsMediaStream(userId, getStream(track));
};

export const setScreenStream = (userId: string, track: MediaStreamTrack) => {
	const { screenSharingMediaStream, setScreenOwnerId, setScreenSharingMediaStream } = useWebRTCStore.getState();
	if (screenSharingMediaStream) {
		setScreenSharingMediaStream(getStream(track, screenSharingMediaStream));
		return;
	}

	setScreenOwnerId(userId);
	setScreenSharingMediaStream(getStream(track));
};
