# use-user-media-hook

A React hook for accessing user audio and video devices via the MediaStream API.

[![CI](https://github.com/FrankMoreno/use-user-media-hook/actions/workflows/ci.yml/badge.svg)](https://github.com/FrankMoreno/use-user-media-hook/actions/workflows/ci.yml)
[![Release](https://github.com/FrankMoreno/use-user-media-hook/actions/workflows/release.yml/badge.svg)](https://github.com/FrankMoreno/use-user-media-hook/actions/workflows/release.yml)
[![npm version](https://badge.fury.io/js/use-user-media-hook.svg)](https://www.npmjs.com/package/use-user-media-hook)

## Installation

```bash
npm install use-user-media-hook
```

## Usage

```typescript
import { useUserMedia } from 'use-user-media-hook';

function VideoApp() {
  const {
    stream,
    mediaAvailable,
    isLoading,
    error,
    getUserMediaStream,
    stopUserMediaStream,
  } = useUserMedia();

  return (
    <div>
      <button onClick={() => getUserMediaStream({ audio: true, video: true })}>
        Start Stream
      </button>
      <button onClick={stopUserMediaStream}>Stop Stream</button>
      {error && <p>Error: {error.message}</p>}
      {isLoading && <p>Loading...</p>}
    </div>
  );
}
```

## API

### `useUserMedia(): UseUserMediaReturn`

Returns an object with the following properties:

- `stream: MediaStream | null` - The active media stream
- `mediaAvailable: boolean` - Whether media devices are available
- `isLoading: boolean` - Loading state while requesting permissions
- `error: Error | null` - Any errors that occurred
- `hasAudio: boolean` - Whether audio tracks are present
- `hasVideo: boolean` - Whether video tracks are present
- `isAudioEnabled: boolean` - Whether audio is currently enabled
- `isVideoEnabled: boolean` - Whether video is currently enabled
- `getUserMediaStream(constraints: MediaStreamConstraints): Promise<void>` - Request media stream
- `stopUserMediaStream(): void` - Stop and release the media stream
- `setAudioState(enabled: boolean): void` - Toggle audio tracks
- `setVideoState(enabled: boolean): void` - Toggle video tracks

## Development

### Build

```bash
npm run build
```

### Lint

```bash
npm run lint
npm run lint:fix
```

### Format

```bash
npm run format
```

## CI/CD

This project uses GitHub Actions for continuous integration and automated releases:

- **CI Workflow** (`.github/workflows/ci.yml`): Runs linting and builds on pull requests and pushes to `main` and `develop` branches
- **Release Workflow** (`.github/workflows/release.yml`): Automatically publishes releases to npm using semantic-release

### Setting up NPM publishing

1. Generate an npm token at https://www.npmjs.com/settings/~/tokens
2. Add it as a secret in your GitHub repository:
   - Go to Settings → Secrets and variables → Actions
   - Create a new secret named `NPM_TOKEN` with your npm token value

### Release Process

Releases are automatically managed by semantic-release based on commit messages:

- `feat:` - Minor version bump (features)
- `fix:` - Patch version bump (bug fixes)
- `BREAKING CHANGE:` - Major version bump

## License

ISC
