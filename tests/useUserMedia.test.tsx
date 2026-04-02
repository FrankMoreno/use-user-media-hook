/**
 * @vitest-environment jsdom
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useUserMedia } from '../src/useUserMedia';

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
const mockStop = vi.fn();
const mockAudioTrack = {
	enabled: true,
	stop: mockStop,
	kind: 'audio',
};
const mockVideoTrack = {
	enabled: true,
	stop: mockStop,
	kind: 'video',
};

const createMockStream = () => {
	const audioTrack = { ...mockAudioTrack };
	const videoTrack = { ...mockVideoTrack };
	return {
		getTracks: vi.fn(() => [audioTrack, videoTrack]),
		getAudioTracks: vi.fn(() => [audioTrack]),
		getVideoTracks: vi.fn(() => [videoTrack]),
	};
};

Object.defineProperty(navigator, 'mediaDevices', {
	value: {
		getUserMedia: mockGetUserMedia,
	},
	writable: true,
});

describe('useUserMedia', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockGetUserMedia.mockResolvedValue(createMockStream());
	});

	// afterEach(() => {
	// 	vi.clearAllMocks();
	// });

	describe('initialization', () => {
		it('should initialize with default state', () => {
			const { result } = renderHook(() => useUserMedia());

			expect(result.current.stream).toBeNull();
			expect(result.current.mediaAvailable).toBe(false);
			expect(result.current.isLoading).toBe(false);
			expect(result.current.error).toBeNull();
			expect(result.current.hasAudio).toBe(false);
			expect(result.current.hasVideo).toBe(false);
			expect(result.current.isAudioEnabled).toBe(false);
			expect(result.current.isVideoEnabled).toBe(false);
		});
	});

	describe('getUserMediaStream', () => {
		it('should successfully request user media with default constraints', async () => {
			const { result } = renderHook(() => useUserMedia());
			const expectedStream = createMockStream();
			mockGetUserMedia.mockResolvedValueOnce(expectedStream);

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			expect(mockGetUserMedia).toHaveBeenCalledWith({
				audio: true,
				video: { height: { ideal: 1080 }, width: { ideal: 1920 } },
			});
			expect(result.current.stream).toBe(expectedStream);
			expect(result.current.mediaAvailable).toBe(true);
		});

		it('should request user media with custom constraints', async () => {
			const { result } = renderHook(() => useUserMedia());
			const customConstraints = { audio: true, video: false };

			await act(async () => {
				await result.current.getUserMediaStream(customConstraints);
			});

			expect(mockGetUserMedia).toHaveBeenCalledWith(customConstraints);
		});

		it('should set loading state during request', async () => {
			const { result } = renderHook(() => useUserMedia());

			expect(result.current.isLoading).toBe(false);

			act(() => {
				result.current.getUserMediaStream();
			});

			expect(result.current.isLoading).toBe(true);

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			expect(result.current.isLoading).toBe(false);
		});

		it('should detect audio and video tracks', async () => {
			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			expect(result.current.hasAudio).toBe(true);
			expect(result.current.hasVideo).toBe(true);
		});

		it('should handle getUserMedia errors', async () => {
			const error = new Error('Permission denied');
			mockGetUserMedia.mockRejectedValueOnce(error);

			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			expect(result.current.error).toEqual(error);
			expect(result.current.mediaAvailable).toBe(false);
		});

		it('should handle non-Error exceptions', async () => {
			mockGetUserMedia.mockRejectedValueOnce('String error');

			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			expect(result.current.error?.message).toBe('String error');
		});

		it('should reject if browser does not support getUserMedia', async () => {
			const originalMediaDevices = navigator.mediaDevices;
			Object.defineProperty(navigator, 'mediaDevices', {
				value: undefined,
				writable: true,
			});

			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			expect(result.current.error?.message).toContain(
				'getUserMedia is not supported',
			);

			Object.defineProperty(navigator, 'mediaDevices', {
				value: originalMediaDevices,
				writable: true,
			});
		});

		it('should prevent concurrent requests', async () => {
			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				result.current.getUserMediaStream();
				await result.current.getUserMediaStream();
			});

			expect(result.current.error?.message).toContain('already in progress');
		});
	});

	describe('stopUserMediaStream', () => {
		it('should stop all media tracks', async () => {
			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			act(() => {
				result.current.stopUserMediaStream();
			});

			expect(mockStop).toHaveBeenCalled();
		});

		it('should clear stream state after stopping', async () => {
			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			expect(result.current.stream).not.toBeNull();

			act(() => {
				result.current.stopUserMediaStream();
			});

			expect(result.current.stream).toBeNull();
			expect(result.current.mediaAvailable).toBe(false);
		});
	});

	describe('setAudioState', () => {
		it('should enable audio tracks', async () => {
			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			act(() => {
				result.current.setAudioState(true);
			});

			expect(result.current.isAudioEnabled).toBe(true);
		});

		it('should disable audio tracks', async () => {
			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			act(() => {
				result.current.setAudioState(false);
			});

			expect(result.current.isAudioEnabled).toBe(false);
		});

		it('should not error when no stream is available', () => {
			const { result } = renderHook(() => useUserMedia());

			expect(() => {
				act(() => {
					result.current.setAudioState(true);
				});
			}).not.toThrow();
		});

		it('should not error when no audio tracks exist', async () => {
			mockGetUserMedia.mockResolvedValueOnce({
				getTracks: vi.fn(() => [mockVideoTrack]),
				getAudioTracks: vi.fn(() => []),
				getVideoTracks: vi.fn(() => [mockVideoTrack]),
			});

			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			expect(() => {
				act(() => {
					result.current.setAudioState(true);
				});
			}).not.toThrow();
		});
	});

	describe('setVideoState', () => {
		it('should enable video tracks', async () => {
			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			act(() => {
				result.current.setVideoState(true);
			});

			expect(result.current.isVideoEnabled).toBe(true);
		});

		it('should disable video tracks', async () => {
			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			act(() => {
				result.current.setVideoState(false);
			});

			expect(result.current.isVideoEnabled).toBe(false);
		});

		it('should not error when no stream is available', () => {
			const { result } = renderHook(() => useUserMedia());

			expect(() => {
				act(() => {
					result.current.setVideoState(true);
				});
			}).not.toThrow();
		});
	});

	describe('track state tracking', () => {
		it('should reflect correct audio enabled state', async () => {
			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			expect(result.current.isAudioEnabled).toBe(true);

			act(() => {
				result.current.setAudioState(false);
			});

			expect(result.current.isAudioEnabled).toBe(false);
		});

		it('should reflect correct video enabled state', async () => {
			const { result } = renderHook(() => useUserMedia());

			await act(async () => {
				await result.current.getUserMediaStream();
			});

			expect(result.current.isVideoEnabled).toBe(true);

			act(() => {
				result.current.setVideoState(false);
			});

			expect(result.current.isVideoEnabled).toBe(false);
		});
	});
});
