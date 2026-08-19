import { NextResponse } from 'next/server';
import { getUserIdFromRequest } from '../../../lib/jwt';
import { prisma } from '../../../lib/prisma';

// GET /api/state — reconstruit l'objet "state" attendu par le front (même forme que SafiDB.load())
export async function GET(req) {
  const userId = getUserIdFromRequest(req);
  if (!userId) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });

  const [user, transactions, budgetDepenses, imprevus, depensesJournalieres,
    echeances, objectives, notifications, comptesLies, revenuHistorique] = await Promise.all([
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
  ]);

  if (!user) return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 });

  const communautePosts = await prisma.communautePost.findMany({ orderBy: { createdAt: 'desc' }, take: 50 });
  const tontines = user.tontinesData || [];

  return NextResponse.json({
    revenu: { montant: user.revenu, source: user.revenuSource },
    revenuHistorique, budgetDepenses, imprevus, depensesJournalieres,
    echeances, transactions, objectives, notifications, comptesLies,
    communautePosts,
    tontines,
    defis: user.defisData || {},
    defiPoints: user.defiPoints || 0,
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

      if (body.revenu || body.tontines !== undefined || body.defis !== undefined || body.defiPoints !== undefined) {
        await tx.user.update({
          where: { id: userId },
          data: {
            ...(body.revenu ? { revenu: body.revenu.montant || 0, revenuSource: body.revenu.source || 'compte' } : {}),
            ...(body.tontines !== undefined ? { tontinesData: body.tontines } : {}),
            ...(body.defis !== undefined ? { defisData: body.defis } : {}),
            ...(body.defiPoints !== undefined ? { defiPoints: body.defiPoints } : {}),
          },
        });
      }

      // Communauté : flux PARTAGÉ entre utilisateurs — on ajoute les nouveaux posts
      // (identifiés par absence d'id serveur) plutôt que d'écraser tout le flux.
      if (Array.isArray(body.communautePosts)) {
        const newPosts = body.communautePosts.filter(p => !p.id || typeof p.id !== 'string' || p.id.length < 20);
        if (newPosts.length) {
          await tx.communautePost.createMany({
            data: newPosts.map(p => ({
              userId, type: p.type || 'conseil', texte: p.texte,
              ville: p.ville || null, likes: p.likes || 0, comments: p.comments || 0,
            })),
          });
        }
      }

      if (Array.isArray(body.imprevus)) {
        await tx.imprevu.deleteMany({ where: { userId } });
        if (body.imprevus.length) {
          await tx.imprevu.createMany({
            data: body.imprevus.map(i => ({
              userId, nom: i.nom, montant: i.montant, date: new Date(i.date),
            })),
          });
        }
      }

      if (Array.isArray(body.depensesJournalieres)) {
        await tx.depenseJournaliere.deleteMany({ where: { userId } });
        if (body.depensesJournalieres.length) {
          await tx.depenseJournaliere.createMany({
            data: body.depensesJournalieres.map(d => ({
              userId, nom: d.nom, montant: d.montant, date: new Date(d.date),
            })),
          });
        }
      }

      if (Array.isArray(body.echeances)) {
        await tx.echeance.deleteMany({ where: { userId } });
        if (body.echeances.length) {
          await tx.echeance.createMany({
            data: body.echeances.map(e => ({
              userId, nom: e.nom, montant: e.montant, date: new Date(e.date),
              recurrence: e.recurrence || 'mensuel', icon: e.icon || null,
              bg: e.bg || null, color: e.color || null,
              paid: !!e.paid, paidDate: e.paidDate ? new Date(e.paidDate) : null,
            })),
          });
        }
      }

      if (Array.isArray(body.notifications)) {
        await tx.notification.deleteMany({ where: { userId } });
        if (body.notifications.length) {
          await tx.notification.createMany({
            data: body.notifications.map(n => ({
              userId, icon: n.icon || null, iconBg: n.iconBg || null,
              iconColor: n.iconColor || null, text: n.text,
              unread: n.unread !== false,
            })),
          });
        }
      }

      if (Array.isArray(body.comptesLies)) {
        await tx.compteLie.deleteMany({ where: { userId } });
        if (body.comptesLies.length) {
          await tx.compteLie.createMany({
            data: body.comptesLies.map(c => ({
              userId, nom: c.nom, banque: c.type || null, solde: c.solde || 0,
            })),
          });
        }
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('State sync error', err);
    return NextResponse.json({ ok: false, error: 'Erreur serveur' }, { status: 500 });
  }
}
