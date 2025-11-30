export const checkBrowser = () => {
	const { userAgent } = navigator;
	const allowedBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge', 'Opera'];
	return allowedBrowsers.some((browser) => userAgent.includes(browser));
};

export const checkPermissionOnchange = async (name: PermissionName) => {
	const status = await navigator.permissions.query({ name });

	if ('onChange' in status) {
		return true;
	}

	return false;
};

export const checkFrame = async (video: HTMLVideoElement, onEnded: () => Promise<void> | void) => {
	if (video.videoWidth === 0 || video.videoHeight === 0) {
		await onEnded();
	}
	video.requestVideoFrameCallback(() => checkFrame(video, onEnded));
};
