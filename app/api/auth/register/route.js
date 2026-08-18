import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '../../../../lib/prisma';

export async function POST(req) {
  try {
    const { email, password, nom } = await req.json();

    if (!email || !password || !nom) {
      return NextResponse.json({ error: 'Champs manquants' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { email, passwordHash, nom },
    });

    // Badge de bienvenue, comme dans l'état initial SafiDB
    await prisma.badge.create({
      data: { userId: user.id, nom: 'Premier pas', emoji: '👶', desc: 'Première connexion', obtenu: true },
    });

    return NextResponse.json({ ok: true, userId: user.id });
  } catch (err) {
    console.error('Register error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
