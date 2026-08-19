import { NextResponse } from 'next/server';
import { prisma } from '../../../../../lib/prisma';
import { signToken } from '../../../../../lib/jwt';
import bcrypt from 'bcryptjs';

// GET /api/auth/callback/google?code=...
// Google redirige ici après que la personne a autorisé l'accès.
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const frontendUrl = process.env.FRONTEND_URL || 'https://safibudget-frontend.vercel.app';

  if (!code) {
    return NextResponse.redirect(`${frontendUrl}?auth_error=missing_code`);
  }

  try {
    // 1. Échanger le code contre un token Google
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.BACKEND_URL || 'https://safibudget-app.vercel.app'}/api/auth/callback/google`,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      console.error('Google token exchange failed', tokenData);
      return NextResponse.redirect(`${frontendUrl}?auth_error=token_exchange_failed`);
    }

    // 2. Récupérer les infos du profil Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();
    if (!profile.email) {
      return NextResponse.redirect(`${frontendUrl}?auth_error=no_email`);
    }

    // 3. Trouver ou créer l'utilisateur
    let user = await prisma.user.findUnique({ where: { email: profile.email } });
    if (!user) {
      const randomPassword = await bcrypt.hash(Math.random().toString(36) + Date.now(), 10);
      user = await prisma.user.create({
        data: {
          email: profile.email,
          nom: profile.name || profile.email.split('@')[0],
          passwordHash: randomPassword,
        },
      });
      await prisma.badge.create({
        data: { userId: user.id, nom: 'Premier pas', emoji: '👶', desc: 'Première connexion', obtenu: true },
      });
    }

    // 4. Émettre notre propre JWT et rediriger vers le front avec
    const token = signToken(user);
    return NextResponse.redirect(`${frontendUrl}?sb_token=${token}&sb_name=${encodeURIComponent(user.nom)}`);
  } catch (err) {
    console.error('Google OAuth error', err);
    return NextResponse.redirect(`${frontendUrl}?auth_error=server_error`);
  }
}
