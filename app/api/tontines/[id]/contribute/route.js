import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../../../lib/jwt';
import { prisma } from '../../../../../lib/prisma';

// POST /api/tontines/:id/contribute — méthode interne (solde SafiBudget), en transaction
// pour éviter les doubles paiements en cas d'appels concurrents entre plusieurs membres.
export async function POST(req, { params }) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const user = await prisma.user.findUnique({ where: { id: userId } });
  const tontineId = params.id;
  const { amount } = await req.json();
  const memberName = user.nom;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tontine = await tx.tontine.findUnique({ where: { id: tontineId } });
      if (!tontine) throw new Error('Tontine introuvable');

      const payment = await tx.tontinePayment.findUnique({
        where: { tontineId_memberName_cycleNum: { tontineId, memberName, cycleNum: tontine.currentTurn } },
      });
      if (!payment) throw new Error('Membre introuvable pour ce cycle');
      if (payment.status === 'paid' || payment.status === 'proof_uploaded') {
        throw new Error('Déjà payé ce cycle');
      }

      await tx.tontinePayment.update({
        where: { id: payment.id },
        data: { status: 'paid', amount, date: new Date(), method: 'wallet' },
      });

      const newWallet = tontine.walletBalance + amount;
      const remaining = await tx.tontinePayment.count({
        where: { tontineId, cycleNum: tontine.currentTurn, status: { not: 'paid' } },
      });
      const allPaid = remaining === 0;

      await tx.tontine.update({
        where: { id: tontineId },
        data: { walletBalance: newWallet, status: allPaid ? 'ready' : tontine.status },
      });

      return { walletBalance: newWallet, allPaid };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
