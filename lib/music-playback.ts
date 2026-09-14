/** Page-local ownership shared by footer audio and the optional Spotify frame. */
export const MUSIC_PLAYBACK_EVENT = "blog:music-playback";
export function claimMusicPlayback(owner: string): void {
  window.dispatchEvent(
    new CustomEvent(MUSIC_PLAYBACK_EVENT, { detail: owner }),
  );
}
