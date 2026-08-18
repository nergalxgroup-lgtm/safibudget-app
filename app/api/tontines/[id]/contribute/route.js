import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../../lib/auth';
import { prisma } from '../../../../../lib/prisma';

// POST /api/tontines/:id/contribute — méthode interne (solde SafiBudget)
// Portage direct de SafiDB.contribute(), mais en transaction Postgres
// pour éviter les doubles paiements en cas d'appels concurrents.
export async function POST(req, { params }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const tontineId = params.id;
  const { amount } = await req.json();
  const memberName = session.user.name;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const tontine = await tx.tontine.findUnique({ where: { id: tontineId } });
      if (!tontine) throw new Error('Tontine introuvable');

      const payment = await tx.tontinePayment.findUnique({
        where: {
          tontineId_memberName_cycleNum: {
            tontineId, memberName, cycleNum: tontine.currentTurn,
          },
        },
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

    // Le déclenchement du versement (disburse) se fait via un second appel
    // (ex. bouton "Débloquer le pot" ou un cron Vercel) plutôt qu'un setTimeout
    // côté client, pour rester fiable en environnement serverless.
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 400 });
  }
}
