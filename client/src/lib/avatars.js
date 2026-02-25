export const AVATARS = ['😀','😎','🤠','🥳','😺','🦊','🐸','🦁','🐨','🐷','🐵','🦄','👻','🤖','👽','🎃'];

export function randomAvatar() {
  return AVATARS[Math.floor(Math.random() * AVATARS.length)];
}
