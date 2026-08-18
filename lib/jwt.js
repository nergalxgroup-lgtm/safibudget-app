import jwt from 'jsonwebtoken';

const SECRET = process.env.NEXTAUTH_SECRET;

export function signToken(user) {
  return jwt.sign({ userId: user.id, email: user.email }, SECRET, { expiresIn: '30d' });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, SECRET);
  } catch {
    return null;
  }
}

// Lit le token depuis l'en-tête Authorization: Bearer xxx
export function getUserIdFromRequest(req) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload ? payload.userId : null;
}
