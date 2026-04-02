import { useCallback, useRef, useState } from 'react';

interface UseUserMediaReturn {
	stream: MediaStream | null;
	mediaAvailable: boolean;
	isLoading: boolean;
	error: Error | null;

	hasAudio: boolean;
	hasVideo: boolean;

	isAudioEnabled: boolean;
	isVideoEnabled: boolean;

	getUserMediaStream: (constraints: MediaStreamConstraints) => Promise<void>;
	stopUserMediaStream: () => void;
	setAudioState: (enabled: boolean) => void;
	setVideoState: (enabled: boolean) => void;
}

const defaultConstraints: MediaStreamConstraints = {
	audio: true,
	video: {
		height: { ideal: 1080 },
		width: { ideal: 1920 },
	},
};

export function useUserMedia(): UseUserMediaReturn {
	const localStream = useRef<MediaStream | null>(null);
	const isMountedRef = useRef(true);
	const isLoadingRef = useRef(false);

	const [stream, setStream] = useState<MediaStream | null>(null);
	const [mediaAvailable, setMediaAvailable] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const [hasAudio, setHasAudio] = useState(false);
	const [hasVideo, setHasVideo] = useState(false);
	const [isAudioEnabled, setIsAudioEnabled] = useState(false);
	const [isVideoEnabled, setIsVideoEnabled] = useState(false);

	const setAudioState = useCallback(
		(enabled: boolean): void => {
			if (!localStream.current || !hasAudio) {
				return;
			}

			localStream.current?.getAudioTracks().forEach((track) => {
				track.enabled = enabled;
			});
			setIsAudioEnabled(enabled);
		},
		[hasAudio],
	);

	const setVideoState = useCallback(
		(enabled: boolean): void => {
			if (!localStream.current || !hasVideo) {
				return;
			}

			localStream.current?.getVideoTracks().forEach((track) => {
				track.enabled = enabled;
			});
			setIsVideoEnabled(enabled);
		},
		[hasVideo],
	);

	const stopUserMediaStream = useCallback((): void => {
		localStream.current?.getTracks().forEach((track) => {
			track.stop();
		});
		localStream.current = null;

		if (isMountedRef.current) {
			return;
		}

		setStream(null);
		setMediaAvailable(false);
		setHasAudio(false);
		setHasVideo(false);
		setIsAudioEnabled(false);
		setIsVideoEnabled(false);
	}, []);

	const getUserMediaStream = useCallback(
		async (
			constraints: MediaStreamConstraints = defaultConstraints,
		): Promise<void> => {
			if (!isUserMediaSupported()) {
				setError(new Error('getUserMedia is not supported in this browser.'));
				return;
			}

			if (isLoadingRef.current) {
				setError(new Error('Media stream request is already in progress.'));
				return;
			}

			stopUserMediaStream();
			setError(null);
			isLoadingRef.current = true;
			setIsLoading(true);

			let stream: MediaStream | null = null;

			try {
				stream = await navigator.mediaDevices.getUserMedia(constraints);
			} catch (err) {
				const error = err instanceof Error ? err : new Error(String(err));
				isLoadingRef.current = false;
				setIsLoading(false);
				setError(error);
				return;
			}

			if (!isMountedRef.current) {
				stream.getTracks().forEach((track) => {
					track.stop();
				});
				isLoadingRef.current = false;
				return;
			}

			const audioTracks = stream.getAudioTracks();
			const videoTracks = stream.getVideoTracks();
			const newHasAudio = audioTracks.length > 0;
			const newHasVideo = videoTracks.length > 0;

			localStream.current = stream;
			isLoadingRef.current = false;
			setIsLoading(false);
			setStream(stream);
			setHasAudio(newHasAudio);
			setHasVideo(newHasVideo);
			setIsAudioEnabled(
				newHasAudio && audioTracks.every((track) => track.enabled),
			);
			setIsVideoEnabled(
				newHasVideo && videoTracks.every((track) => track.enabled),
			);
			setMediaAvailable(true);
		},
		[stopUserMediaStream],
	);

	return {
		mediaAvailable,
		isLoading,
		hasAudio,
		hasVideo,
		isAudioEnabled,
		isVideoEnabled,
		error,
		stream,
		getUserMediaStream,
		stopUserMediaStream,
		setAudioState,
		setVideoState,
	};
}

function isUserMediaSupported(): boolean {
	if (
		typeof navigator === 'undefined' ||
		!navigator.mediaDevices?.getUserMedia
	) {
		return false;
	}

	return true;
}
