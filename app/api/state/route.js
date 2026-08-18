import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

// GET /api/state — reconstruit l'objet "state" attendu par le front (même forme que SafiDB.load())
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const userId = session.user.id;

  const [
    user, transactions, budgetDepenses, imprevus, depensesJournalieres,
    echeances, objectives, notifications, comptesLies, revenuHistorique,
    communautePosts, defisActifs, badges, coursProgression,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.transaction.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.budgetDepense.findMany({ where: { userId, supprime: false } }),
    prisma.imprevu.findMany({ where: { userId, supprime: false } }),
    prisma.depenseJournaliere.findMany({ where: { userId, supprime: false } }),
    prisma.echeance.findMany({ where: { userId } }),
    prisma.objective.findMany({ where: { userId } }),
    prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    prisma.compteLie.findMany({ where: { userId } }),
    prisma.revenuHistorique.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    prisma.communautePost.findMany({ orderBy: { createdAt: 'desc' }, take: 50 }),
    prisma.defiActif.findMany({ where: { userId } }),
    prisma.badge.findMany({ where: { userId } }),
    prisma.coursProgression.findMany({ where: { userId } }),
  ]);

  // Tontines où l'utilisateur est admin OU participant
  const tontines = await prisma.tontine.findMany({
    where: {
      OR: [{ adminId: userId }, { participants: { some: { userId } } }],
    },
    include: { participants: true, payments: true, cycles: true },
  });

  return NextResponse.json({
    revenu: { montant: user.revenu, source: user.revenuSource },
    revenuHistorique,
    budgetDepenses,
    imprevus,
    depensesJournalieres,
    echeances,
    transactions,
    objectives,
    notifications,
    comptesLies,
    communautePosts,
    tontines,
    defisState: { points: user.points, actifs: defisActifs, badges },
    acadState: { coursProgression },
    preferences: {
      secteur: user.secteur,
      toleranceRisque: user.toleranceRisque,
      onboardingFait: user.onboardingFait,
    },
  });
}

// PUT /api/state — sauvegarde partielle : reçoit { collection, action, payload }
// (on évite d'écraser toute la base à chaque frappe ; chaque écran appelle ce endpoint
//  avec juste ce qu'il vient de modifier — voir README pour le détail par collection)
export async function PUT(req) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  const userId = session.user.id;

  const { collection, action, payload } = await req.json();

  try {
    switch (collection) {
      case 'transaction':
        if (action === 'create') {
          const tx = await prisma.transaction.create({ data: { ...payload, userId } });
          return NextResponse.json({ ok: true, item: tx });
        }
        if (action === 'delete') {
          await prisma.transaction.delete({ where: { id: payload.id } });
          return NextResponse.json({ ok: true });
        }
        break;

      case 'objective':
        if (action === 'create') {
          const obj = await prisma.objective.create({ data: { ...payload, userId } });
          return NextResponse.json({ ok: true, item: obj });
        }
        if (action === 'update') {
          const obj = await prisma.objective.update({ where: { id: payload.id }, data: payload });
          return NextResponse.json({ ok: true, item: obj });
        }
        break;

      case 'budgetDepense':
        if (action === 'create') {
          const bd = await prisma.budgetDepense.create({ data: { ...payload, userId } });
          return NextResponse.json({ ok: true, item: bd });
        }
        if (action === 'delete') {
          await prisma.budgetDepense.update({ where: { id: payload.id }, data: { supprime: true } });
          return NextResponse.json({ ok: true });
        }
        break;

      // Ajouter les autres collections (imprevus, echeances, notifications, comptesLies...)
      // en suivant le même schéma create/update/delete au fur et à mesure de la migration.

      default:
        return NextResponse.json({ error: 'Collection inconnue: ' + collection }, { status: 400 });
    }
    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });
  } catch (err) {
    console.error('State save error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
