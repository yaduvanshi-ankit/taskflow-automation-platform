import { createAccessToken, verifyAccessToken } from './tokens.js';
describe('JWT utilities', () => {
  it('round-trips a typed access payload', () => {
    const source = { sub: 'user-1', role: 'user' as const, email: 'user@example.test' };
    expect(verifyAccessToken(createAccessToken(source))).toMatchObject(source);
  });
});
