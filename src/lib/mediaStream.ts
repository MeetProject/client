import { useWebRTCStore } from '@/store/WebRTCStore';

const getStream = (track?: MediaStreamTrack, prevStream?: MediaStream) => {
	const mediaStream = new MediaStream();
	if (prevStream) {
		prevStream.getTracks().forEach((prevTrack) => {
			if (prevTrack.readyState === 'live') {
				mediaStream.addTrack(prevTrack);
			}
		});
	}

	if (track) {
		mediaStream.addTrack(track);
	}
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

export const deleteUserTrack = (userId: string, track: MediaStreamTrack) => {
	const { deleteParticipantsMediaStream, participantsMediaStream, updateParticipantsMediaStream } =
		useWebRTCStore.getState();
	if (!participantsMediaStream.has(userId)) {
		return;
	}

	const stream = participantsMediaStream.get(userId);
	stream.removeTrack(track);

	if (stream.getTracks().length === 0) {
		deleteParticipantsMediaStream(userId);
		return;
	}

	updateParticipantsMediaStream(userId, stream);
};

export const deleteScreenTrack = (track: MediaStreamTrack) => {
	const { screenSharingMediaStream, setScreenOwnerId, setScreenSharingMediaStream } = useWebRTCStore.getState();

	if (!screenSharingMediaStream) {
		return;
	}

	screenSharingMediaStream.removeTrack(track);
	if (screenSharingMediaStream.getTracks.length === 0) {
		setScreenSharingMediaStream(null);
		setScreenOwnerId(null);
		return;
	}
	setScreenSharingMediaStream(getStream(null, screenSharingMediaStream));
};
