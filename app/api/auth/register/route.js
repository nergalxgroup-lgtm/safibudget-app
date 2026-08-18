import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';

export async function POST(req) {
  try {
    const body = await req.json();
    const { first_name, last_name, email, password, revenu_mensuel } = body;

    if (!first_name || !last_name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Champs manquants' }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ success: false, error: 'Mot de passe trop court (min. 8 caractères)' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ success: false, error: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const nom = `${first_name} ${last_name}`.trim();

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        nom,
        revenu: revenu_mensuel ? parseFloat(revenu_mensuel) : 0,
      },
    });

    await prisma.badge.create({
      data: { userId: user.id, nom: 'Premier pas', emoji: '👶', desc: 'Première connexion', obtenu: true },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Register error', err);
    return NextResponse.json({ success: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
