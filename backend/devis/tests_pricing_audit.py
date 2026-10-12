"""
Audit des calculs de devis — fichier de tests SÉPARÉ, aucun code applicatif modifié.

Convention : chaque test affirme le comportement ATTENDU (spec de l'audit).
Un test qui échoue = écart constaté, avec la valeur réelle dans le message.
Les tests marqués "caractérisation" documentent un comportement réel et passent.

Lancer :  python manage.py test devis.tests_pricing_audit -v 2
(utilise une base de test jetable, jamais la vraie base)
"""
from decimal import Decimal
from unittest import mock

from django.contrib import admin as dj_admin
from django.contrib.auth.models import User
from django.test import TransactionTestCase
from rest_framework.test import APIClient

from devis.models import Client, Devis, LigneDevis, ParametresTarification, TarifProfil
from devis.services import ia as ia_module
from devis.services import pdf as pdf_module
from devis.services.pricing import (
    DEFAULT_TJM, MARGE_DEFAUT, appliquer_marge_cout_reel, calculer_prix_ligne,
    recalculer_tarifs_profils,
)
from equipe.models import Employe
from equipe.serializers import EmployeSerializer

D = Decimal

# ---- Paramètres de la spec de l'audit ----
SPEC_CHARGES, SPEC_UTIL, SPEC_MARGE = D('0.25'), D('0.75'), D('0.20')


def spec_tjm(salaires):
    """(salaire/21) x (1+charges) / utilisation x (1+marge), moyenné par profil."""
    vals = [(D(s) / 21) * (1 + SPEC_CHARGES) / SPEC_UTIL * (1 + SPEC_MARGE) for s in salaires]
    return sum(vals) / len(vals)


def cout_reel_par_jour_facturable(salaires):
    """Coût réel d'un jour VENDU (sans aucune marge)."""
    vals = [(D(s) / 21) * (1 + SPEC_CHARGES) / SPEC_UTIL for s in salaires]
    return sum(vals) / len(vals)


def choices_patch():
    """L'attribut Employe.PROFIL_CHOICES n'existe pas (voir test_q1_signal...).
    On le simule pour pouvoir isoler la FORMULE du TJM des autres bugs."""
    return mock.patch.object(
        Employe, 'PROFIL_CHOICES',
        [('junior', 'Junior'), ('senior', 'Senior'), ('chef_de_projet', 'Chef de projet')],
        create=True,
    )


def pdf_context(devis):
    """Rend le template du PDF et renvoie le contexte (montants HT/TVA/TTC)."""
    captured = {}
    real = pdf_module.render_to_string

    def spy(template, context):
        captured.update(context)
        return real(template, context)

    with mock.patch.object(pdf_module, 'render_to_string', side_effect=spy), \
         mock.patch.object(pdf_module, 'HTML'):
        pdf_module.generer_pdf_devis(devis)
    return captured


class AuditBase(TransactionTestCase):
    # TransactionTestCase = vrais commits (autocommit), comme en production :
    # indispensable pour observer la perte de lignes quand une vue plante.
    def setUp(self):
        self.user = User.objects.create_user('audit', password='x')
        self.api = APIClient(raise_request_exception=False)
        self.api.force_authenticate(self.user)
        self.client_obj = Client.objects.create(nom='Test', email='t@example.com', telephone='123')

    def devis(self, mode='estimation_ia', prix=(), **kw):
        d = Devis.objects.create(client=self.client_obj, besoins_client='x', mode_tarification=mode, **kw)
        for i, p in enumerate(prix):
            LigneDevis.objects.create(devis=d, description=f'L{i}', prix_unitaire=D(str(p)))
        return d

    def valider(self, d):
        with mock.patch('devis.views.envoyer_devis_par_email') as m:
            r = self.api.post(f'/api/devis/{d.id}/valider/')
        return r, m

    def generer(self, d, ia_result):
        with mock.patch('devis.views.generer_devis_ia', return_value=ia_result):
            return self.api.post(f'/api/devis/{d.id}/generer_ia/')


def ia_ligne(**over):
    base = {'description': 'Lot A', 'profil_requis': 'senior', 'nombre_personnes': 1,
            'jours_estimes': 5, 'complexite': 'moyenne'}
    base.update(over)
    return base


# =====================================================================
# Q1 — MODE 1 (estimation_ia) : TJM et prix de ligne
# =====================================================================
class Q1Mode1(AuditBase):

    def test_spec_reference_value_is_about_295(self):
        # contrôle de la spec elle-même (caractérisation)
        self.assertAlmostEqual(float(spec_tjm([3000, 3200])), 295.2, delta=0.5)

    def test_q1_tjm_from_salaries_matches_spec(self):
        Employe.objects.bulk_create([
            Employe(nom='A', prenom='a', poste='dev', profil='senior', salaire=D('3000')),
            Employe(nom='B', prenom='b', poste='dev', profil='senior', salaire=D('3200')),
        ])
        ParametresTarification.objects.create(charge_patronale=SPEC_CHARGES, taux_utilisation=SPEC_UTIL,
                                              marge_beneficiaire=SPEC_MARGE)
        with choices_patch():
            recalculer_tarifs_profils()
        tjm = TarifProfil.objects.get(profil='senior').tjm
        self.assertAlmostEqual(float(tjm), 295, delta=1, msg=f'TJM senior obtenu = {tjm} (attendu ~295)')

    def test_q1_parametres_tarification_is_ignored_by_tjm(self):
        Employe.objects.bulk_create([Employe(nom='A', prenom='a', poste='dev', profil='senior', salaire=D('3000'))])
        p = ParametresTarification.objects.create()
        with choices_patch():
            recalculer_tarifs_profils()
            t1 = TarifProfil.objects.get(profil='senior').tjm
            p.charge_patronale, p.taux_utilisation = D('0.50'), D('0.50')
            p.save()
            recalculer_tarifs_profils()
            t2 = TarifProfil.objects.get(profil='senior').tjm
        self.assertNotEqual(t1, t2, f'TJM identique ({t1}) malgré charges 25%->50% et utilisation 75%->50%')

    def test_q1_tjm_covers_real_cost_per_billable_day(self):
        sal = [3000, 3200]
        Employe.objects.bulk_create([Employe(nom=f'E{s}', prenom='x', poste='dev', profil='senior', salaire=D(s)) for s in sal])
        with choices_patch():
            recalculer_tarifs_profils()
        tjm = TarifProfil.objects.get(profil='senior').tjm
        cout = cout_reel_par_jour_facturable(sal)
        self.assertGreaterEqual(tjm, cout, f'TJM {tjm} < coût réel par jour vendu {cout:.2f} -> vente à perte (complexité simple)')

    def test_q1_real_data_profil_case_mismatch(self):
        # La vraie base contient 'Junior'/'Senior' (majuscule) ; le code filtre en minuscule.
        Employe.objects.bulk_create([Employe(nom='A', prenom='a', poste='dev', profil='Senior', salaire=D('3000'))])
        with choices_patch():
            recalculer_tarifs_profils()
        tjm = TarifProfil.objects.get(profil='senior').tjm
        self.assertNotEqual(tjm, DEFAULT_TJM['senior'],
                            f"TJM senior = {tjm} = valeur par défaut : le salaire d'un employé 'Senior' est ignoré")

    def test_q1_signal_does_not_crash_on_employee_save(self):
        has_attr = hasattr(Employe, 'PROFIL_CHOICES')
        try:
            Employe.objects.create(nom='A', prenom='a', poste='dev', profil='senior', salaire=D('3000'))
        except Exception as e:  # noqa: BLE001
            self.fail(f"hasattr(Employe,'PROFIL_CHOICES')={has_attr} ; sauvegarde employé -> {type(e).__name__}: {e} "
                      f"(ligne insérée malgré l'erreur: {Employe.objects.count()})")

    def test_q1_api_create_employee_returns_201(self):
        r = self.api.post('/api/equipe/', {'nom': 'A', 'prenom': 'a', 'poste': 'dev',
                                           'profil': 'senior', 'salaire': '3000'}, format='json')
        self.assertEqual(r.status_code, 201, f'POST /api/equipe/ -> {r.status_code}')

    def test_q1_employee_form_value_accepted_by_serializer(self):
        # le formulaire admin envoie 'Junior' / 'Senior' / 'Chef de projet'
        s = EmployeSerializer(data={'nom': 'A', 'prenom': 'a', 'poste': 'dev', 'profil': 'Senior', 'salaire': '3000'})
        self.assertTrue(s.is_valid(), f'profil "Senior" rejeté par le serializer : {s.errors}')

    def test_q1_price_chain_arithmetic(self):
        TarifProfil.objects.create(profil='senior', tjm=D('295'), tjm_manuel=True)
        self.assertEqual(calculer_prix_ligne('senior', D('10'), 1, 'simple'), D('2950'))
        self.assertEqual(calculer_prix_ligne('senior', D('10'), 1, 'moyenne'), D('3390'))    # 3392.5 -> 3390
        self.assertEqual(calculer_prix_ligne('senior', D('10'), 1, 'complexe'), D('3980'))   # 3982.5 -> 3980
        self.assertEqual(calculer_prix_ligne('senior', D('10'), 2, 'simple'), D('5900'))

    def test_q1_rounding_is_half_up_consistently(self):
        TarifProfil.objects.create(profil='senior', tjm=D('25'), tjm_manuel=True)
        p25 = calculer_prix_ligne('senior', D('1'), 1, 'simple')     # 25 -> 20 ou 30 ?
        TarifProfil.objects.filter(profil='senior').update(tjm=D('35'))
        p35 = calculer_prix_ligne('senior', D('1'), 1, 'simple')     # 35 -> 40
        self.assertEqual((p25, p35), (D('30'), D('40')), f'25 -> {p25}, 35 -> {p35} (arrondi bancaire : 2.5->2, 3.5->4)')

    def test_q1_small_task_is_not_priced_at_zero(self):
        TarifProfil.objects.create(profil='junior', tjm=D('40'), tjm_manuel=True)
        p = calculer_prix_ligne('junior', D('0.1'), 1, 'simple')
        self.assertGreater(p, 0, f'0.1 jour x TJM 40 = 4 TND arrondi à {p}')

    def test_q1_manual_edit_reprices_line(self):
        d = self.devis(prix=())
        r = self.api.patch(f'/api/devis/{d.id}/', {'lignes': [{
            'description': 'x', 'quantite': 1, 'prix_unitaire': '200.00', 'profil': 'junior',
            'jours_estimes': '100.0', 'nombre_personnes': 1, 'complexite': 'simple'}]}, format='json')
        prix = LigneDevis.objects.get(devis=d).prix_unitaire
        self.assertEqual(r.status_code, 200)
        self.assertEqual(prix, calculer_prix_ligne('junior', D('100'), 1, 'simple'),
                         f'jours passés de 1 à 100 mais prix inchangé = {prix} : profil/jours/complexité ne repricent rien')


# =====================================================================
# Q1 — MODE 2 (cout_reel) + TVA
# =====================================================================
class Q1Mode2(AuditBase):

    def test_q1_mode2_default_margin_is_20pct(self):
        got = appliquer_marge_cout_reel(D('6500'))
        self.assertEqual(got, D('7800.00'), f'6500 -> {got} (marge par défaut du code = 30%, spec = 20%)')

    def test_q1_mode2_with_explicit_20pct_parameter_works(self):
        ParametresTarification.objects.create(marge_beneficiaire=D('0.20'))
        self.assertEqual(appliquer_marge_cout_reel(D('6500')), D('7800.00'))

    def test_q1_vat_19pct_on_7800_is_1482_and_ttc_9282(self):
        d = self.devis(prix=(7800,), estimation_montant=D('7800'))
        ctx = pdf_context(d)
        self.assertEqual((ctx['tva_montant'], ctx['total_ttc']), (D('1482.00'), D('9282.00')))

    def test_q1_end_to_end_cost_6500_gives_ttc_9282(self):
        d = self.devis(mode='cout_reel')
        self.api.patch(f'/api/devis/{d.id}/', {'cout_reel': '6500'}, format='json')
        d.refresh_from_db()
        ctx = pdf_context(d)
        self.assertEqual(ctx['total_ttc'], D('9282.00'),
                         f"cout 6500 -> HT {d.estimation_montant} -> TVA {ctx['tva_montant']} -> TTC {ctx['total_ttc']}")


# =====================================================================
# Q2 — validation / envoi avec montants incohérents
# =====================================================================
class Q2Validation(AuditBase):

    def test_q2_blocks_zero_priced_lines_mode1(self):                       # caractérisation (garde présente)
        d = self.devis(prix=(0, 100), estimation_montant=D('100'))
        r, _ = self.valider(d)
        self.assertEqual(r.status_code, 400)

    def test_q2_blocks_mode2_without_cost(self):                            # caractérisation (garde présente)
        d = self.devis(mode='cout_reel', prix=(0, 0))
        r, _ = self.valider(d)
        self.assertEqual(r.status_code, 400)

    def test_q2_blocks_when_lines_do_not_sum_to_total(self):
        d = self.devis(prix=(100, 100), estimation_montant=D('5000'))
        r, mail = self.valider(d)
        self.assertEqual(r.status_code, 400, f'validé et envoyé (mail appelé={mail.called}) : lignes=200, total=5000')

    def test_q2_blocks_mode1_with_null_estimation(self):
        d = self.devis(prix=(100, 100), estimation_montant=None)
        r, mail = self.valider(d)
        self.assertEqual(r.status_code, 400, f'validé avec estimation_montant=None (mail appelé={mail.called})')

    def test_q2_pdf_subtotal_equals_sum_of_lines(self):
        d = self.devis(prix=(100, 100), estimation_montant=D('5000'))
        ctx = pdf_context(d)
        somme = sum(l['total'] for l in ctx['lignes_affichage'])
        self.assertEqual(somme, ctx['estimation_affichage'], f"PDF: lignes = {somme}, sous-total HT = {ctx['estimation_affichage']}")

    def test_q2_sent_devis_is_locked_against_api_edits(self):
        d = self.devis(prix=(100,), estimation_montant=D('100'), statut='envoye')
        r = self.api.patch(f'/api/devis/{d.id}/', {'estimation_montant': '1.00'}, format='json')
        d.refresh_from_db()
        self.assertIn(r.status_code, (400, 403, 409), f'PATCH sur devis "envoye" -> {r.status_code}, montant = {d.estimation_montant}')

    def test_q2_validating_twice_does_not_resend(self):
        d = self.devis(prix=(100,), estimation_montant=D('100'), statut='envoye')
        r, mail = self.valider(d)
        self.assertEqual(r.status_code, 400, f'revalidation -> {r.status_code}, email renvoyé={mail.called}')

    def test_q2_negative_line_price_rejected_by_api(self):
        d = self.devis(prix=())
        r = self.api.patch(f'/api/devis/{d.id}/', {'lignes': [{
            'description': 'x', 'quantite': 1, 'prix_unitaire': '-500.00', 'profil': 'junior'}]}, format='json')
        self.assertEqual(r.status_code, 400, f'prix_unitaire=-500 accepté ({r.status_code})')

    def test_q2_negative_cost_rejected_by_api(self):
        d = self.devis(mode='cout_reel')
        r = self.api.patch(f'/api/devis/{d.id}/', {'cout_reel': '-1000'}, format='json')
        d.refresh_from_db()
        self.assertEqual(r.status_code, 400, f'cout_reel=-1000 accepté -> estimation {d.estimation_montant}')

    def test_q2_estimation_is_derived_in_mode2_not_writable(self):
        d = self.devis(mode='cout_reel', cout_reel=D('1000'), estimation_montant=D('1300'))
        self.api.patch(f'/api/devis/{d.id}/', {'estimation_montant': '999999'}, format='json')
        d.refresh_from_db()
        self.assertEqual(d.estimation_montant, D('1300.00'), f'estimation écrasée à la main = {d.estimation_montant}')

    def test_q2_switching_to_mode2_recomputes_price(self):
        d = self.devis(mode='estimation_ia', cout_reel=D('1000'), estimation_montant=D('5000'))
        self.api.patch(f'/api/devis/{d.id}/', {'mode_tarification': 'cout_reel'}, format='json')
        d.refresh_from_db()
        self.assertEqual(d.estimation_montant, D('1300.00'),
                         f'mode passé à cout_reel, cout_reel=1000, prix resté {d.estimation_montant} (périmé)')

    def test_q2_mode2_pricing_applied_once(self):                           # caractérisation
        d = self.devis(mode='cout_reel')
        self.api.patch(f'/api/devis/{d.id}/', {'cout_reel': '1000'}, format='json')
        r = self.generer(d, {'synthese': 's', 'lignes': [ia_ligne(), ia_ligne(description='B')]})
        d.refresh_from_db()
        self.assertEqual(r.status_code, 200)
        self.assertEqual(d.estimation_montant, D('1300.00'))                # une seule marge, non écrasée par la génération
        self.assertTrue(all(l.prix_unitaire == 0 for l in d.lignes.all()))


# =====================================================================
# Q3 — données IA invalides
# =====================================================================
class Q3BadAiData(AuditBase):

    def _devis_with_lines(self):
        d = self.devis(prix=(100, 100), estimation_montant=D('200'))
        return d, d.lignes.count()

    def test_q3_unknown_profile_is_rejected_or_normalised(self):
        d, _ = self._devis_with_lines()
        r = self.generer(d, {'synthese': 's', 'lignes': [ia_ligne(profil_requis='architecte')]})
        stored = list(d.lignes.values_list('profil', flat=True))
        self.assertTrue(all(p in ('junior', 'senior', 'chef_de_projet') for p in stored),
                        f"statut {r.status_code}, profil enregistré={stored} (tarifé silencieusement comme 'junior')")

    def test_q3_profile_longer_than_20_chars_does_not_wipe_lines(self):
        d, before = self._devis_with_lines()
        r = self.generer(d, {'synthese': 's', 'lignes': [ia_ligne(profil_requis='ingenieur_logiciel_principal')]})
        self.assertEqual(d.lignes.count(), before, f'statut {r.status_code} ; lignes avant={before}, après={d.lignes.count()}')

    def test_q3_negative_days_rejected(self):
        d, _ = self._devis_with_lines()
        r = self.generer(d, {'synthese': 's', 'lignes': [ia_ligne(jours_estimes=-5)]})
        prix = list(d.lignes.values_list('prix_unitaire', flat=True))
        self.assertTrue(all(p > 0 for p in prix), f'statut {r.status_code}, prix des lignes = {prix}')

    def test_q3_null_days_does_not_wipe_lines(self):
        d, before = self._devis_with_lines()
        r = self.generer(d, {'synthese': 's', 'lignes': [ia_ligne(jours_estimes=None)]})
        self.assertEqual(d.lignes.count(), before, f'statut {r.status_code} ; lignes avant={before}, après={d.lignes.count()}')

    def test_q3_missing_description_does_not_wipe_lines(self):
        d, before = self._devis_with_lines()
        bad = ia_ligne()
        del bad['description']
        r = self.generer(d, {'synthese': 's', 'lignes': [bad]})
        self.assertEqual(d.lignes.count(), before, f'statut {r.status_code} ; lignes avant={before}, après={d.lignes.count()}')

    def test_q3_zero_people_is_rejected(self):
        d, _ = self._devis_with_lines()
        r = self.generer(d, {'synthese': 's', 'lignes': [ia_ligne(nombre_personnes=0)]})
        vals = list(d.lignes.values_list('nombre_personnes', 'prix_unitaire'))
        self.assertTrue(all(n >= 1 and p > 0 for n, p in vals), f'statut {r.status_code}, (personnes, prix) = {vals}')

    def test_q3_null_people_returns_clean_error(self):
        d, before = self._devis_with_lines()
        r = self.generer(d, {'synthese': 's', 'lignes': [ia_ligne(nombre_personnes=None)]})
        self.assertEqual(d.lignes.count(), before, f'statut {r.status_code} ; lignes avant={before}, après={d.lignes.count()}')

    def test_q3_unknown_complexity_is_rejected_or_normalised(self):
        d, _ = self._devis_with_lines()
        r = self.generer(d, {'synthese': 's', 'lignes': [ia_ligne(complexite='extreme')]})
        stored = list(d.lignes.values_list('complexite', flat=True))
        self.assertTrue(all(c in ('simple', 'moyenne', 'complexe') for c in stored),
                        f"statut {r.status_code}, complexité enregistrée={stored} (multiplicateur 1.0 appliqué en silence)")

    def test_q3_empty_line_list_does_not_wipe_existing_lines(self):
        d, before = self._devis_with_lines()
        r = self.generer(d, {'synthese': 's', 'lignes': []})
        self.assertEqual(d.lignes.count(), before, f'statut {r.status_code} ; lignes avant={before}, après={d.lignes.count()}')

    def test_q3_more_than_5_lines_is_capped(self):
        d, _ = self._devis_with_lines()
        self.generer(d, {'synthese': 's', 'lignes': [ia_ligne(description=f'L{i}') for i in range(12)]})
        self.assertLessEqual(d.lignes.count(), 5, f'{d.lignes.count()} lignes enregistrées (le prompt demande max 5)')

    def test_q3_ai_cannot_inject_a_price(self):                              # caractérisation
        TarifProfil.objects.create(profil='senior', tjm=D('300'), tjm_manuel=True)
        d = self.devis(prix=())
        self.generer(d, {'synthese': 's', 'lignes': [ia_ligne(prix_unitaire=99999, jours_estimes=1, complexite='simple')]})
        self.assertEqual(d.lignes.get().prix_unitaire, D('300'))

    # --- parsing de la réponse brute dans services/ia.py ---
    def _fake_anthropic(self, text):
        resp = mock.Mock()
        resp.content = [mock.Mock(text=text)]
        client = mock.Mock()
        client.messages.create.return_value = resp
        return mock.patch.object(ia_module.anthropic, 'Anthropic', return_value=client)

    def _call_ia(self, text):
        with mock.patch.dict('os.environ', {'ANTHROPIC_API_KEY': 'x', 'USE_MOCK_IA': 'false'}), self._fake_anthropic(text):
            return ia_module.generer_devis_ia('besoin', 'Client')

    def test_q3_ia_parses_fenced_json(self):                                 # caractérisation
        out = self._call_ia('```json\n{"synthese": "ok", "lignes": []}\n```')
        self.assertEqual(out['synthese'], 'ok')

    def test_q3_ia_rejects_preamble_before_json(self):                       # caractérisation
        with self.assertRaises(ValueError):                                  # json.JSONDecodeError hérite de ValueError
            self._call_ia('Voici le devis :\n{"synthese": "ok", "lignes": []}')

    def test_q3_ia_rejects_truncated_json(self):                             # caractérisation (max_tokens atteint)
        with self.assertRaises(ValueError):
            self._call_ia('{"synthese": "ok", "lignes": [{"description": "A", "profil_requ')

    def test_q3_ia_failure_before_generation_keeps_lines(self):              # caractérisation
        d, before = self._devis_with_lines()
        with mock.patch('devis.views.generer_devis_ia', side_effect=ValueError('json invalide')):
            r = self.api.post(f'/api/devis/{d.id}/generer_ia/')
        self.assertEqual((r.status_code, d.lignes.count()), (503, before))


# =====================================================================
# Q4 — marge : une seule fois, de façon cohérente ?
# =====================================================================
class Q4Margin(AuditBase):

    def test_q4_margin_has_a_single_source(self):
        defaut_param = ParametresTarification._meta.get_field('marge_beneficiaire').default
        self.assertEqual(D(str(defaut_param)), MARGE_DEFAUT,
                         f'mode 1 : marge codée en dur = {MARGE_DEFAUT} (pricing.py) ; mode 2 : ParametresTarification = {defaut_param}')

    def test_q4_markup_vs_margin_on_price(self):                             # caractérisation
        cout = D('6500')
        for markup in (D('0.20'), D('0.30')):
            prix = cout * (1 + markup)
            marge_reelle = (prix - cout) / prix
            print(f'\n  markup {markup:.0%} sur coût {cout} -> prix {prix} ; marge réelle sur le prix = {marge_reelle:.2%}')
        self.assertAlmostEqual(float((D('7800') - cout) / D('7800')), 0.1667, places=3)
        self.assertEqual(cout / (1 - D('0.20')), D('8125'))                  # prix pour 20% de MARGE sur le prix

    def test_q4_margin_parameter_rejects_percent_typed_as_fraction(self):
        p = ParametresTarification(marge_beneficiaire=D('20'))               # "20" tapé au lieu de 0.20
        try:
            p.full_clean()
            accepted = True
        except Exception:  # noqa: BLE001
            accepted = False
        p.save()
        self.assertFalse(accepted, f'marge=20 accepté -> 1000 de coût facturé {appliquer_marge_cout_reel(D("1000"))}')

    def test_q4_pricing_parameters_editable_in_django_admin(self):
        self.assertTrue(dj_admin.site.is_registered(ParametresTarification) and dj_admin.site.is_registered(TarifProfil),
                        'TarifProfil / ParametresTarification absents du Django admin (le docstring dit "ajuster via /admin/")')


# =====================================================================
# Q5 — fuites de salaire, arrondis
# =====================================================================
class Q5LeaksAndRounding(AuditBase):

    def test_q5_salary_not_exposed_to_anonymous(self):
        Employe.objects.bulk_create([Employe(nom='A', prenom='a', poste='dev', profil='senior', salaire=D('3000'), actif=True)])
        anon = APIClient()
        liste = anon.get('/api/equipe/')
        emp_id = Employe.objects.get().id
        detail = anon.get(f'/api/equipe/{emp_id}/')
        self.assertNotIn('salaire', liste.json()[0],
                         f'GET anonyme /api/equipe/ -> {liste.status_code} ; detail -> {detail.status_code} ; champ salaire présent')

    def test_q5_devis_and_clients_require_authentication(self):              # caractérisation
        anon = APIClient()
        self.assertIn(anon.get('/api/devis/').status_code, (401, 403))
        self.assertIn(anon.get('/api/clients/').status_code, (401, 403))

    def test_q5_vat_rounding_half_up(self):
        d = self.devis(prix=(1.5,), estimation_montant=D('1.50'))            # 1.50 x 19% = 0.285
        ctx = pdf_context(d)
        self.assertEqual(ctx['tva_montant'], D('0.29'), f"TVA sur 1.50 = {ctx['tva_montant']} (quantize par défaut = arrondi bancaire)")

    def test_q5_foreign_currency_lines_sum_to_total(self):
        d = self.devis(prix=(1.55, 1.55, 1.55), estimation_montant=D('4.65'), devise='EUR')
        ctx = pdf_context(d)
        somme = sum(l['total'] for l in ctx['lignes_affichage'])
        self.assertEqual(somme, ctx['estimation_affichage'], f"EUR : somme des lignes = {somme}, total affiché = {ctx['estimation_affichage']}")


# =====================================================================
# Compléments (PDF mode 2, confidentialité du prompt IA)
# =====================================================================
class Extras(AuditBase):

    def test_q2_mode2_pdf_does_not_show_zero_priced_lines(self):
        d = self.devis(mode='cout_reel', prix=(0, 0, 0), cout_reel=D('6500'), estimation_montant=D('8450'), statut='envoye')
        ctx = pdf_context(d)
        zeros = [l for l in ctx['lignes_affichage'] if l['prix_unitaire'] == 0]
        self.assertEqual(len(zeros), 0,
                         f"PDF envoyé au client : {len(zeros)}/{len(ctx['lignes_affichage'])} lignes à 0.00 pour un total de {ctx['total_ttc']}")

    def test_q5_ai_prompt_contains_no_salary(self):                          # caractérisation
        Employe.objects.bulk_create([Employe(nom='A', prenom='a', poste='Dev Backend', profil='senior', salaire=D('3141'))])
        captured = {}
        resp = mock.Mock()
        resp.content = [mock.Mock(text='{"synthese": "s", "lignes": []}')]
        client = mock.Mock()
        client.messages.create.side_effect = lambda **kw: (captured.update(kw), resp)[1]
        with mock.patch.dict('os.environ', {'ANTHROPIC_API_KEY': 'x', 'USE_MOCK_IA': 'false'}), \
             mock.patch.object(ia_module.anthropic, 'Anthropic', return_value=client):
            ia_module.generer_devis_ia('besoin', 'Client')
        prompt = captured['messages'][0]['content']
        self.assertNotIn('3141', prompt)
        self.assertIn('Dev Backend', prompt)
