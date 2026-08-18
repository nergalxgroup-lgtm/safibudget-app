import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';

// GET /api/state — reconstruit l'objet "state" attendu par le front (même forme que SafiDB.load())
export async function GET(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const [
    user, transactions, budgetDepenses, imprevus, depensesJournalieres,
    echeances, objectives, notifications, comptesLies, revenuHistorique,
    defisActifs, badges, coursProgression,
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
    prisma.defiActif.findMany({ where: { userId } }),
    prisma.badge.findMany({ where: { userId } }),
    prisma.coursProgression.findMany({ where: { userId } }),
  ]);

  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const communautePosts = await prisma.communautePost.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });

  const tontines = await prisma.tontine.findMany({
    where: { OR: [{ adminId: userId }, { participants: { some: { userId } } }] },
    include: { participants: true, payments: true, cycles: true },
  });

  return NextResponse.json({
    revenu: { montant: user.revenu, source: user.revenuSource },
    revenuHistorique, budgetDepenses, imprevus, depensesJournalieres,
    echeances, transactions, objectives, notifications, comptesLies,
    communautePosts, tontines,
    defisState: { points: user.points, actifs: defisActifs, badges },
    acadState: { coursProgression },
    preferences: {
      secteur: user.secteur,
      toleranceRisque: user.toleranceRisque,
      onboardingFait: user.onboardingFait,
    },
  });
}

// POST /api/state — sauvegarde complète (même logique que SafiDB.save() : on écrase avec l'état courant).
// Simple et fiable pour une app mono-utilisateur ; suffisant tant qu'un seul appareil édite à la fois.
export async function POST(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const body = await req.json();

  try {
    await prisma.$transaction(async (tx) => {
      if (Array.isArray(body.transactions)) {
        await tx.transaction.deleteMany({ where: { userId } });
        if (body.transactions.length) {
          await tx.transaction.createMany({
            data: body.transactions.map(t => ({
              userId, type: t.type, desc: t.desc, cat: t.cat,
              amount: t.amount, date: new Date(t.date),
            })),
          });
        }
      }

      if (Array.isArray(body.objectives)) {
        await tx.objective.deleteMany({ where: { userId } });
        if (body.objectives.length) {
          await tx.objective.createMany({
            data: body.objectives.map(o => ({
              userId, name: o.name, icon: o.icon || null,
              target: o.target, saved: o.saved || 0,
              date: new Date(o.date), color: o.color || null,
            })),
          });
        }
      }

      if (Array.isArray(body.budgetDepenses)) {
        await tx.budgetDepense.deleteMany({ where: { userId } });
        if (body.budgetDepenses.length) {
          await tx.budgetDepense.createMany({
            data: body.budgetDepenses.map(b => ({
              userId, nom: b.nom, montant: b.montant,
              raison: b.raison, date: new Date(b.date),
            })),
          });
        }
      }

      if (body.revenu) {
        await tx.user.update({
          where: { id: userId },
          data: { revenu: body.revenu.montant || 0, revenuSource: body.revenu.source || 'compte' },
        });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('State sync error', err);
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
