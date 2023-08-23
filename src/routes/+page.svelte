<script>
    import { data } from "$lib/store.js";
    import { EURO, EUROWithCents } from "$lib/utils.js";
    import EuroInput from "$lib/EuroInput.svelte";
    import PourcentInput from "$lib/PourcentInput.svelte";
    import DateInput from "$lib/DateInput.svelte";

    import { endOfMonth, add, format, isBefore, set } from 'date-fns';
    import fr from 'date-fns/locale/fr/index.js';
    import { range } from 'radash';

    // Toutes les variables sont volontairement écrit en français

    let date_premier_jour_sans_emploi;

    $: date_premier_jour_sans_emploi = add(endOfMonth($data.dateDernierJourEmploi), {days: 1});

    $: $data.indemniteDepartNet = EURO($data.indemniteDepartNetInput);
    // let nombre_de_mois_de_salaire_en_indeminte_depart = 7;
    // Pour l'imposition, voir https://www.service-public.fr/particuliers/vosdroits/F408

    // https://www.unedic.org/indemnisation/fiches-thematiques
    // https://www.unedic.org/indemnisation/fiches-thematiques/differe-dindemnisation-specifique-en-cas-dindemnites-supra-legales
    let nombre_de_jour_differe_d_indemnisation_specifique;
    let premier_jour_indemnite;
    let premier_mois_versement_indemnité;
    let écheancier_par_mois;

    // https://www.unedic.org/indemnisation/vos-questions-sur-indemnisation-assurance-chomage/comment-est-calculee-mon-allocation-chomage
    let salaireJournalierDeRéférence;
    $: {
        salaireJournalierDeRéférence = EUROWithCents(
            ($data.votreSalaireBrutATIlVariéAuCoursDes24DerniersMois == "non") ?
                ($data.salaireBrutParMoisEnEurosInput * 24) / (2 * 365) :
                (
                    $data.salairesBrutParMoisEnEuros.reduce(
                        (accumulator, currentValue) => accumulator + (currentValue === null ? 0 : parseInt(currentValue)),
                        0
                    ) / (2 * 365)
                )
        );

        // La valeur vient de https://www.unedic.org/indemnisation/vos-questions-sur-indemnisation-assurance-chomage/comment-est-calculee-mon-allocation-chomage
        // Un plafond limite ce montant: l'allocation est au maximum de 274,80 € brut par jour
        if (salaireJournalierDeRéférence.value > 274.80) {
            salaireJournalierDeRéférence = EUROWithCents(274.80);
        }
    }

    $: $data.salaireBrutParMoisEnEuros = EURO($data.salaireBrutParMoisEnEurosInput);

    let salaireAnnuelDeRéférenceEnEuros;

    $: salaireAnnuelDeRéférenceEnEuros = EURO(salaireJournalierDeRéférence).multiply(365);

    let allocationJournalièreTauxPleinEnEuros;
    let allocationMensuelleApproxamativeTauxPleinEnEuros;

    // https://www.unedic.org/indemnisation/vos-questions-sur-indemnisation-assurance-chomage/mon-ancien-salaire-brut-mensuel
    $: {
        allocationJournalièreTauxPleinEnEuros = EUROWithCents(salaireJournalierDeRéférence * 0.57);
        allocationMensuelleApproxamativeTauxPleinEnEuros = allocationJournalièreTauxPleinEnEuros.multiply(30);
    }

    let allocationJournalièreTauxRéduitEnEuros;
    let allocationMensuelleApproxamativeTauxRéduitEnEuros;

    // https://www.unedic.org/indemnisation/vos-questions-sur-indemnisation-assurance-chomage/mon-ancien-salaire-brut-mensuel
    $: {
        if (allocationJournalièreTauxPleinEnEuros.value > 130.02) {
            allocationJournalièreTauxRéduitEnEuros = allocationJournalièreTauxPleinEnEuros.multiply(0.7);
        } else {
            allocationJournalièreTauxRéduitEnEuros = allocationJournalièreTauxPleinEnEuros;
        }
        allocationMensuelleApproxamativeTauxRéduitEnEuros = allocationJournalièreTauxRéduitEnEuros.multiply(30)
    }

    $: $data.dernierSalaireNetParMoisEnEuros = EURO($data.dernierSalaireNetParMoisEnEurosInput);

    $: {
        nombre_de_jour_differe_d_indemnisation_specifique = $data.indemniteDepartNet.value / 102.4;
        if ((nombre_de_jour_differe_d_indemnisation_specifique) > 150) {
            nombre_de_jour_differe_d_indemnisation_specifique = 150;
        }
        premier_jour_indemnite = add(date_premier_jour_sans_emploi, { days: nombre_de_jour_differe_d_indemnisation_specifique});
        premier_mois_versement_indemnité = set(add(premier_jour_indemnite, { months: 1}), { date: 1});

        let cumul_indemnité_chomage = $data.indemniteDepartNet;
        let cumul_salaire_du_cdi_quitté = EURO(0);

        let result;
        // 18 mois indiqué page 4 de https://www.unedic.org/sites/default/files/2023-07/PRE-CIRC-Circulaire_n_2023-08_du_26_juillet_2023.pdf
        écheancier_par_mois = Array.from(range(0, 18)).map((mois) => {
            result = {
                date: add(date_premier_jour_sans_emploi, {months: mois}),

                indémnité_chomage: montant_indemnite_chomage_pour_un_mois_precis(mois).multiply(
                    1 - ($data.tauxImpôtSurLeRevenuEnPourcentInput / 100)
                ),
                cumul_indemnité_chomage: null,
                équivalent_salaire_lissé: null,

                salaire_du_cdi_quitte: $data.dernierSalaireNetParMoisEnEuros.multiply(
                    1 - ($data.tauxImpôtSurLeRevenuEnPourcentInput / 100)
                ),
                cumul_salaire_du_cdi_quitté: null,
                différence_chomage_cdi: null
            }

            cumul_indemnité_chomage = cumul_indemnité_chomage.add(result.indémnité_chomage);
            cumul_salaire_du_cdi_quitté = cumul_salaire_du_cdi_quitté.add(result.salaire_du_cdi_quitte);
            result.cumul_indemnité_chomage = cumul_indemnité_chomage;
            result.équivalent_salaire_lissé = cumul_indemnité_chomage.divide(mois + 1);
            result.cumul_salaire_du_cdi_quitté = cumul_salaire_du_cdi_quitté;
            result.différence_chomage_cdi = cumul_indemnité_chomage.subtract(cumul_salaire_du_cdi_quitté);

            return result;
        });
    }

    function montant_indemnite_chomage_pour_un_mois_precis(numero_mois) {
        let date_du_mois_a_calculer = add(date_premier_jour_sans_emploi, {months: numero_mois});
        if (isBefore(date_du_mois_a_calculer, premier_jour_indemnite)) {
            return EURO(0);
        }

        if (isBefore(date_du_mois_a_calculer, add(premier_jour_indemnite, { months: 6}))) {
            return allocationMensuelleApproxamativeTauxPleinEnEuros;
        }

        if (isBefore(date_du_mois_a_calculer, add(premier_jour_indemnite, { months: 24}))) {
            return allocationMensuelleApproxamativeTauxRéduitEnEuros;
        }

        return 0;
    }
</script>

<div class="prose prose-slate max-w-none">
    <p>Ce formulaire vous permet de comparer vos revenus dans les deux situations suivantes :</p>

    <ul>
        <li>a. en situation de chômage suite à la signature d'une rupture conventionnelle</li>
        <li>b. en situation de CDI (vous avez gardé votre CDI)</li>
    </ul>

    <p>Attention, ce formulaire est valide seulement si <u title="Je pense que je n'utilise pas ici le bon
        vocabulaire">vous avez rechargé tous vos droits chômage</u>, plus concrètement, cela signifie que vous êtes en CDI depuis au moins 24 mois.</p>

    <p>Ce simulateur prend en compte les évolutions règlementaires de l'assurance chômage jusqu'à <a href="https://www.unedic.org/espace-presse/actualites/publication-de-la-circulaire-2023-08-relative-la-reglementation-dassurance">la
        circulaire 2023-08</a>.</p>

    <p>Pour faire la simulation, veuillez remplir les informations suivantes :<br />
        <small>(
            Ces informations ne sont pas envoyées sur
            le serveur, ces données restent uniquement dans votre navigateur internet.<br />

            Si vous partagez la page avec les paramètres dans l'URL, ces paramètres seront visibles dans les
            logs du serveur, si vous souhaitez garder secret ces informations, vous pouvez partager avec vos
            amis la version YAML des données, cela vous permet de garder toutes ces informations secrètes.)</small></p>

</div>

<div class="rounded-md bg-yellow-50 p-4 my-8">
    <div class="flex">
        <div class="flex-shrink-0">
            <svg class="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
            </svg>
        </div>
        <div class="ml-3">
            <h3 class="text-sm font-medium text-yellow-800">Avertissement</h3>
            <div class="mt-2 text-sm text-yellow-700">
                <p>Cette simulation, ces calculs sont indicatifs. Ils ne substituent pas aux décomptes rééels de <a
                    href="https://www.unedic.org/">Unédic</a> ou <a href="https://www.pole-emploi.fr">Pôle emploi</a> ou de toute autre organisme..</p>
            </div>
        </div>
    </div>
</div>

<form>
    <div class="space-y-12 sm:space-y-16">
        <div>
            <div class="my-10 space-y-8 border-b border-gray-900/10 pb-12 sm:space-y-0 sm:divide-y sm:divide-gray-900/10 sm:border-t sm:pb-0">
                <div class="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label for="date_dernier_jour_emploi" class="block text-sm leading-6 text-gray-900
                        sm:pt-1.5 font-semibold">Date de fin du contrat de travail :</label>
                    <div class="mt-2 sm:col-span-2 sm:mt-0">
                        <DateInput
                            id="date_dernier_jour_emploi"
                            name="date_dernier_jour_emploi"
                            bind:date={$data.dateDernierJourEmploi}
                            class="block w-auto rounded-md border-0 px-2 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset
                            ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600
                            sm:text-sm sm:leading-6" />
                    </div>
                </div>
                <div class="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label
                        for="indemnite_depart_net"
                        class="block text-sm leading-6 text-gray-900 sm:pt-1.5 font-semibold"
                    >Montant d'indemnités légales + supralégales liées à la rupture du contrat de travail :</label>
                    <EuroInput
                        id="indemnite_depart_net"
                        name="indemnite_depart_net"
                        bind:value={$data.indemniteDepartNetInput}
                    />
                </div>
                <div class="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label
                        for="dernier_salaire_net_par_mois_en_euros"
                        class="block text-sm leading-6 text-gray-900 sm:pt-1.5 font-semibold"
                    >Votre dernier salaire net par mois (le dernier mois complet) :</label>
                    <EuroInput
                        id="dernier_salaire_net_par_mois_en_euros"
                        name="dernier_salaire_net_par_mois_en_euros"
                        bind:value={$data.dernierSalaireNetParMoisEnEurosInput}
                    />
                </div>
                <fieldset>
                    <legend class="sr-only">Votre salaire brut a-t-il varié au cours des 24 derniers mois :</legend>
                    <div class="sm:grid sm:grid-cols-3 sm:items-baseline sm:gap-4 sm:py-6">
                        <div class="text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">Votre salaire brut a-t-il varié au cours des 24 derniers mois :</div>
                        <div class="mt-1 sm:col-span-2 sm:mt-0">
                            <div class="max-w-lg">
                                <div class="mt-6 space-y-6">
                                    <div class="flex items-center gap-x-3">
                                        <input
                                            id="votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois_non"
                                            name="votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois"
                                            type="radio"
                                            value="non"
                                            bind:group={$data.votreSalaireBrutATIlVariéAuCoursDes24DerniersMois}
                                            class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                        />
                                        <label
                                            for="votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois_non"
                                            class="block text-sm font-medium leading-6
                                            text-gray-900"
                                        >Non</label>
                                    </div>
                                    <div class="flex items-center gap-x-3">
                                        <input
                                            id="votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois_oui"
                                            name="votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois"
                                            type="radio"
                                            value="oui"
                                            bind:group={$data.votreSalaireBrutATIlVariéAuCoursDes24DerniersMois}
                                            class="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                        />
                                        <label
                                            for="votre_salaire_brut_a_t_il_varié_au_cours_des_24_derniers_mois_oui"
                                            class="block text-sm font-medium leading-6
                                            text-gray-900"
                                        >Oui</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </fieldset>
                {#if $data.votreSalaireBrutATIlVariéAuCoursDes24DerniersMois == 'non'}
                    <div class="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                        <label
                            for="salaire_brut_par_mois_en_euros"
                            class="block text-sm leading-6 text-gray-900 sm:pt-1.5 font-semibold"
                        >Votre salaire brut par mois :</label>
                        <EuroInput
                            id="salaire_brut_par_mois_en_euros"
                            name="salaire_brut_par_mois_en_euros"
                            bind:value={$data.salaireBrutParMoisEnEurosInput}
                        />
                    </div>
                {:else}
                    <div class="sm:grid sm:grid-cols-1 sm:items-start sm:gap-4 sm:py-6">
                        <label
                            for="salaire_brut_par_mois_en_euros"
                            class="block text-sm leading-6 text-gray-900 sm:pt-1.5 font-semibold"
                        >Vos 24 derniers salaires bruts par mois :</label>
                        <div class="flex flex-row flex-wrap gap-4">
                            {#each $data.salairesBrutParMoisEnEuros as v, i}
                                <div class="flex flex-col">
                                    <label class="whitespace-now text-center">
                                        {format(
                                            add(date_premier_jour_sans_emploi, {months: (-24 + i)}),
                                            'MMM yyyy', { locale: fr}
                                        )}
                                    </label>
                                    <div class="relative mt-2 rounded-md shadow-sm w-24">
                                        <input
                                            type="text"
                                            bind:value={v}
                                            class="block w-full rounded-md border-0 py-1.5 pl-3 pr-7 text-gray-900 ring-1 ring-inset
                                            ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600
                                            sm:text-sm sm:leading-6 text-right" />
                                        <div class="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                            <span class="text-gray-500 sm:text-sm" id="price-currency">€</span>
                                        </div>
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>
                {/if}
                <div class="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label
                        for="taux_impôt_sur_le_revenu_en_pourcent"
                        class="block text-sm leading-6 text-gray-900 sm:pt-1.5 font-semibold"
                    >Taux d'impôt sur le revenu à appliquer sur les salaires ou indemnités :</label>
                    <PourcentInput
                        id="taux_impôt_sur_le_revenu_en_pourcent"
                        name="taux_impôt_sur_le_revenu_en_pourcent"
                        bind:value={$data.tauxImpôtSurLeRevenuEnPourcentInput}
                    />
                    <p>Attention, l'algorithme de calcul du salaire net après impôt sur le revenu contient des
                        approximations qui seront corrigées par <a
                            href="https://github.com/stephane-klein/comparateur-rupture-conventionnelle-cdi-france/issues/1">#1</a>.
                </div>
            </div>
        </div>
    </div>
</form>

<div class="prose prose-slate max-w-none">
    <p>Paramètres calculés :</p>

    <ul>
        <li>Salaire journalier de référence : {salaireJournalierDeRéférence.format()} (<a href="https://www.unedic.org/indemnisation/vos-questions-sur-indemnisation-assurance-chomage/comment-est-calculee-mon-allocation-chomage">documentation</a>)</li>
        <li>Nombre de jours différés d'indemnisation spécifique : {nombre_de_jour_differe_d_indemnisation_specifique}
            (<a href="https://www.unedic.org/indemnisation/fiches-thematiques/differe-dindemnisation-specifique-en-cas-dindemnites-supra-legales">documentation</a>)</li>
        <li>Premier jour de versement d'indemnité : {format(premier_mois_versement_indemnité, 'dd MMM yyyy', { locale: fr})}
            ({format(date_premier_jour_sans_emploi, 'dd MMM yyyy', { locale: fr})} +
            {nombre_de_jour_differe_d_indemnisation_specifique} jours + début du mois suivant)</li>
        <li>Salaire annuel de référence : {salaireAnnuelDeRéférenceEnEuros.format()} (<a
            href="https://www.unedic.org/indemnisation/vos-questions-sur-indemnisation-assurance-chomage/comment-est-calculee-mon-allocation-chomage">documentation</a>)</li>
        <li>Allocation d’aide au retour à l’emploi : (<a
            href="https://www.unedic.org/indemnisation/vos-questions-sur-indemnisation-assurance-chomage/mon-ancien-salaire-brut-mensuel">documentation</a>)
            <ul>
                <li>taux plein les 6 premiers mois : {allocationMensuelleApproxamativeTauxPleinEnEuros.format()} (30 x {allocationJournalièreTauxPleinEnEuros} €/jour)</li>
                <li>taux réduit à partir du 7ème mois : {allocationMensuelleApproxamativeTauxRéduitEnEuros.format()} (30 x {allocationJournalièreTauxRéduitEnEuros} €/jour)</li>
            </ul>
        </li>
    </ul>
</div>

<div class="prose prose-slate max-w-none mt-8">
    <p>Voici le résultat de la simulation :</p>
</div>
<table class="my-4 w-full">
    <tr>
        <th></th>
        <th
            colspan="3"
            class="px-4 py-0.5"
        >Revenus au chômage, après impôts (a)</th>
        <th
            colspan="2"
            class="px-4 py-0.5"
        >Revenus du CDI quitté, après impôts (b)</th>
        <th></th>
    </tr>
    <tr>
        <th class="p-4 border-r border-r-1 border-r-gray-500">Mois</th>
        <th class="p-4">Indemnité par mois</th>
        <th class="p-4">Cumul</th>
        <th
            class="p-4 border-r border-r-1 border-r-gray-500"
            >Équivalent salaire lissé</th>
        <th class="p-4">Salaire net par mois</th>
        <th class="p-4 border-r border-r-1 border-r-gray-500">Cumul</th>
        <th class="p-4" title="Différence de revenu de la situation au chômage - les revenus du CDI">Différence</th>
    </tr>
    {#each écheancier_par_mois as mois, i }
        <tr>
            <td
                class="text-right font-mono border-gray-200 px-4 py-0.5 border-r border-r-1 border-r-gray-500 whitespace-nowrap"
                class:border-t={i > 0}
            >{format(mois.date, 'MMM yyyy', { locale: fr})}</td>
            <td
                class="text-right font-mono border-gray-200 px-4 py-0.5 border-r whitespace-nowrap"
                class:border-t={i > 0}
            >{mois.indémnité_chomage.format()}</td>
            <td
                class="text-right font-mono border-gray-200 px-4 py-0.5 border-r whitespace-nowrap"
                class:border-t={i > 0}
                class:bg-green-200={mois.différence_chomage_cdi > 0}
            >{mois.cumul_indemnité_chomage.format()}</td>
            <td
                class="text-right font-mono px-4 py-0.5 border-r border-r-1 border-r-gray-500 whitespace-nowrap"
                class:border-t={i > 0}
            >{mois.équivalent_salaire_lissé.format()}</td>
            <td
                class="text-right font-mono border-gray-200 px-4 py-0.5 border-r whitespace-nowrap"
                class:border-t={i > 0}
            >{mois.salaire_du_cdi_quitte.format()}</td>
            <td
                class="text-right font-mono px-4 py-0.5 whitespace-nowrap border-r border-r-1 border-r-gray-500"
                class:border-t={i > 0}
                class:bg-green-200={mois.différence_chomage_cdi < 0}
            >{mois.cumul_salaire_du_cdi_quitté.format()}</td>
            <td
                class="text-right font-mono border-gray-200 px-4 py-0.5 whitespace-nowrap"
                class:border-t={i > 0}
            >{mois.différence_chomage_cdi.format()}</td>
        </tr>
    {/each}
</table>
